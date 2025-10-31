// Main Components
export { UnifiedLayoutEditor } from './unified-layout-editor';
export { UnifiedLayoutEditorWrapper } from './UnifiedLayoutEditorWrapper';
export { EnhancedSynopticViewer } from './enhanced-synoptic-viewer';
export { ElementToolbar } from './element-toolbar';
export { ElementPropertiesPanel } from './element-properties-panel';
export { QuickAddDialog } from './quick-add-dialog';
export { GasLegend } from './gas-legend';
export { NetworkStatsPanel } from './network-stats-panel';
export { NetworkFilterPanel } from './network-filter-panel';
export { HierarchicalLocationFilter } from './hierarchical-location-filter';
export { ValveImpactAnalyzer } from './valve-impact-analyzer';

// Node Components
export { SourceNode } from './nodes/source-node';
export { ValveNode } from './nodes/valve-node';
export { FittingNode } from './nodes/fitting-node';

// Form Components
export { SiteForm } from './forms/site-form';
export { BuildingForm } from './forms/building-form';
export { FloorForm } from './forms/floor-form';
export { LayoutForm } from './forms/layout-form';

// Hierarchy Management
export { SiteHierarchyManagerWrapper as SiteHierarchyManager } from './SiteHierarchyManagerWrapper';
export { ValveViewerDialog } from './hierarchy/valve-viewer-dialog';

// ========================================
// V2 Architecture - Modern State Management
// ========================================

// API Client - Centralized type-safe API calls
export { apiClient, APIError } from './api/client';

// Stores - Zustand state management
export { useUIStore } from './stores/ui-store';
export { useHierarchyStore } from './stores/hierarchy-store';

// Hooks - React Query for server state
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

// ========================================
// V2 Components - Refactored with Modern Architecture
// ========================================

// Layout Editor - Decomposed from monolithic unified-layout-editor
export { LayoutEditorContainer } from './components/v2/LayoutEditorContainer';
export { LayoutEditorHeader } from './components/v2/LayoutEditorHeader';
export { LayoutEditorCanvas } from './components/v2/LayoutEditorCanvas';
export { LayoutEditorSidebar } from './components/v2/LayoutEditorSidebar';
export { LayoutEditorDialogs } from './components/v2/LayoutEditorDialogs';

// Enhanced Core Components
export { ElementPropertiesPanel as ElementPropertiesPanelV2 } from './components/v2/ElementPropertiesPanel';
export { SiteHierarchyManager as SiteHierarchyManagerV2 } from './components/v2/SiteHierarchyManager';
export { SiteHierarchyManagerOptimized } from './components/v2/SiteHierarchyManagerOptimized';

// Equipment Management
export { EquipmentManager } from './components/v2/EquipmentManager';
export { EquipmentBank } from './components/v2/EquipmentBank';
export { EquipmentBankEnhanced } from './components/v2/EquipmentBankEnhanced';
export { EquipmentCreateDialog } from './components/v2/EquipmentCreateDialog';
export { EquipmentEditDialog } from './components/v2/EquipmentEditDialog';
export { EquipmentDeleteDialog } from './components/v2/EquipmentDeleteDialog';
export { EquipmentLocationBreadcrumb } from './components/v2/EquipmentLocationBreadcrumb';

// Layout & Hierarchy Views
export { LayoutsHierarchyView } from './components/v2/LayoutsHierarchyView';
export { LayoutSelectorDialog } from './components/v2/LayoutSelectorDialog';
export { LayoutSelectorForEquipment } from './components/v2/LayoutSelectorForEquipment';

// Quick Action Dialogs
export { QuickLayoutDialog } from './components/v2/QuickLayoutDialog';
export { QuickValveDialog } from './components/v2/QuickValveDialog';
export { ValveListDialog } from './components/v2/ValveListDialog';

// Utility Components
export { AllGasIndicators } from './components/v2/AllGasIndicators';
export { GasTypeBadge } from './components/v2/GasTypeBadge';
export { LayoutBadge } from './components/v2/LayoutBadge';
