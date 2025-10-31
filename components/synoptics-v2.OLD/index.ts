/**
 * Main exports for Synoptics V2
 */

// API Client
export { apiClient, APIError } from './api/client';

// Stores
export { useUIStore } from './stores/ui-store';
export { useHierarchyStore } from './stores/hierarchy-store';

// Hooks
export { useLayout, useUpdateNodePosition } from './hooks/use-layout';
export { useCreateNode, useUpdateNode, useDeleteNode } from './hooks/use-nodes';
export { 
  useSiteHierarchy,
  useCreateBuilding,
  useCreateFloor,
  useCreateZone,
  useDeleteBuilding,
  useDeleteFloor,
  useDeleteZone,
} from './hooks/use-hierarchy';
export { useValveCounts } from './hooks/use-valve-counts';
export { useLayoutCounts } from './hooks/use-layout-counts';
export { useGasIndicators } from './hooks/use-gas-indicators';

// Components - Fully Working
export { LayoutEditorHeader } from './components/LayoutEditorHeader';
export { LayoutEditorContainer } from './components/LayoutEditorContainer';
export { LayoutEditorCanvas } from './components/LayoutEditorCanvas';
export { LayoutEditorSidebar } from './components/LayoutEditorSidebar';
export { LayoutEditorDialogs } from './components/LayoutEditorDialogs';
export { ElementPropertiesPanel } from './components/ElementPropertiesPanel';
export { EquipmentManager } from './components/EquipmentManager';
export { LayoutsHierarchyView } from './components/LayoutsHierarchyView';
export { SiteHierarchyManagerOptimized } from './components/SiteHierarchyManagerOptimized';

// Components - Infrastructure Ready (needs type refinement)
// export { SiteHierarchyManager } from './components/SiteHierarchyManager';
