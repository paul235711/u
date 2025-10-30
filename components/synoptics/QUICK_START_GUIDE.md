# Quick Start: Week 1 Implementation Guide

This guide helps you start the refactoring with immediate, low-risk wins.

---

## Day 1: Setup Infrastructure

### Install Dependencies

```bash
npm install zustand @tanstack/react-query zod
npm install -D @tanstack/react-query-devtools
```

### Create Base Structure

```bash
mkdir -p components/synoptics-v2/{stores,hooks,services,api}
```

### 1. Create API Client

**File:** `components/synoptics-v2/api/client.ts`

```typescript
import { z } from 'zod';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL = '/api/synoptics';

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: 'Unknown error' 
        }));
        throw new APIError(
          error.error || 'Request failed',
          response.status,
          error
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Network request failed', 0, error);
    }
  }

  // Layout endpoints
  async getLayout(id: string) {
    return this.request(`/layouts/${id}`);
  }

  async updateNodePosition(nodeId: string, layoutId: string, position: { x: number; y: number }) {
    return this.request(`/node-positions/update`, {
      method: 'PUT',
      body: JSON.stringify({
        nodeId,
        layoutId,
        xPosition: position.x,
        yPosition: position.y,
      }),
    });
  }

  // Add more methods as needed...
}

export const apiClient = new APIClient();
```

### 2. Setup React Query Provider

**File:** `app/providers.tsx` (or update existing)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes (was cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**Update:** `app/layout.tsx`

```typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Day 2: Create Zustand Store

**File:** `components/synoptics-v2/stores/ui-store.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Editor state
  isLocked: boolean;
  isFullscreen: boolean;
  
  // Panel visibility
  panels: {
    stats: boolean;
    filters: boolean;
    legend: boolean;
    locationFilter: boolean;
    valveImpact: boolean;
    shortcuts: boolean;
  };
  
  // Selection
  selectedElementId: string | null;
  
  // Actions
  toggleLock: () => void;
  toggleFullscreen: () => void;
  togglePanel: (panel: keyof UIState['panels']) => void;
  selectElement: (id: string | null) => void;
  reset: () => void;
}

const initialPanels = {
  stats: false,
  filters: false,
  legend: true,
  locationFilter: false,
  valveImpact: false,
  shortcuts: false,
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isLocked: true,
      isFullscreen: false,
      panels: initialPanels,
      selectedElementId: null,

      toggleLock: () => 
        set((state) => ({ isLocked: !state.isLocked }), false, 'toggleLock'),

      toggleFullscreen: () =>
        set((state) => ({ isFullscreen: !state.isFullscreen }), false, 'toggleFullscreen'),

      togglePanel: (panel) =>
        set(
          (state) => ({
            panels: { ...state.panels, [panel]: !state.panels[panel] },
          }),
          false,
          `togglePanel/${panel}`
        ),

      selectElement: (id) => 
        set({ selectedElementId: id }, false, 'selectElement'),

      reset: () =>
        set(
          { isLocked: true, isFullscreen: false, panels: initialPanels, selectedElementId: null },
          false,
          'reset'
        ),
    }),
    { name: 'SynopticsUI' }
  )
);
```

---

## Day 3: Create React Query Hooks

**File:** `components/synoptics-v2/hooks/use-layout.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

// Query hook
export function useLayout(layoutId: string) {
  return useQuery({
    queryKey: ['layout', layoutId],
    queryFn: () => apiClient.getLayout(layoutId),
    enabled: !!layoutId,
  });
}

// Mutation hook
export function useUpdateNodePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      nodeId, 
      layoutId, 
      position 
    }: { 
      nodeId: string; 
      layoutId: string; 
      position: { x: number; y: number } 
    }) => {
      return apiClient.updateNodePosition(nodeId, layoutId, position);
    },
    
    // Optimistic update
    onMutate: async ({ nodeId, layoutId, position }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['layout', layoutId] });

      // Snapshot previous value
      const previousLayout = queryClient.getQueryData(['layout', layoutId]);

      // Optimistically update
      queryClient.setQueryData(['layout', layoutId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          nodes: old.nodes.map((node: any) =>
            node.id === nodeId
              ? { ...node, position: { xPosition: position.x, yPosition: position.y } }
              : node
          ),
        };
      });

      return { previousLayout };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousLayout) {
        queryClient.setQueryData(['layout', variables.layoutId], context.previousLayout);
      }
    },

    // Refetch on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layout', variables.layoutId] });
    },
  });
}
```

---

## Day 4: Create Sample Component

**File:** `components/synoptics-v2/components/LayoutEditorHeader.tsx`

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '../stores/ui-store';

export function LayoutEditorHeader() {
  const isLocked = useUIStore((state) => state.isLocked);
  const toggleLock = useUIStore((state) => state.toggleLock);
  const showStats = useUIStore((state) => state.panels.stats);
  const showFilters = useUIStore((state) => state.panels.filters);
  const togglePanel = useUIStore((state) => state.togglePanel);

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            Layout Editor
            {isLocked ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : (
              <Unlock className="h-4 w-4 text-blue-600" />
            )}
          </h1>
          <p className="text-xs text-gray-500">
            {isLocked ? 'View Mode • Click unlock to edit' : 'Edit Mode • Auto-save enabled'}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Lock Toggle */}
          <Button
            variant={isLocked ? 'outline' : 'default'}
            size="sm"
            onClick={toggleLock}
            className={!isLocked ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {isLocked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock to Edit
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock View
              </>
            )}
          </Button>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePanel('filters')}
            className={showFilters ? 'bg-blue-50' : ''}
          >
            {showFilters ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            Filters
          </Button>

          {/* Stats Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePanel('stats')}
            className={showStats ? 'bg-blue-50' : ''}
          >
            {showStats ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            Stats
          </Button>
        </div>
      </div>
    </header>
  );
}
```

---

## Day 5: Test & Integrate

### 1. Create Test Page

**File:** `app/(dashboard)/test-new-editor/page.tsx`

```typescript
import { LayoutEditorHeader } from '@/components/synoptics-v2/components/LayoutEditorHeader';

export default function TestPage() {
  return (
    <div className="h-screen flex flex-col">
      <LayoutEditorHeader />
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">New Editor Test</h2>
          <p className="text-gray-600">
            Try toggling the lock and panel buttons above. State is managed by Zustand!
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <StateDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}

function StateDisplay() {
  const isLocked = useUIStore((state) => state.isLocked);
  const panels = useUIStore((state) => state.panels);

  return (
    <pre className="text-left bg-gray-100 p-4 rounded text-sm">
      {JSON.stringify({ isLocked, panels }, null, 2)}
    </pre>
  );
}
```

### 2. Test Navigation

Visit: `http://localhost:3000/test-new-editor`

**What to verify:**
- ✅ Lock toggle works
- ✅ Panel toggles work
- ✅ State persists across toggles
- ✅ Redux DevTools shows actions (open browser dev tools)

### 3. Check React Query DevTools

Visit any page with a query hook and click the React Query DevTools icon (bottom-left).

**What to verify:**
- ✅ Queries are cached
- ✅ Mutations show up
- ✅ Cache invalidation works

---

## Measuring Success

### Before (Current State)

```bash
# Count useState calls
grep -r "useState" components/synoptics/*.tsx | wc -l
# Should show ~119
```

### After Week 1 (Goal)

```bash
# Count useState in NEW components
grep -r "useState" components/synoptics-v2/*.tsx | wc -l
# Should show ~5 (only for local UI state)

# Verify Zustand usage
grep -r "useUIStore" components/synoptics-v2/*.tsx | wc -l
# Should show 10+

# Verify React Query usage
grep -r "useQuery\|useMutation" components/synoptics-v2/hooks/*.ts | wc -l
# Should show 5+
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module 'zustand'"

**Solution:**
```bash
npm install zustand
# or
pnpm add zustand
```

### Issue 2: React Query hooks not working

**Solution:** Make sure `Providers` wrapper is in your root layout:
```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Issue 3: Zustand DevTools not showing

**Solution:**
1. Install Redux DevTools browser extension
2. Ensure `devtools` middleware is used in store
3. Check console for errors

### Issue 4: TypeScript errors

**Solution:**
```bash
# Update TypeScript
npm install -D typescript@latest

# Check types
npx tsc --noEmit
```

---

## Next Steps

After completing Week 1:

1. **Week 2:** Migrate one existing component
   - Choose `element-properties-panel.tsx` (smaller, isolated)
   - Replace useState with Zustand
   - Replace fetch with React Query
   - A/B test with feature flag

2. **Week 3:** Migrate `unified-layout-editor.tsx`
   - Split into 4-5 smaller components
   - Move state to Zustand
   - Move API calls to React Query
   - Keep old version as fallback

3. **Week 4:** Performance testing
   - Measure render times
   - Add memoization where needed
   - Implement virtual scrolling for lists

4. **Week 5-6:** Full migration and cleanup
   - Move all components to new structure
   - Remove old code
   - Update documentation

---

## Resources

- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Zod Docs](https://zod.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## Checklist

Week 1 completion checklist:

- [ ] Installed dependencies
- [ ] Created API client with error handling
- [ ] Setup React Query provider
- [ ] Created Zustand UI store
- [ ] Created sample query hooks
- [ ] Built test component
- [ ] Verified state management works
- [ ] Verified React Query works
- [ ] Tested in development
- [ ] Documented approach

**When all checked:** Ready to proceed to Week 2! 🚀
