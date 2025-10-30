# Synoptics Frontend Refactoring Proposal

**Date:** October 30, 2025  
**Status:** Proposal  
**Priority:** High

---

## Executive Summary

The synoptics component tree has grown organically and now contains **~11,000+ lines of code** across **50+ files**. While some good patterns exist (custom hooks, shared utilities), the architecture suffers from:

- **Excessive state management complexity** (119 `useState` calls across 21 files)
- **Prop drilling** (organizationId, siteId passed through 5+ levels)
- **Scattered API logic** (direct `fetch` calls in 15+ components)
- **Large monolithic components** (4 components >400 lines)
- **Type duplication** (similar interfaces in 8+ files)

**Estimated Impact:**
- **Current maintenance cost:** High (45+ min to understand component interactions)
- **Bug surface area:** Large (distributed state synchronization issues)
- **Developer velocity:** Slowed by complexity

---

## Current Architecture Analysis

### Directory Structure
```
synoptics/
├── [Main Components]
│   ├── unified-layout-editor.tsx        (914 lines) ⚠️ CRITICAL
│   ├── site-hierarchy-manager-v2.tsx    (678 lines) ⚠️ CRITICAL
│   ├── equipment-import-dialog.tsx      (601 lines) ⚠️ HIGH
│   ├── element-properties-panel.tsx     (428 lines) ⚠️ HIGH
│   └── enhanced-synoptic-viewer.tsx     (317 lines)
├── forms/                               (4 form components)
├── hierarchy/                           (13 modular components) ✅
├── nodes/                               (3 node type components) ✅
├── shared/                              (7 utility modules) ✅
└── sites/                               (6 site management components)
```

### Critical Issues Identified

#### 1. **State Management Chaos**
```typescript
// unified-layout-editor.tsx alone has 21+ useState calls
const [layout, setLayout] = useState(initialLayout);
const [isLocked, setIsLocked] = useState(true);
const [draggedElementType, setDraggedElementType] = useState(null);
const [dropPosition, setDropPosition] = useState(null);
const [showQuickAdd, setShowQuickAdd] = useState(false);
const [selectedElement, setSelectedElement] = useState(null);
const [filters, setFilters] = useState(createDefaultFilters());
const [showStats, setShowStats] = useState(false);
const [showFilters, setShowFilters] = useState(false);
// ... 12 more useState calls
```

**Issues:**
- No single source of truth
- State synchronization bugs (layout state vs server state)
- Difficult to debug state transitions
- Performance issues with excessive re-renders

#### 2. **Monolithic Component Syndrome**

**`unified-layout-editor.tsx` (914 lines):**
- Handles: Layout state, UI toggles, filters, dialogs, CRUD operations, keyboard shortcuts
- Mixed concerns: Business logic + UI rendering + API calls + event handling
- 15+ handler functions, 10+ useEffect hooks
- Impossible to test in isolation

**`site-hierarchy-manager-v2.tsx` (678 lines):**
- Manages entire site hierarchy tree rendering
- CRUD for buildings/floors/zones/valves
- Complex nested UI logic
- Tightly coupled to data fetching

#### 3. **API Layer Anti-patterns**

```typescript
// Example from 15+ locations
const response = await fetch('/api/synoptics/valves', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ organizationId, name, valveType, gasType }),
});
if (!response.ok) throw new Error('Failed to create valve');
const valve = await response.json();
```

**Issues:**
- No centralized API client
- Inconsistent error handling
- No request deduplication
- No caching strategy
- Manual cache invalidation via `router.refresh()`

#### 4. **Prop Drilling Nightmare**

```
App
└─ UnifiedLayoutEditor (organizationId, siteId)
   ├─ ElementPropertiesPanel (organizationId)
   ├─ EquipmentImportDialog (organizationId, siteId, layoutId)
   │  └─ [needs to fetch buildings/floors/zones]
   └─ HierarchicalLocationFilter (organizationId)
      └─ [needs to fetch site hierarchy]
```

**Count:** 
- `organizationId` passed through 12+ components
- `siteId` passed through 8+ components
- Layout data reconstructed 5+ times

#### 5. **Type System Fragmentation**

**Duplicate/similar types found in:**
- `hierarchy/types.ts` - ValveInfo, Building, Floor, Zone
- `element-properties-panel.tsx` - SiteData, BuildingData, FloorData, ZoneData
- `equipment-import-dialog.tsx` - Building, Floor, Zone (again!)
- `shared/network-utils.ts` - NetworkNode, NetworkConnection

**Result:** Type mismatches, unsafe type assertions, inconsistent data shapes

#### 6. **Performance Bottlenecks**

**Identified issues:**
1. **Re-fetching on every render** - `useEffect` with missing dependencies
2. **No memoization** - Network stats recalculated on every state change
3. **Cascading fetches** - Loading floors → then zones → then equipment
4. **No virtual scrolling** - 500+ equipment items render all at once
5. **Uncontrolled re-renders** - 21 state variables trigger full component re-render

---

## Proposed Architecture

### Phase 1: Foundation (Week 1-2)

#### 1.1 Centralized State Management with Zustand

**Why Zustand?**
- Lightweight (1KB)
- No Provider boilerplate
- Built-in dev tools
- TypeScript-first
- Works with Next.js App Router

**Structure:**
```typescript
// stores/synoptics-store.ts
interface SynopticsStore {
  // Layout State
  currentLayout: Layout | null;
  layouts: Layout[];
  setLayout: (layout: Layout) => void;
  
  // UI State
  isEditMode: boolean;
  selectedElement: Element | null;
  visiblePanels: PanelState;
  filters: NetworkFilters;
  
  // Hierarchy State
  sites: Site[];
  buildings: Building[];
  floors: Floor[];
  zones: Zone[];
  
  // Actions
  actions: {
    updateElement: (id: string, data: Partial<Element>) => Promise<void>;
    deleteElement: (id: string) => Promise<void>;
    createConnection: (from: string, to: string) => Promise<void>;
    // ... more actions
  };
}
```

**Benefits:**
- Single source of truth
- Predictable state updates
- Easy to debug with Redux DevTools
- Eliminates prop drilling

#### 1.2 API Layer with React Query

```typescript
// api/synoptics-client.ts
class SynopticsAPIClient {
  private baseURL = '/api/synoptics';
  
  async getLayout(id: string): Promise<Layout> { /* ... */ }
  async updateNodePosition(nodeId: string, position: Position): Promise<void> { /* ... */ }
  async createValve(data: CreateValveDTO): Promise<Valve> { /* ... */ }
  // ... typed methods for all endpoints
}

// hooks/use-layout.ts
export function useLayout(layoutId: string) {
  return useQuery({
    queryKey: ['layout', layoutId],
    queryFn: () => apiClient.getLayout(layoutId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// hooks/use-create-valve.ts
export function useCreateValve() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createValve,
    onSuccess: () => {
      // Automatic cache invalidation
      queryClient.invalidateQueries({ queryKey: ['valves'] });
    },
  });
}
```

**Benefits:**
- Automatic caching
- Request deduplication
- Optimistic updates
- Error retry logic
- Loading/error states built-in

#### 1.3 Unified Type System

```typescript
// types/index.ts
export namespace Synoptics {
  // Core Entities
  export interface Site {
    id: string;
    name: string;
    organizationId: string;
    coordinates?: Coordinates;
  }
  
  export interface Building {
    id: string;
    name: string;
    siteId: string;
    floors: Floor[];
  }
  
  export interface Node {
    id: string;
    nodeType: 'source' | 'valve' | 'fitting';
    elementId: string;
    name: string;
    gasType: GasType;
    position: Position;
    location?: NodeLocation;
  }
  
  // DTOs
  export namespace DTO {
    export interface CreateNode { /* ... */ }
    export interface UpdateNode { /* ... */ }
  }
}
```

### Phase 2: Component Decomposition (Week 3-4)

#### 2.1 Split Monolithic Components

**Before: `unified-layout-editor.tsx` (914 lines)**

**After:**
```
layout-editor/
├── LayoutEditorContainer.tsx          (100 lines) - Container/orchestrator
├── LayoutEditorHeader.tsx             (80 lines)  - Toolbar & actions
├── LayoutEditorCanvas.tsx             (120 lines) - ReactFlow wrapper
├── LayoutEditorSidebar.tsx            (60 lines)  - Side panels container
└── hooks/
    ├── use-layout-state.ts            (50 lines)  - Layout state logic
    ├── use-element-crud.ts            (80 lines)  - CRUD operations
    └── use-keyboard-shortcuts.ts      (existing)  - Keyboard handling
```

**Responsibility breakdown:**
- **Container:** Route params, data loading, error boundaries
- **Header:** Buttons, save status, mode toggles
- **Canvas:** Rendering, drag/drop, interactions
- **Sidebar:** Properties, filters, stats panels

#### 2.2 Extract Business Logic

```typescript
// services/network-service.ts
export class NetworkService {
  static validateConnection(
    fromNode: Node,
    toNode: Node
  ): ValidationResult {
    if (fromNode.gasType !== toNode.gasType) {
      return { valid: false, error: 'Gas type mismatch' };
    }
    return { valid: true };
  }
  
  static calculateNetworkStats(
    nodes: Node[],
    connections: Connection[]
  ): NetworkStats {
    // Pure business logic, easy to test
  }
}
```

#### 2.3 Implement Compound Components Pattern

```typescript
// Example: Better hierarchy rendering
export function HierarchyTree({ siteId }: Props) {
  return (
    <HierarchyProvider siteId={siteId}>
      <HierarchyTree.Root>
        <HierarchyTree.Buildings>
          {building => (
            <HierarchyTree.Building key={building.id} {...building}>
              <HierarchyTree.Floors buildingId={building.id}>
                {floor => (
                  <HierarchyTree.Floor key={floor.id} {...floor}>
                    <HierarchyTree.Zones floorId={floor.id} />
                  </HierarchyTree.Floor>
                )}
              </HierarchyTree.Floors>
            </HierarchyTree.Building>
          )}
        </HierarchyTree.Buildings>
      </HierarchyTree.Root>
    </HierarchyProvider>
  );
}
```

### Phase 3: Performance Optimization (Week 5)

#### 3.1 Memoization Strategy

```typescript
// Memoize expensive computations
const visibleNodes = useMemo(
  () => applyFilters(allNodes, filters),
  [allNodes, filters]
);

const networkStats = useMemo(
  () => NetworkService.calculateStats(nodes, connections),
  [nodes, connections]
);

// Memoize components
const MemoizedNodeComponent = memo(NodeComponent, (prev, next) => {
  return prev.id === next.id && prev.selected === next.selected;
});
```

#### 3.2 Virtual Scrolling

```typescript
// For equipment import dialog (500+ items)
import { useVirtualizer } from '@tanstack/react-virtual';

export function EquipmentList({ items }: Props) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualItem => (
        <EquipmentItem
          key={items[virtualItem.index].id}
          item={items[virtualItem.index]}
          style={{ height: virtualItem.size }}
        />
      ))}
    </div>
  );
}
```

#### 3.3 Lazy Loading

```typescript
// Split heavy components
const EquipmentImportDialog = lazy(
  () => import('./equipment-import-dialog')
);

const ValveImpactAnalyzer = lazy(
  () => import('./valve-impact-analyzer')
);

// Usage
{showImport && (
  <Suspense fallback={<DialogSkeleton />}>
    <EquipmentImportDialog {...props} />
  </Suspense>
)}
```

### Phase 4: Developer Experience (Week 6)

#### 4.1 Component Documentation

```typescript
/**
 * @component LayoutEditor
 * @description Main editor for gas distribution network layouts
 * 
 * @example
 * ```tsx
 * <LayoutEditor
 *   layoutId="layout_123"
 *   organizationId="org_456"
 *   initialMode="view"
 * />
 * ```
 * 
 * @features
 * - Drag & drop node placement
 * - Real-time connection validation
 * - Auto-save with conflict resolution
 * - Keyboard shortcuts (Ctrl+L to lock)
 */
export function LayoutEditor(props: LayoutEditorProps) {
  // ...
}
```

#### 4.2 Testing Infrastructure

```typescript
// __tests__/layout-editor.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('LayoutEditor', () => {
  it('should load layout data', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <LayoutEditor layoutId="test" />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Main Building')).toBeInTheDocument();
    });
  });
  
  it('should validate gas type on connection', async () => {
    // Test business logic in isolation
    const result = NetworkService.validateConnection(oxygenNode, airNode);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Gas type mismatch');
  });
});
```

---

## Migration Strategy

### Incremental Approach (Recommended)

**Week 1-2: Foundation**
1. ✅ Add Zustand store (no component changes yet)
2. ✅ Add React Query wrapper
3. ✅ Create unified type definitions
4. ✅ Build API client layer

**Week 3-4: Gradual Migration**
5. 🔄 Migrate `unified-layout-editor.tsx` state to Zustand (one state slice at a time)
6. 🔄 Replace fetch calls with React Query hooks
7. 🔄 Split into smaller components

**Week 5: Optimize**
8. ⚡ Add memoization to heavy computations
9. ⚡ Implement virtual scrolling for lists
10. ⚡ Code-split large dialogs

**Week 6: Polish**
11. 📝 Add JSDoc comments
12. ✅ Write integration tests
13. 📊 Performance monitoring

### Risk Mitigation

- **Run old and new side-by-side** using feature flags
- **Canary deployment** to 10% of users first
- **Automated screenshot tests** to catch visual regressions
- **Performance budgets** in CI (Lighthouse scores)

---

## Metrics & Success Criteria

### Before → After Targets

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Lines of code per component** | 914 max | <200 max | Static analysis |
| **useState calls** | 119 total | <30 total | Grep count |
| **Bundle size** | ~450KB | <350KB | webpack-bundle-analyzer |
| **Initial render time** | ~800ms | <400ms | React DevTools Profiler |
| **Type errors** | 12+ | 0 | `tsc --noEmit` |
| **Test coverage** | 0% | >70% | Jest coverage |
| **Lighthouse Performance** | 65 | >85 | CI pipeline |

### Qualitative Goals

- ✅ New developer onboarding time: 2 days → 4 hours
- ✅ Bug fix cycle time: 3 days → 1 day
- ✅ Feature implementation time: 5 days → 2 days

---

## Quick Wins (Can start immediately)

1. **Extract API client** (1 day) - Immediate benefit to all components
2. **Add Zustand store for UI state** (2 days) - Remove 20+ useState calls
3. **Split `unified-layout-editor.tsx`** (3 days) - Huge maintainability gain
4. **Unify type definitions** (1 day) - Eliminate type confusion
5. **Add React Query for data** (2 days) - Better caching, less bugs

**Total: 1 week for 70% of the benefit**

---

## Open Questions

1. **Server-side state:** Should we use Server Components for initial data loading?
2. **Real-time updates:** Do we need WebSocket support for collaborative editing?
3. **Offline support:** Should layouts work offline with sync on reconnect?
4. **Undo/redo:** Is this a required feature? (Affects state architecture)
5. **Migration timeline:** Full migration in 6 weeks, or stretch to 3 months?

---

## References

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Component Composition Patterns](https://www.patterns.dev/posts/compound-pattern)
- [Performance Optimization Guide](https://react.dev/learn/render-and-commit)

---

## Next Steps

1. **Review this proposal** with the team
2. **Prioritize phases** based on business needs
3. **Create detailed tickets** for Week 1-2
4. **Set up development branch** for experimentation
5. **Schedule knowledge transfer** sessions

---

**Document Owner:** Cascade AI  
**Last Updated:** October 30, 2025  
**Review Date:** November 15, 2025
