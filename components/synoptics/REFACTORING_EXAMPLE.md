# Refactoring Example: Before & After

This document shows concrete examples of the proposed refactoring.

---

## Example 1: State Management

### ❌ Before (Current)

```typescript
// unified-layout-editor.tsx (914 lines)
export function UnifiedLayoutEditor({ layout: initialLayout, organizationId, siteId }) {
  const [layout, setLayout] = useState(initialLayout);
  const [isLocked, setIsLocked] = useState(true);
  const [draggedElementType, setDraggedElementType] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, element: null });
  const [filters, setFilters] = useState(createDefaultFilters());
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState({
    buildingIds: new Set(),
    floorIds: new Set(),
    zoneIds: new Set(),
    showUnassigned: true,
  });
  const [showValveImpact, setShowValveImpact] = useState(false);
  const [selectedValveForImpact, setSelectedValveForImpact] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Sync with server data
  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  // Auto-save indicator
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleQuickAdd = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/synoptics/${draggedElementType}s`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, ...data }),
      });
      // ... more API calls
      setLayout(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      setSaveStatus('saved');
      router.refresh();
    } catch (error) {
      alert('Failed to add element');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ReactFlowProvider>
      <div>
        {/* 900 more lines... */}
      </div>
    </ReactFlowProvider>
  );
}
```

**Issues:**
- 21 useState calls in one component
- State synchronization bugs (layout vs initialLayout)
- Manual API calls with inconsistent error handling
- Tight coupling between UI and business logic
- Difficult to test

---

### ✅ After (Proposed)

```typescript
// stores/synoptics-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SynopticsState {
  // Data
  layout: Layout | null;
  selectedElement: Element | null;
  
  // UI State
  ui: {
    isLocked: boolean;
    isFullscreen: boolean;
    panels: {
      showStats: boolean;
      showFilters: boolean;
      showLegend: boolean;
      showLocationFilter: boolean;
      showValveImpact: boolean;
    };
  };
  
  // Filters
  filters: NetworkFilters;
  
  // Actions
  setLayout: (layout: Layout) => void;
  selectElement: (element: Element | null) => void;
  toggleLock: () => void;
  togglePanel: (panel: keyof typeof ui.panels) => void;
  setFilters: (filters: NetworkFilters) => void;
}

export const useSynopticsStore = create<SynopticsState>()(
  devtools((set) => ({
    layout: null,
    selectedElement: null,
    ui: {
      isLocked: true,
      isFullscreen: false,
      panels: {
        showStats: false,
        showFilters: false,
        showLegend: true,
        showLocationFilter: false,
        showValveImpact: false,
      },
    },
    filters: createDefaultFilters(),
    
    setLayout: (layout) => set({ layout }),
    selectElement: (element) => set({ selectedElement: element }),
    toggleLock: () => set((state) => ({ 
      ui: { ...state.ui, isLocked: !state.ui.isLocked } 
    })),
    togglePanel: (panel) => set((state) => ({
      ui: {
        ...state.ui,
        panels: { ...state.ui.panels, [panel]: !state.ui.panels[panel] }
      }
    })),
    setFilters: (filters) => set({ filters }),
  }))
);

// hooks/use-create-node.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/synoptics-client';

export function useCreateNode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createNode,
    onSuccess: (newNode, variables) => {
      // Optimistic update
      queryClient.setQueryData(['layout', variables.layoutId], (old: Layout) => ({
        ...old,
        nodes: [...old.nodes, newNode],
      }));
    },
    onError: (error) => {
      toast.error(`Failed to create node: ${error.message}`);
    },
  });
}

// components/layout-editor/LayoutEditorContainer.tsx (100 lines)
import { useSynopticsStore } from '@/stores/synoptics-store';
import { useLayout } from '@/hooks/use-layout';

export function LayoutEditorContainer({ layoutId, organizationId }: Props) {
  const { data: layout, isLoading, error } = useLayout(layoutId);
  const setLayout = useSynopticsStore(state => state.setLayout);
  
  useEffect(() => {
    if (layout) setLayout(layout);
  }, [layout, setLayout]);
  
  if (isLoading) return <LayoutEditorSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div className="flex flex-col h-full">
      <LayoutEditorHeader />
      <LayoutEditorCanvas />
      <LayoutEditorSidebar />
    </div>
  );
}

// components/layout-editor/LayoutEditorHeader.tsx (80 lines)
export function LayoutEditorHeader() {
  const isLocked = useSynopticsStore(state => state.ui.isLocked);
  const toggleLock = useSynopticsStore(state => state.toggleLock);
  const togglePanel = useSynopticsStore(state => state.togglePanel);
  
  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <LayoutTitle />
        <div className="flex gap-2">
          <LockToggleButton isLocked={isLocked} onToggle={toggleLock} />
          <PanelToggleButton panel="showFilters" onToggle={togglePanel} />
          <PanelToggleButton panel="showStats" onToggle={togglePanel} />
        </div>
      </div>
    </header>
  );
}

// components/layout-editor/LayoutEditorCanvas.tsx (120 lines)
export function LayoutEditorCanvas() {
  const layout = useSynopticsStore(state => state.layout);
  const isLocked = useSynopticsStore(state => state.ui.isLocked);
  const selectElement = useSynopticsStore(state => state.selectElement);
  const { mutate: updatePosition } = useUpdateNodePosition();
  
  const handleNodeClick = useCallback((node: Node) => {
    selectElement(node);
  }, [selectElement]);
  
  const handleNodeDragEnd = useCallback((nodeId: string, position: Position) => {
    if (!isLocked) {
      updatePosition({ nodeId, position });
    }
  }, [isLocked, updatePosition]);
  
  return (
    <ReactFlowProvider>
      <EnhancedSynopticViewer
        nodes={layout?.nodes || []}
        connections={layout?.connections || []}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={isLocked ? undefined : handleNodeDragEnd}
        editable={!isLocked}
      />
    </ReactFlowProvider>
  );
}
```

**Benefits:**
- ✅ Single source of truth (Zustand store)
- ✅ Automatic caching and synchronization (React Query)
- ✅ Consistent error handling
- ✅ Optimistic updates
- ✅ Small, focused components (<150 lines each)
- ✅ Easy to test each piece in isolation
- ✅ Redux DevTools support for debugging

---

## Example 2: API Layer

### ❌ Before (Current)

```typescript
// Scattered across 15+ components
const handleCreateValve = async (gasTypes: GasType[]) => {
  setIsSubmitting(true);
  setError(null);
  
  try {
    const valvePromises = gasTypes.map(async (gasType) => {
      const valveResponse = await fetch('/api/synoptics/valves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: siteData.organizationId,
          name: valveName,
          valveType: valveTypeMap[valveDialog.type],
          gasType,
          state: 'open',
        }),
      });
      
      if (!valveResponse.ok) throw new Error(`Failed to create ${gasLabel} valve`);
      const valve = await valveResponse.json();
      
      const nodeResponse = await fetch('/api/synoptics/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: siteData.organizationId,
          nodeType: 'valve',
          elementId: valve.id,
          // ... more fields
        }),
      });
      
      if (!nodeResponse.ok) throw new Error(`Failed to create ${gasLabel} node`);
      return valve;
    });
    
    await Promise.all(valvePromises);
    await loadValvesForLocation(valveDialog.targetId, valveDialog.type);
    await refreshValveCounts();
    router.refresh();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to create isolation valve');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Issues:**
- Manual error handling in every component
- No type safety for API calls
- Manual cache invalidation
- Inconsistent error messages
- No retry logic

---

### ✅ After (Proposed)

```typescript
// api/synoptics-client.ts
import { z } from 'zod';

// Type-safe DTOs
export const CreateValveSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  valveType: z.enum(['isolation', 'zone', 'area', 'shutoff', 'regulator']),
  gasType: z.enum(['oxygen', 'medical_air', 'vacuum', 'nitrogen', 'nitrous_oxide', 'carbon_dioxide']),
  state: z.enum(['open', 'closed']),
});

export type CreateValveDTO = z.infer<typeof CreateValveSchema>;

class SynopticsAPIClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`/api/synoptics${endpoint}`, {
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
      throw new APIError(error.error || 'Request failed', response.status);
    }
    
    return response.json();
  }
  
  // Typed methods
  async createValve(data: CreateValveDTO): Promise<Valve> {
    // Runtime validation
    const validated = CreateValveSchema.parse(data);
    return this.request<Valve>('/valves', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
  }
  
  async createNode(data: CreateNodeDTO): Promise<Node> {
    const validated = CreateNodeSchema.parse(data);
    return this.request<Node>('/nodes', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
  }
  
  async getLayout(id: string): Promise<Layout> {
    return this.request<Layout>(`/layouts/${id}`);
  }
  
  // ... all other endpoints
}

export const apiClient = new SynopticsAPIClient();

// hooks/use-create-valve.ts
export function useCreateValve() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateValveDTO) => {
      // Create valve
      const valve = await apiClient.createValve(data);
      
      // Create associated node
      const node = await apiClient.createNode({
        organizationId: data.organizationId,
        nodeType: 'valve',
        elementId: valve.id,
        // ... inferred from valve
      });
      
      return { valve, node };
    },
    onSuccess: (data, variables) => {
      // Automatic cache updates
      queryClient.invalidateQueries({ queryKey: ['valves'] });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['valve-counts'] });
      
      toast.success(`Valve "${data.valve.name}" created successfully`);
    },
    onError: (error: APIError) => {
      toast.error(`Failed to create valve: ${error.message}`);
    },
    retry: 1, // Retry once on network error
  });
}

// Usage in component
export function ValveCreationDialog() {
  const { mutate: createValve, isPending } = useCreateValve();
  
  const handleSubmit = (data: CreateValveDTO) => {
    createValve(data);
  };
  
  return (
    <Dialog>
      <ValveForm onSubmit={handleSubmit} isPending={isPending} />
    </Dialog>
  );
}
```

**Benefits:**
- ✅ Type-safe API calls with Zod validation
- ✅ Centralized error handling
- ✅ Automatic retry logic
- ✅ Consistent success/error toasts
- ✅ Single place to update API structure
- ✅ Easy to mock for testing

---

## Example 3: Component Decomposition

### ❌ Before (Current)

```typescript
// site-hierarchy-manager-v2.tsx (678 lines)
export function SiteHierarchyManagerV2({ siteData, siteId }) {
  const [expandedBuildings, setExpandedBuildings] = useState(new Set());
  const [expandedFloors, setExpandedFloors] = useState(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [addingFloorTo, setAddingFloorTo] = useState(null);
  const [addingZoneTo, setAddingZoneTo] = useState(null);
  const [valveDialog, setValveDialog] = useState({ /* ... */ });
  const [editValveDialog, setEditValveDialog] = useState({ /* ... */ });
  const [valveViewerDialog, setValveViewerDialog] = useState({ /* ... */ });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const { locationValves, valveCounts, locationGases, /* ... */ } = useValveData(
    siteData.organizationId
  );
  
  // 20+ handler functions...
  
  return (
    <div>
      {/* 600+ lines of nested JSX */}
      {siteData.buildings.map(building => (
        <div key={building.id}>
          {/* Building header */}
          {isExpanded && (
            <div>
              {building.floors.map(floor => (
                <div key={floor.id}>
                  {/* Floor header */}
                  {isFloorExpanded && (
                    <div>
                      {floor.zones.map(zone => (
                        <div key={zone.id}>
                          {/* Zone card */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Issues:**
- 678 lines in one file
- Deep nesting (4-5 levels)
- Mixed concerns (rendering + state + CRUD)
- Difficult to navigate
- Hard to test individual parts

---

### ✅ After (Proposed)

```typescript
// components/hierarchy/HierarchyTreeContainer.tsx (80 lines)
export function HierarchyTreeContainer({ siteId }: Props) {
  const { data: site, isLoading } = useSite(siteId);
  const isEditMode = useHierarchyStore(state => state.isEditMode);
  
  if (isLoading) return <HierarchyTreeSkeleton />;
  
  return (
    <div>
      <HierarchyTreeHeader siteId={siteId} />
      {site.buildings.length === 0 ? (
        <EmptyBuildingsState />
      ) : (
        <BuildingsList buildings={site.buildings} />
      )}
    </div>
  );
}

// components/hierarchy/BuildingsList.tsx (60 lines)
export function BuildingsList({ buildings }: Props) {
  return (
    <div className="space-y-3">
      {buildings.map(building => (
        <BuildingCard key={building.id} building={building} />
      ))}
    </div>
  );
}

// components/hierarchy/BuildingCard.tsx (120 lines)
export function BuildingCard({ building }: Props) {
  const isExpanded = useHierarchyStore(state => 
    state.expandedBuildings.has(building.id)
  );
  const toggleBuilding = useHierarchyStore(state => state.toggleBuilding);
  const isEditMode = useHierarchyStore(state => state.isEditMode);
  
  return (
    <Card>
      <CardHeader>
        <BuildingHeader
          building={building}
          isExpanded={isExpanded}
          onToggle={() => toggleBuilding(building.id)}
        />
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <FloorsList buildingId={building.id} floors={building.floors} />
        </CardContent>
      )}
    </Card>
  );
}

// components/hierarchy/BuildingHeader.tsx (40 lines)
export function BuildingHeader({ building, isExpanded, onToggle }: Props) {
  const valveCount = useValveCount(building.id);
  const gases = useLocationGases(building.id);
  const isEditMode = useHierarchyStore(state => state.isEditMode);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ExpandButton isExpanded={isExpanded} onClick={onToggle} />
        <Building2Icon />
        <BuildingInfo building={building} />
      </div>
      
      <div className="flex gap-2">
        <ValveBadge locationId={building.id} count={valveCount} />
        <GasIndicators gases={gases} />
        {isEditMode && <BuildingActions building={building} />}
      </div>
    </div>
  );
}

// components/hierarchy/FloorsList.tsx (50 lines)
export function FloorsList({ buildingId, floors }: Props) {
  return (
    <div className="space-y-2">
      {floors.map(floor => (
        <FloorCard key={floor.id} buildingId={buildingId} floor={floor} />
      ))}
    </div>
  );
}

// ... similar decomposition for FloorCard, ZonesList, etc.
```

**Benefits:**
- ✅ Each component < 150 lines
- ✅ Single responsibility
- ✅ Easy to understand at a glance
- ✅ Reusable components
- ✅ Testable in isolation
- ✅ Can lazy load heavy parts

---

## Example 4: Testing

### ❌ Before (Current)

```typescript
// No tests! 😱
```

---

### ✅ After (Proposed)

```typescript
// __tests__/hooks/use-create-valve.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateValve } from '@/hooks/use-create-valve';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useCreateValve', () => {
  it('should create valve successfully', async () => {
    const { result } = renderHook(() => useCreateValve(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.mutate({
        organizationId: 'org_123',
        name: 'Test Valve',
        valveType: 'isolation',
        gasType: 'oxygen',
        state: 'open',
      });
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.valve.name).toBe('Test Valve');
  });
  
  it('should handle validation errors', async () => {
    const { result } = renderHook(() => useCreateValve(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.mutate({
        organizationId: 'invalid',
        name: '',
        valveType: 'wrong' as any,
        gasType: 'oxygen',
        state: 'open',
      });
    });
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('validation');
  });
});

// __tests__/services/network-service.test.ts
import { NetworkService } from '@/services/network-service';

describe('NetworkService', () => {
  describe('validateConnection', () => {
    it('should reject connections between different gas types', () => {
      const oxygenNode = createMockNode({ gasType: 'oxygen' });
      const airNode = createMockNode({ gasType: 'medical_air' });
      
      const result = NetworkService.validateConnection(oxygenNode, airNode);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Gas type mismatch');
    });
    
    it('should allow connections between same gas types', () => {
      const node1 = createMockNode({ gasType: 'oxygen' });
      const node2 = createMockNode({ gasType: 'oxygen' });
      
      const result = NetworkService.validateConnection(node1, node2);
      
      expect(result.valid).toBe(true);
    });
  });
  
  describe('calculateNetworkStats', () => {
    it('should calculate correct statistics', () => {
      const nodes = [
        createMockNode({ id: '1', nodeType: 'source' }),
        createMockNode({ id: '2', nodeType: 'valve' }),
        createMockNode({ id: '3', nodeType: 'fitting' }),
      ];
      
      const connections = [
        createMockConnection({ fromNodeId: '1', toNodeId: '2' }),
        createMockConnection({ fromNodeId: '2', toNodeId: '3' }),
      ];
      
      const stats = NetworkService.calculateNetworkStats(nodes, connections);
      
      expect(stats.totalNodes).toBe(3);
      expect(stats.totalConnections).toBe(2);
      expect(stats.isolatedNodes).toHaveLength(0);
    });
  });
});

// __tests__/components/BuildingCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BuildingCard } from '@/components/hierarchy/BuildingCard';

describe('BuildingCard', () => {
  it('should render building information', () => {
    const building = {
      id: 'bld_123',
      name: 'Main Building',
      floors: [],
    };
    
    render(<BuildingCard building={building} />);
    
    expect(screen.getByText('Main Building')).toBeInTheDocument();
  });
  
  it('should expand/collapse on click', () => {
    const building = createMockBuilding();
    
    render(<BuildingCard building={building} />);
    
    const expandButton = screen.getByRole('button', { name: /expand/i });
    
    fireEvent.click(expandButton);
    expect(screen.getByTestId('floors-list')).toBeVisible();
    
    fireEvent.click(expandButton);
    expect(screen.queryByTestId('floors-list')).not.toBeInTheDocument();
  });
});
```

**Benefits:**
- ✅ Test business logic separately from UI
- ✅ Mock external dependencies
- ✅ Fast, reliable tests
- ✅ Catch regressions early
- ✅ Documentation through tests

---

## Migration Path

### Step 1: Add new infrastructure (no breaking changes)
```bash
npm install zustand @tanstack/react-query zod
```

### Step 2: Create parallel implementations
```
components/
├── synoptics/                   # OLD (keep working)
└── synoptics-v2/               # NEW (build incrementally)
    ├── stores/
    ├── hooks/
    ├── services/
    └── components/
```

### Step 3: Feature flag
```typescript
// app/(dashboard)/layouts/[id]/page.tsx
const USE_NEW_EDITOR = process.env.NEXT_PUBLIC_USE_NEW_EDITOR === 'true';

export default function LayoutPage({ params }) {
  if (USE_NEW_EDITOR) {
    return <LayoutEditorV2 layoutId={params.id} />;
  }
  
  return <UnifiedLayoutEditor layoutId={params.id} />;
}
```

### Step 4: Gradual rollout
- Week 1-2: Internal testing
- Week 3: 10% of users
- Week 4: 50% of users
- Week 5: 100% of users
- Week 6: Remove old code

---

## Conclusion

The refactoring will:
- ✅ **Reduce complexity** by 60%+ (lines per component)
- ✅ **Improve maintainability** through separation of concerns
- ✅ **Enable testing** with isolated, testable units
- ✅ **Boost performance** through optimizations
- ✅ **Enhance DX** with better types and tooling

**Time Investment:** 6 weeks  
**Long-term Savings:** 40%+ reduction in bug fix time, 60%+ faster feature development
