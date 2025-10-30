'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { EnhancedSynopticViewer } from './enhanced-synoptic-viewer';
import { ElementToolbar } from './element-toolbar';
import { QuickAddDialog } from './quick-add-dialog';
import { ElementPropertiesPanelWrapper as ElementPropertiesPanel } from './ElementPropertiesPanelWrapper';
import { ConfirmationDialog } from './shared/confirmation-dialog';
import { NetworkStatsPanel } from './network-stats-panel';
import { NetworkFilterPanel, createDefaultFilters, applyFilters, type NetworkFilters } from './network-filter-panel';
import { GasLegend } from './gas-legend';
import { HierarchicalLocationFilter } from './hierarchical-location-filter';
import { ValveImpactAnalyzer } from './valve-impact-analyzer';
import { EquipmentImportDialog } from './equipment-import-dialog';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Save, Loader2, Keyboard, HelpCircle, Maximize2, Minimize2, Eye, EyeOff, MapPin, AlertTriangle, Download } from 'lucide-react';
import { useKeyboardShortcuts, KeyboardShortcutsHelp, type KeyboardShortcut } from './shared/use-keyboard-shortcuts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Node } from '@xyflow/react';
import { inferNodeContext, mergeNodeContext } from './shared/node-context-utils';

interface UnifiedLayoutEditorProps {
  layout: any;
  organizationId: string;
  siteId?: string;
}

export function UnifiedLayoutEditor({ layout: initialLayout, organizationId, siteId }: UnifiedLayoutEditorProps) {
  const router = useRouter();
  const [layout, setLayout] = useState(initialLayout);
  const [isLocked, setIsLocked] = useState(true); // Start in locked (view-only) mode
  const [draggedElementType, setDraggedElementType] = useState<'source' | 'valve' | 'fitting' | null>(null);
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; element: any | null }>({ open: false, element: null });
  
  // UI state
  const [filters, setFilters] = useState<NetworkFilters>(createDefaultFilters());
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // New hierarchy-based features
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<{
    buildingIds: Set<string>;
    floorIds: Set<string>;
    zoneIds: Set<string>;
    showUnassigned: boolean;
  }>({
    buildingIds: new Set(),
    floorIds: new Set(),
    zoneIds: new Set(),
    showUnassigned: true,
  });
  const [showValveImpact, setShowValveImpact] = useState(false);
  const [selectedValveForImpact, setSelectedValveForImpact] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Sync with server data
  useEffect(() => {
    console.log('🔍 UnifiedLayoutEditor received layout data:', {
      layoutId: initialLayout?.id,
      nodeCount: initialLayout?.nodes?.length || 0,
      nodes: initialLayout?.nodes?.map((n: any) => ({
        id: n.id,
        name: n.name,
        nodeType: n.nodeType,
        position: n.position
      })) || []
    });
    setLayout(initialLayout);
  }, [initialLayout]);

  // Auto-save indicator
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Apply filters to get visible nodes (combining network filters + location filters)
  const visibleNodeIds = useMemo(() => {
    // First apply network filters
    const networkFilteredIds = applyFilters(layout.nodes || [], layout.connections || [], filters);
    
    // Then apply location hierarchy filters
    const hasLocationFilter = 
      selectedLocations.buildingIds.size > 0 ||
      selectedLocations.floorIds.size > 0 ||
      selectedLocations.zoneIds.size > 0 ||
      !selectedLocations.showUnassigned;
    
    if (!hasLocationFilter) {
      return networkFilteredIds;
    }
    
    const locationFilteredIds = new Set<string>();
    (layout.nodes || []).forEach((node: any) => {
      // Check if node matches location filter
      const isUnassigned = !node.buildingId && !node.floorId && !node.zoneId;
      
      if (isUnassigned && selectedLocations.showUnassigned) {
        locationFilteredIds.add(node.id);
      } else if (
        (selectedLocations.buildingIds.size === 0 || selectedLocations.buildingIds.has(node.buildingId)) &&
        (selectedLocations.floorIds.size === 0 || selectedLocations.floorIds.has(node.floorId)) &&
        (selectedLocations.zoneIds.size === 0 || selectedLocations.zoneIds.has(node.zoneId))
      ) {
        locationFilteredIds.add(node.id);
      }
    });
    
    // Combine both filters (intersection)
    const combinedIds = new Set<string>();
    networkFilteredIds.forEach((id: string) => {
      if (locationFilteredIds.has(id)) {
        combinedIds.add(id);
      }
    });
    
    return combinedIds;
  }, [layout.nodes, layout.connections, filters, selectedLocations]);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 'l',
      ctrl: true,
      description: 'Toggle lock/unlock',
      action: () => setIsLocked((prev) => !prev),
    },
    {
      key: 's',
      ctrl: true,
      description: 'Save (auto-saves)',
      action: () => {
        setSaveStatus('saved');
      },
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Toggle filters',
      action: () => setShowFilters((prev) => !prev),
    },
    {
      key: 'i',
      ctrl: true,
      description: 'Toggle stats',
      action: () => setShowStats((prev) => !prev),
    },
    {
      key: 'h',
      ctrl: true,
      description: 'Toggle location filter',
      action: () => setShowLocationFilter((prev) => !prev),
    },
    {
      key: 'Delete',
      description: 'Delete selected element',
      action: () => {
        if (!isLocked && selectedElement) {
          handleElementDelete();
        }
      },
    },
    {
      key: 'Escape',
      description: 'Deselect / Close panel',
      action: () => {
        if (selectedElement) {
          setSelectedElement(null);
        } else if (showQuickAdd) {
          setShowQuickAdd(false);
          setDraggedElementType(null);
          setDropPosition(null);
        }
      },
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsHelp(true),
    },
  ], [selectedElement, showQuickAdd, isLocked]);

  useKeyboardShortcuts(shortcuts, !isLocked || showStats || showFilters);

  const handleDragStart = (elementType: 'source' | 'valve' | 'fitting') => {
    if (isLocked) return;
    setDraggedElementType(elementType);
  };

  const handleDrop = (position: { x: number; y: number }) => {
    if (isLocked || !draggedElementType) return;
    setDropPosition(position);
    setShowQuickAdd(true);
  };

  const handleQuickAdd = async (data: any) => {
    if (isLocked || !draggedElementType) return;

    setIsSaving(true);
    try {
      const elementEndpoint = `/api/synoptics/${draggedElementType}s`;
      const elementPayload: any = {
        organizationId,
        name: data.name,
        gasType: data.gasType,
      };

      if (draggedElementType === 'valve') {
        elementPayload.valveType = 'isolation';
        elementPayload.state = 'open';
      } else if (draggedElementType === 'fitting') {
        elementPayload.fittingType = 'tee';
      }

      const elementResponse = await fetch(elementEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elementPayload),
      });

      if (!elementResponse.ok) throw new Error('Failed to create element');
      const element = await elementResponse.json();

      // Inherit hierarchy context from layout using utility
      const layoutContext = {
        siteId: layout.siteId,
        floorId: layout.floorId,
      };
      const nodeContext = await inferNodeContext(layoutContext);

      const baseNodePayload = {
        organizationId,
        nodeType: draggedElementType,
        elementId: element.id,
        outletCount: 0,
      };

      const nodePayload = mergeNodeContext(baseNodePayload, nodeContext);

      const nodeResponse = await fetch('/api/synoptics/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodePayload),
      });

      if (!nodeResponse.ok) throw new Error('Failed to create node');
      const node = await nodeResponse.json();

      console.log('Creating node position:', {
        nodeId: node.id,
        layoutId: layout.id,
        xPosition: data.position.x,
        yPosition: data.position.y,
      });

      const positionResponse = await fetch('/api/synoptics/node-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          layoutId: layout.id,
          xPosition: data.position.x,
          yPosition: data.position.y,
        }),
      });

      if (!positionResponse.ok) {
        const errorData = await positionResponse.json().catch(() => ({ error: 'Failed to create position' }));
        console.error('Failed to create node position:', errorData);
        throw new Error(errorData.error || 'Failed to create node position');
      }

      const positionData = await positionResponse.json();
      console.log('Node position created successfully:', positionData);

      const newNode = {
        id: node.id,
        nodeType: draggedElementType,
        elementId: element.id,
        name: data.name,
        gasType: data.gasType,
        label: data.name,
        position: {
          xPosition: data.position.x,
          yPosition: data.position.y,
        },
      };

      setLayout((prev: any) => ({
        ...prev,
        nodes: [...(prev.nodes || []), newNode],
      }));

      setSaveStatus('saved');
      
      // Refresh server data to invalidate cache
      router.refresh();
    } catch (error) {
      console.error('Failed to add element:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add element. Please try again.';
      alert(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
      setShowQuickAdd(false);
      setDraggedElementType(null);
      setDropPosition(null);
    }
  };

  const handleNodeClick = (node: Node) => {
    const fullElement = layout.nodes?.find((n: any) => n.id === node.id);
    if (fullElement) {
      setSelectedElement(fullElement);
      
      // If clicking a valve, show impact analysis option
      if (fullElement.nodeType === 'valve') {
        setSelectedValveForImpact(fullElement);
      } else {
        setSelectedValveForImpact(null);
      }
    }
  };

  const handleElementUpdate = async (data: any) => {
    if (isLocked || !selectedElement) return;

    setSaveStatus('saving');
    try {
      const endpoint = `/api/synoptics/${selectedElement.nodeType}s/${selectedElement.elementId}`;
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      setLayout((prev: any) => ({
        ...prev,
        nodes: prev.nodes.map((n: any) =>
          n.id === selectedElement.id
            ? { ...n, ...data, label: data.name || n.label }
            : n
        ),
      }));

      setSaveStatus('saved');
      router.refresh(); // Invalidate cache
      setSelectedElement(null);
    } catch (error) {
      console.error('Failed to update element:', error);
      setSaveStatus('idle');
      alert('Failed to update element. Please try again.');
    }
  };

  const handleElementDelete = async () => {
    if (isLocked || !selectedElement) return;
    setDeleteConfirm({ open: true, element: selectedElement });
  };

  const confirmDelete = async () => {
    const element = deleteConfirm.element;
    if (!element) return;

    setDeleteConfirm({ open: false, element: null });
    setSaveStatus('saving');
    
    try {
      // Delete node first (this will cascade delete the nodePosition)
      const nodeResponse = await fetch(`/api/synoptics/nodes/${element.id}`, {
        method: 'DELETE',
      });

      if (!nodeResponse.ok) {
        const errorData = await nodeResponse.json().catch(() => ({ error: 'Failed to delete node' }));
        throw new Error(errorData.error || 'Failed to delete node');
      }

      // Then delete the element (source/valve/fitting)
      const elementResponse = await fetch(`/api/synoptics/${element.nodeType}s/${element.elementId}`, {
        method: 'DELETE',
      });

      if (!elementResponse.ok) {
        const errorData = await elementResponse.json().catch(() => ({ error: 'Failed to delete element' }));
        throw new Error(errorData.error || 'Failed to delete element');
      }

      // Only update local state if both deletes succeeded
      setLayout((prev: any) => ({
        ...prev,
        nodes: prev.nodes.filter((n: any) => n.id !== element.id),
        connections: prev.connections.filter(
          (c: any) => c.fromNodeId !== element.id && c.toNodeId !== element.id
        ),
      }));

      setSaveStatus('saved');
      router.refresh(); // Invalidate cache
      setSelectedElement(null);
    } catch (error) {
      console.error('Failed to delete element:', error);
      setSaveStatus('idle');
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete element. Please try again.';
      alert(errorMessage);
    }
  };

  const handleNodeDragEnd = async (nodeId: string, position: { x: number; y: number }) => {
    if (isLocked) return;
    
    setSaveStatus('saving');
    try {
      console.log('Updating node position:', { nodeId, layoutId: layout.id, position });
      
      const response = await fetch('/api/synoptics/node-positions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          layoutId: layout.id,
          xPosition: position.x,
          yPosition: position.y,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update position' }));
        console.error('Failed to update node position:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        const errorMsg = errorData.error || errorData.message || `Failed to update position (${response.status})`;
        throw new Error(errorMsg);
      }

      const updatedPosition = await response.json();
      console.log('Position updated successfully:', updatedPosition);

      setLayout((prev: any) => ({
        ...prev,
        nodes: prev.nodes.map((n: any) =>
          n.id === nodeId
            ? {
                ...n,
                position: {
                  xPosition: position.x,
                  yPosition: position.y,
                },
              }
            : n
        ),
      }));

      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save position:', error);
      setSaveStatus('idle');
      const errorMessage = error instanceof Error ? error.message : 'Failed to save position';
      alert(errorMessage);
    }
  };

  const handleConnectionCreate = async (fromNodeId: string, toNodeId: string) => {
    if (isLocked) return;
    
    setSaveStatus('saving');
    try {
      const fromNode = layout.nodes?.find((n: any) => n.id === fromNodeId);
      const toNode = layout.nodes?.find((n: any) => n.id === toNodeId);
      
      if (!fromNode || !toNode) {
        console.error('Cannot create connection: nodes not found');
        alert('Error: Could not find nodes to connect. Please try again.');
        setSaveStatus('idle');
        return;
      }
      
      if (fromNode.gasType !== toNode.gasType) {
        alert(`❌ Cannot connect different gas types!\n\nFrom: ${fromNode.name} (${fromNode.gasType.replace(/_/g, ' ')})\nTo: ${toNode.name} (${toNode.gasType.replace(/_/g, ' ')})\n\nBoth elements must use the same gas type.`);
        setSaveStatus('idle');
        return;
      }
      
      const gasType = fromNode.gasType;

      console.log('Creating connection:', { fromNodeId, toNodeId, gasType });

      const response = await fetch('/api/synoptics/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          fromNodeId,
          toNodeId,
          gasType,
          diameterMm: null,
        }),
      });

      if (response.ok) {
        const newConnection = await response.json();
        console.log('✅ Connection created successfully:', newConnection);
        setLayout((prev: any) => ({
          ...prev,
          connections: [...(prev.connections || []), newConnection],
        }));
        setSaveStatus('saved');
        router.refresh(); // Invalidate cache
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to create connection:', errorData);
        alert(`❌ Failed to save connection: ${errorData.error || 'Unknown error'}\n\nThe connection will not be saved.`);
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error('❌ Exception creating connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Error creating connection: ${errorMessage}\n\nPlease check the console for details.`);
      setSaveStatus('idle');
    }
  };

  const handleIssueClick = useCallback((nodeIds: string[]) => {
    setFilters((prev) => ({
      ...prev,
      highlightedNodes: new Set(nodeIds),
    }));
    
    if (nodeIds.length === 1) {
      const node = layout.nodes?.find((n: any) => n.id === nodeIds[0]);
      if (node) {
        setSelectedElement(node);
      }
    }
  }, [layout.nodes]);

  const handleResetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const handleImportEquipment = async (nodeIds: string[]) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/synoptics/layouts/${layout.id}/import-nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import equipment');
      }

      const result = await response.json();
      console.log('Import result:', result);

      // Refresh the page to show imported equipment
      router.refresh();
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to import equipment:', error);
      setSaveStatus('idle');
      alert(error instanceof Error ? error.message : 'Failed to import equipment');
      throw error;
    }
  };

  return (
    <ReactFlowProvider>
      <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'h-full'}`}>
        {/* Toolbar - only show when unlocked */}
        {!isLocked && <ElementToolbar onDragStart={handleDragStart} />}

        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-semibold text-gray-900 flex items-center gap-2">
                {layout.name}
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
            
            {/* Save Status */}
            {!isLocked && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-blue-600">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Save className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {/* Lock/Unlock Toggle */}
            <Button
              variant={isLocked ? 'outline' : 'default'}
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
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
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50' : ''}
            >
              {showFilters ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              Filters
            </Button>

            {/* Stats Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className={showStats ? 'bg-blue-50' : ''}
            >
              {showStats ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              Stats
            </Button>

            {/* Location Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLocationFilter(!showLocationFilter)}
              className={showLocationFilter ? 'bg-blue-50' : ''}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Locations
            </Button>

            {/* Valve Impact Toggle */}
            {selectedValveForImpact && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValveImpact(!showValveImpact)}
                className={showValveImpact ? 'bg-orange-50 border-orange-200' : ''}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Impact
              </Button>
            )}

            {/* Import Equipment Button */}
            {!isLocked && siteId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Import Equipment
              </Button>
            )}

            {/* Legend Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
            >
              Legend
            </Button>

            {/* Shortcuts */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcutsHelp(true)}
            >
              <Keyboard className="mr-2 h-4 w-4" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" role="main">
          <EnhancedSynopticViewer
            nodes={layout.nodes || []}
            connections={layout.connections || []}
            onNodeClick={handleNodeClick}
            onNodeDragEnd={isLocked ? undefined : handleNodeDragEnd}
            onConnectionCreate={isLocked ? undefined : handleConnectionCreate}
            onDrop={isLocked ? undefined : handleDrop}
            editable={!isLocked}
            visibleNodeIds={visibleNodeIds}
            highlightedNodeIds={filters.highlightedNodes}
          />

          {/* Filter Panel */}
          {showFilters && (
            <NetworkFilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
            />
          )}

          {/* Location Filter Panel */}
          {showLocationFilter && (
            <HierarchicalLocationFilter
              organizationId={organizationId}
              nodes={layout.nodes || []}
              selectedLocations={selectedLocations}
              onChange={setSelectedLocations}
              onClose={() => setShowLocationFilter(false)}
            />
          )}

          {/* Valve Impact Analyzer */}
          {showValveImpact && selectedValveForImpact && (
            <ValveImpactAnalyzer
              valve={selectedValveForImpact}
              nodes={layout.nodes || []}
              connections={layout.connections || []}
              onClose={() => setShowValveImpact(false)}
              onHighlightNodes={(nodeIds) => {
                setFilters((prev) => ({
                  ...prev,
                  highlightedNodes: new Set(nodeIds),
                }));
              }}
            />
          )}

          {/* Stats Panel */}
          {showStats && (
            <NetworkStatsPanel
              nodes={layout.nodes || []}
              connections={layout.connections || []}
              onIssueClick={handleIssueClick}
            />
          )}

          {/* Properties Panel - read-only in locked mode */}
          {selectedElement && !isLocked && (
            <ElementPropertiesPanel
              element={selectedElement}
              organizationId={organizationId}
              layoutId={layout?.id}
              onClose={() => setSelectedElement(null)}
              onUpdate={handleElementUpdate}
              onDelete={handleElementDelete}
            />
          )}
          
          {/* Info Panel in locked mode - just shows details */}
          {selectedElement && isLocked && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{selectedElement.name}</h3>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium capitalize">{selectedElement.nodeType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Gas Type:</span>
                  <span className="ml-2 font-medium capitalize">{selectedElement.gasType?.replace(/_/g, ' ')}</span>
                </div>
                {selectedElement.valveType && (
                  <div>
                    <span className="text-gray-500">Valve Type:</span>
                    <span className="ml-2 font-medium capitalize">{selectedElement.valveType}</span>
                  </div>
                )}
                {selectedElement.fittingType && (
                  <div>
                    <span className="text-gray-500">Fitting Type:</span>
                    <span className="ml-2 font-medium capitalize">{selectedElement.fittingType}</span>
                  </div>
                )}
                <div className="pt-2 border-t mt-3">
                  <p className="text-xs text-gray-500">
                    <Lock className="inline h-3 w-3 mr-1" />
                    Unlock to edit this element
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          {showLegend && (
            <div className="absolute bottom-4 left-4 z-10">
              <GasLegend />
            </div>
          )}
        </div>

        {/* Quick Add Dialog */}
        {!isLocked && showQuickAdd && draggedElementType && dropPosition && (
          <QuickAddDialog
            open={showQuickAdd}
            elementType={draggedElementType}
            position={dropPosition}
            onSubmit={handleQuickAdd}
            onCancel={() => {
              setShowQuickAdd(false);
              setDraggedElementType(null);
              setDropPosition(null);
            }}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmationDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => !open && setDeleteConfirm({ open: false, element: null })}
          onConfirm={confirmDelete}
          title={`Delete ${deleteConfirm.element?.name || 'Element'}?`}
          description={`Are you sure you want to delete "${deleteConfirm.element?.name || 'this element'}"? This will also remove all connections to this element. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />

        {/* Keyboard Shortcuts Help */}
        <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription>
                Work faster with keyboard shortcuts
              </DialogDescription>
            </DialogHeader>
            <KeyboardShortcutsHelp shortcuts={shortcuts} />
          </DialogContent>
        </Dialog>

        {/* Equipment Import Dialog */}
        {siteId && (
          <EquipmentImportDialog
            open={showImportDialog}
            onClose={() => setShowImportDialog(false)}
            organizationId={organizationId}
            siteId={siteId}
            layoutId={layout.id}
            onImport={handleImportEquipment}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
