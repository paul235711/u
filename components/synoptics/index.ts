// Form Components
export { SiteForm } from './forms/site-form';
export { BuildingForm } from './forms/building-form';
export { FloorForm } from './forms/floor-form';
export { LayoutForm } from './forms/layout-form';

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
export { useValveCounts } from './hooks/use-valve-counts';
export { useLayoutCounts } from './hooks/use-layout-counts';
export { useGasIndicators } from './hooks/use-gas-indicators';

// ========================================
// V2 Components - Refactored with Modern Architecture
// ========================================

// Core Viewer & Canvas
export { SynopticViewer } from './components/v2/SynopticViewer';
export { LayoutEditorContainer } from './components/v2/LayoutEditorContainer';
export { LayoutEditorHeader } from './components/v2/LayoutEditorHeader';
export { LayoutEditorCanvas } from './components/v2/LayoutEditorCanvas';
export { LayoutEditorSidebar } from './components/v2/LayoutEditorSidebar';
export { LayoutEditorDialogs } from './components/v2/LayoutEditorDialogs';

// Interactive Panels & Filters
export { NetworkStatsPanel } from './components/v2/NetworkStatsPanel';
export { NetworkFilterPanel } from './components/v2/NetworkFilterPanel';
export { GasLegend } from './components/v2/GasLegend';

// Hierarchy & Site Management
export { SiteHierarchyManagerOptimized as SiteHierarchyManager } from './components/v2/SiteHierarchyManagerOptimized';

// Equipment Management
export { EquipmentBankEnhanced } from './components/v2/EquipmentBankEnhanced';
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
export {
  SiteEquipmentMap,
  SiteEquipmentProvider,
  SiteEquipmentMapTabContent,
  SiteEquipmentListTabContent,
  SiteEquipmentDialogs,
} from './components/v2/SiteEquipmentMap';
export { SiteLayoutTab } from './components/v2/SiteLayoutTab';

// ========================================
// Backward Compatibility Aliases
// ========================================
export { SynopticViewer as EnhancedSynopticViewer } from './components/v2/SynopticViewer';
export { createDefaultFilters, applyFilters } from './shared/network-utils';
