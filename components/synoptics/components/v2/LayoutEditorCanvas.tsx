/**
 * Layout Editor Canvas - V2
 * Manages the ReactFlow canvas and node interactions
 */

'use client';

import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SynopticViewer } from './SynopticViewer';
import { useUIStore } from '../../stores/ui-store';
import { useUpdateNodePosition } from '../../hooks/use-layout';
import { apiClient } from '../../api/client';
import { EquipmentBankEnhanced } from './EquipmentBankEnhanced';
import { Button } from '@/components/ui/button';
import { Package, Grid3x3, Building2 } from 'lucide-react';
import { applyAutoLayout, AutoLayoutConfig } from './hooks/useAutoLayout';
import { Annotation } from './AnnotationLayer';
import { useAnnotations } from './hooks/useAnnotations';
import { AnnotationBank } from './AnnotationBank';
import { applyNetworkFilters } from '../../shared/network-utils';

interface LayoutEditorCanvasProps {
  layout: any;
  layoutId: string;
}

export function LayoutEditorCanvas({
  layout,
  layoutId,
}: LayoutEditorCanvasProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLocked = useUIStore((state) => state.isLocked);
  const edgeToolMode = useUIStore((state) => state.edgeToolMode);
  const annotationMode = useUIStore((state) => state.annotationMode);
  const toggleAnnotationMode = useUIStore((state) => state.toggleAnnotationMode);
  const selectElement = useUIStore((state) => state.selectElement);
  const showLocationBadges = useUIStore((state) => state.showLocationBadges);
  const filters = useUIStore((state) => state.filters);
  const [showEquipmentBank, setShowEquipmentBank] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Manage annotations with persistent storage
  const { annotations, setAnnotations, loadAnnotations } = useAnnotations(layoutId);
  
  // Expose refresh for annotation drag updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__refreshAnnotations = loadAnnotations;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__refreshAnnotations;
      }
    };
  }, [loadAnnotations]);
  
  // Mutation for updating node positions
  const { mutate: updatePosition } = useUpdateNodePosition();

  const handleNodeClick = useCallback((node: any) => {
    const fullElement = layout.nodes?.find((n: any) => n.id === node.id);
    if (fullElement) {
      selectElement(fullElement.id);
      // Auto-open Equipment Bank when an element is selected
      if (!isLocked) {
        setShowEquipmentBank(true);
      }
    }
  }, [layout.nodes, selectElement, isLocked]);

  const handleNodeDragEnd = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!isLocked) {
      updatePosition({ nodeId, layoutId, position });
    }
  }, [isLocked, layoutId, updatePosition]);

  // Mutation to add equipment to layout
  const addToLayoutMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const response = await fetch('/api/synoptics/node-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          layoutId,
          x: 150,
          y: 150,
        }),
      });
      if (!response.ok) throw new Error('Failed to add equipment to layout');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['layout-positions', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['node-positions'] });

      // Reload annotations so newly auto-generated ones are visible immediately
      loadAnnotations();

      router.refresh();
    },
  });

  // Handle removing node from layout (not deleting equipment!)
  const handleRemoveFromLayout = useCallback(async (nodeId: string) => {
    if (!confirm('Retirer cet équipement du layout ? (L\'équipement ne sera pas supprimé)')) return;

    try {
      const positionId = `${nodeId}-${layoutId}`;
      const response = await fetch(`/api/synoptics/node-positions/${positionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove from layout');

      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['layout-positions', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['node-positions'] });
      router.refresh();
    } catch (error) {
      console.error('Failed to remove from layout:', error);
      alert('Failed to remove from layout');
    }
  }, [layoutId, queryClient, router]);

  const handleConnectionCreate = useCallback(async (fromNodeId: string, toNodeId: string): Promise<string | void> => {
    if (isLocked) return;

    try {
      const fromNode = layout.nodes?.find((n: any) => n.id === fromNodeId);
      const toNode = layout.nodes?.find((n: any) => n.id === toNodeId);

      if (!fromNode || !toNode) {
        alert('Error: Could not find nodes to connect.');
        throw new Error('Nodes not found');
      }

      if (fromNode.gasType !== toNode.gasType) {
        alert(`Cannot connect different gas types!\n\nFrom: ${fromNode.name} (${fromNode.gasType})\nTo: ${toNode.name} (${toNode.gasType})`);
        throw new Error('Gas type mismatch');
      }

      // Create connection and get the real ID from database
      const connection = await apiClient.createConnection({
        siteId: layout.siteId,
        fromNodeId,
        toNodeId,
        gasType: fromNode.gasType,
        diameterMm: null,
      }) as { id: string };

      router.refresh();
      
      // Return the real connection ID
      return connection.id;
    } catch (error) {
      console.error('Failed to create connection:', error);
      // Re-throw to trigger rollback in handleConnect
      throw error;
    }
  }, [isLocked, layout.nodes, layout.siteId, router]);

  const handleConnectionDelete = useCallback(async (
    connectionId: string,
    options?: { skipConfirm?: boolean }
  ) => {
    if (isLocked) return;

    try {
      if (!options?.skipConfirm) {
        const confirmed = confirm('Supprimer cette connexion ?');
        if (!confirmed) return;
      }

      await apiClient.deleteConnection(connectionId);

      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['layout-positions', layoutId] });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('Failed to delete connection. Please try again.');
    }
  }, [isLocked, layoutId, queryClient, router]);

  // Auto-layout mutation
  const autoLayoutMutation = useMutation({
    mutationFn: async () => {
      const nodes = layout.nodes || [];
      
      // Extract unique buildings, floors, and zones from nodes
      const buildingSet = new Map<string, { id: string; name: string }>();
      const floorSet = new Map<string, { id: string; floorNumber: number; name?: string }>();
      const zoneSet = new Map<string, { id: string; name: string }>();
      
      nodes.forEach((node: any) => {
        if (node.buildingId && node.buildingName) {
          buildingSet.set(node.buildingId, {
            id: node.buildingId,
            name: node.buildingName,
          });
        }
        if (node.floorId && node.floorNumber !== undefined) {
          floorSet.set(node.floorId, {
            id: node.floorId,
            floorNumber: node.floorNumber,
            name: node.floorName,
          });
        }
        if (node.zoneId && node.zoneName) {
          zoneSet.set(node.zoneId, {
            id: node.zoneId,
            name: node.zoneName,
          });
        }
      });
      
      const buildings = Array.from(buildingSet.values());
      const floors = Array.from(floorSet.values());
      const zones = Array.from(zoneSet.values());

      // Enhanced layout configuration with trunk layout (vertical main line)
      const layoutConfig: AutoLayoutConfig = {
        startX: 200,
        startY: 280,
        buildingWidth: 420,
        buildingSpacing: 40,
        buildingPadding: 15,
        floorHeight: 200,
        floorSpacing: 15,
        floorPadding: 15,
        zoneMinWidth: 100,
        zoneSpacing: 5,
        zonePadding: 10,
        valveSpacing: 45,
        useColumnLayout: true,
        columnWidth: 80,
        columnSpacing: 25,
        buildingValveScale: 1.2,
        floorValveScale: 1.0,
        zoneValveScale: 0.9,
        mode: 'trunk',
      };

      // Calculate new positions with proper building/floor/zone sorting
      const nodesWithNewPositions = applyAutoLayout(nodes, buildings, floors, zones, layoutConfig);

      // Delete all existing annotations for this layout to avoid stacking legacy rectangles
      try {
        const deleteResponse = await fetch(`/api/synoptics/annotations/bulk?layoutId=${layoutId}`, {
          method: 'DELETE',
        });
        if (!deleteResponse.ok) {
          console.warn('Annotation cleanup failed before auto-layout:', await deleteResponse.text());
        }
      } catch (error) {
        console.error('Failed to clear annotations before regeneration:', error);
      }

      // === Auto-annotation generation (buildings, floors, zones) ===
      type CellKey = string;
      type Cell = {
        key: CellKey;
        type: 'zone' | 'floor';
        title: string;
        buildingId?: string | null;
        floorId?: string | null;
        zoneId?: string | null;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      };

      const cells = new Map<CellKey, Cell>();

      nodesWithNewPositions.forEach((node: any) => {
        if (!node.position) return;
        const { x, y } = node.position;
        const buildingId = node.buildingId || null;
        const floorId = node.floorId || null;
        const zoneId = node.zoneId || null;

        // Only annotate building/floor/zone scoped nodes
        if (!buildingId || !floorId) return;

        let key: CellKey;
        let type: 'zone' | 'floor';
        let title: string;

        if (zoneId) {
          key = `zone:${buildingId}:${floorId}:${zoneId}`;
          type = 'zone';
          title = node.zoneName || 'Zone';
        } else {
          key = `floor:${buildingId}:${floorId}`;
          type = 'floor';
          title = node.floorName || 'Floor';
        }

        const existing = cells.get(key);
        if (!existing) {
          cells.set(key, {
            key,
            type,
            title,
            buildingId,
            floorId,
            zoneId,
            minX: x,
            maxX: x,
            minY: y,
            maxY: y,
          });
        } else {
          existing.minX = Math.min(existing.minX, x);
          existing.maxX = Math.max(existing.maxX, x);
          existing.minY = Math.min(existing.minY, y);
          existing.maxY = Math.max(existing.maxY, y);
        }
      });

      // Aggregate per-building bounds to place building header annotations
      type BuildingBounds = {
        buildingId: string;
        title: string;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      };

      const buildingBounds = new Map<string, BuildingBounds>();

      nodesWithNewPositions.forEach((node: any) => {
        if (!node.position) return;
        if (!node.buildingId) return;

        const { x, y } = node.position;
        const buildingId = node.buildingId;
        const title = node.buildingName || 'Building';

        const existing = buildingBounds.get(buildingId);
        if (!existing) {
          buildingBounds.set(buildingId, {
            buildingId,
            title,
            minX: x,
            maxX: x,
            minY: y,
            maxY: y,
          });
        } else {
          existing.minX = Math.min(existing.minX, x);
          existing.maxX = Math.max(existing.maxX, x);
          existing.minY = Math.min(existing.minY, y);
          existing.maxY = Math.max(existing.maxY, y);
        }
      });

      const paddingX = 120;
      const paddingY = 80;

      // Reuse existing auto-generated annotations when possible (to avoid ID churn)
      const existingAuto = (annotations || []).filter((ann: any) => ann?.metadata?.autoGenerated);

      // Building header annotations (one per building column)
      const buildingHeaderHeight = 44;

      // Remove old building bounds computation - we'll use direct positioning instead

      // Get sorted building IDs and floor numbers for grid generation
      const buildingIds = Array.from(new Set([...Array.from(buildingBounds.keys())]));
      const sortedBuildingIds = buildingIds.sort((aId, bId) => {
        const aName = buildings.find(b => b.id === aId)?.name.toLowerCase() || '';
        const bName = buildings.find(b => b.id === bId)?.name.toLowerCase() || '';
        const order: Record<string, number> = { dominicaines: 0, medecine: 1, chirurgie: 2 };
        const aOrderKey = Object.keys(order).find((k) => aName.includes(k));
        const bOrderKey = Object.keys(order).find((k) => bName.includes(k));
        const aIndex = aOrderKey ? order[aOrderKey] : 999;
        const bIndex = bOrderKey ? order[bOrderKey] : 999;
        return aIndex - bIndex;
      });

      const uniqueFloorNumbers = Array.from(new Set(floors.map(f => f.floorNumber ?? 0))).sort((a, b) => b - a);

      const makeAutoKey = (
        scope: string,
        ids: { buildingId?: string | null; floorId?: string | null; zoneId?: string | null }
      ) => `${scope}|${ids.buildingId ?? ''}|${ids.floorId ?? ''}|${ids.zoneId ?? ''}`;

      const existingAutoMap = new Map<string, any>();
      existingAuto.forEach((ann: any) => {
        const meta = ann.metadata || {};
        if (!meta?.autoGenerated || !meta.scope) return;
        existingAutoMap.set(
          makeAutoKey(meta.scope, {
            buildingId: meta.buildingId,
            floorId: meta.floorId,
            zoneId: meta.zoneId,
          }),
          ann
        );
      });

      const reuseAutoId = (
        scope: string,
        ids: { buildingId?: string | null; floorId?: string | null; zoneId?: string | null }
      ) => existingAutoMap.get(makeAutoKey(scope, ids))?.id;

      const buildingPaddingX = 160;
      const buildingPaddingY = 120;
      const floorPaddingX = 90;
      const floorPaddingTop = 55;
      const floorPaddingBottom = 40;
      const zonePaddingX = 60;
      const zonePaddingTop = 60;
      const zonePaddingBottom = 35;

      const buildingContainerAnnotations = Array.from(buildingBounds.values()).map((bounds) => {
        const contentWidth = Math.max(80, bounds.maxX - bounds.minX);
        const contentHeight = Math.max(80, bounds.maxY - bounds.minY);
        const width = contentWidth + buildingPaddingX;
        const height = contentHeight + buildingPaddingY;
        const position = {
          x: bounds.minX - buildingPaddingX / 2,
          y: bounds.minY - buildingPaddingY / 2,
        };

        return {
          id: reuseAutoId('building-container', { buildingId: bounds.buildingId }),
          type: 'zone',
          title: '',
          position,
          size: { width, height },
          fill: '#f3f4f6',
          fillOpacity: 0.35,
          stroke: '#cbd5f5',
          interactive: false,
          metadata: {
            autoGenerated: true,
            scope: 'building-container',
            buildingId: bounds.buildingId,
          },
        };
      });

      const floorContainerAnnotations = Array.from(cells.values())
        .filter((cell) => cell.type === 'floor')
        .map((cell) => {
          const contentWidth = Math.max(60, cell.maxX - cell.minX);
          const contentHeight = Math.max(60, cell.maxY - cell.minY);
          const width = contentWidth + floorPaddingX;
          const height = contentHeight + floorPaddingTop + floorPaddingBottom;
          const position = {
            x: cell.minX - (width - contentWidth) / 2,
            y: cell.minY - floorPaddingTop,
          };

          return {
            id: reuseAutoId('floor', { buildingId: cell.buildingId, floorId: cell.floorId }),
            type: 'zone',
            title: cell.title,
            position,
            size: { width, height },
            fill: '#e0e7ff',
            fillOpacity: 0.22,
            stroke: '#94a3b8',
            interactive: true,
            metadata: {
              autoGenerated: true,
              scope: 'floor',
              buildingId: cell.buildingId,
              floorId: cell.floorId,
            },
          };
        });

      const zoneAnnotations = Array.from(cells.values())
        .filter((cell) => cell.type === 'zone')
        .map((cell) => {
          const contentWidth = Math.max(40, cell.maxX - cell.minX);
          const contentHeight = Math.max(40, cell.maxY - cell.minY);
          const width = contentWidth + zonePaddingX;
          const height = contentHeight + zonePaddingTop + zonePaddingBottom;
          const position = {
            x: cell.minX - (width - contentWidth) / 2,
            y: cell.minY - zonePaddingTop,
          };

          return {
            id: reuseAutoId('zone', { buildingId: cell.buildingId, floorId: cell.floorId, zoneId: cell.zoneId }),
            type: 'zone',
            title: cell.title,
            position,
            size: { width, height },
            fill: '#ede9fe',
            fillOpacity: 0.25,
            stroke: '#c4b5fd',
            interactive: true,
            metadata: {
              autoGenerated: true,
              scope: 'zone',
              buildingId: cell.buildingId,
              floorId: cell.floorId,
              zoneId: cell.zoneId,
            },
          };
        });

      const buildingAnnotations = Array.from(buildingBounds.values()).map((bounds) => {
        const buildingName = bounds.title;
        const height = buildingHeaderHeight;
        const containerWidth = bounds.maxX - bounds.minX + buildingPaddingX;
        const width = Math.max(260, containerWidth);
        const containerX = bounds.minX - buildingPaddingX / 2;
        const containerTop = bounds.minY - buildingPaddingY / 2;
        const position = {
          x: containerX,
          y: containerTop - height - 12,
        };

        const existing = reuseAutoId('building', { buildingId: bounds.buildingId });

        return {
          id: existing,
          type: 'building',
          title: buildingName,
          subtitle: undefined,
          position,
          size: { width, height },
          color: '#111827',
          style: 'minimal',
          interactive: false,
          metadata: {
            autoGenerated: true,
            scope: 'building',
            buildingId: bounds.buildingId,
          },
        };
      });

      const autoAnnotationsPayload = [
        ...buildingContainerAnnotations,
        ...floorContainerAnnotations,
        ...zoneAnnotations,
        ...buildingAnnotations,
      ];

      if (autoAnnotationsPayload.length > 0) {
        try {
          await fetch('/api/synoptics/annotations/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layoutId, annotations: autoAnnotationsPayload }),
          });
        } catch (error) {
          console.error('Auto-annotation generation failed:', error);
        }
      }

      // Update all positions via API (upsert semantics)
      const updatePromises = nodesWithNewPositions.map(async (node) => {
        if (node.position) {
          const response = await fetch('/api/synoptics/node-positions/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: node.id,
              layoutId,
              xPosition: node.position.x,
              yPosition: node.position.y,
            }),
          });
          if (!response.ok) throw new Error(`Failed to update position for node ${node.id}`);
          return response.json();
        }
      });

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['layout-positions', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['node-positions'] });
      router.refresh();
    },
    onError: (error) => {
      console.error('Auto-layout failed:', error);
      alert('Échec du positionnement automatique. Veuillez réessayer.');
    },
  });

  const handleAutoLayout = useCallback(() => {
    if (isLocked) return;
    
    const confirmed = confirm(
      'Appliquer un positionnement automatique ?\n\n' +
      'Les équipements seront organisés par :\n' +
      '• Bâtiment (axe horizontal)\n' +
      '• Étage (axe vertical)\n' +
      '• Type de gaz (empilés verticalement)\n\n' +
      'Les positions actuelles seront écrasées.'
    );
    
    if (confirmed) {
      autoLayoutMutation.mutate();
    }
  }, [isLocked, autoLayoutMutation]);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const { visibleNodeIds, visibleConnectionIds } = useMemo(
    () => applyNetworkFilters(layout.nodes || [], layout.connections || [], filters),
    [layout.nodes, layout.connections, filters]
  );

  const filteredNodes = useMemo(
    () => (layout.nodes || []).filter((n: any) => visibleNodeIds.has(n.id)),
    [layout.nodes, visibleNodeIds]
  );

  const filteredConnections = useMemo(
    () => (layout.connections || []).filter((c: any) => visibleConnectionIds.has(c.id)),
    [layout.connections, visibleConnectionIds]
  );

  return (
    <div className="relative flex h-full">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Top Action Buttons */}
        {!isLocked && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {/* Auto-layout Button */}
            <Button
              className="shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAutoLayout}
              disabled={autoLayoutMutation.isPending}
              title="Positionner automatiquement les équipements par bâtiment, étage et type de gaz"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              {autoLayoutMutation.isPending ? 'Positionnement...' : 'Auto-Layout'}
            </Button>
            
            {/* Toggle Annotation Mode Button */}
            <Button
              variant={annotationMode ? 'default' : 'outline'}
              className={`shadow-lg ${annotationMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
              onClick={toggleAnnotationMode}
              title="Mode Annotation - Dessiner des zones et labels"
            >
              <Building2 className="h-4 w-4 mr-2" />
              {annotationMode ? 'Mode Annotation' : 'Annotations'}
            </Button>
            
            {/* Equipment Bank Toggle Button */}
            {!showEquipmentBank && (
              <Button
                className="shadow-lg"
                onClick={() => setShowEquipmentBank(true)}
                title="Open the equipment bank"
              >
                <Package className="h-4 w-4 mr-2" />
                Equipements
              </Button>
            )}
          </div>
        )}
        
        <SynopticViewer
          nodes={filteredNodes}
          connections={filteredConnections}
          siteId={layout.siteId}
          onNodeClick={handleNodeClick}
          onNodeDragEnd={isLocked ? undefined : handleNodeDragEnd}
          onConnectionCreate={isLocked ? undefined : handleConnectionCreate}
          onConnectionDelete={isLocked ? undefined : handleConnectionDelete}
          edgeToolMode={isLocked ? 'select' : edgeToolMode}
          editable={!isLocked && !annotationMode}
          annotations={annotations}
          showAnnotations={showAnnotations}
          showLocationBadges={showLocationBadges}
        />
      </div>

      {/* Equipment Bank */}
      {showEquipmentBank && !isLocked && (
        <EquipmentBankEnhanced
          siteId={layout.siteId}
          layoutId={layoutId}
          layout={layout}
          onAddToLayout={(nodeId: string) => {
            addToLayoutMutation.mutate(nodeId);
          }}
          onClose={() => setShowEquipmentBank(false)}
        />
      )}

      {/* Annotation Bank */}
      {annotationMode && (
        <AnnotationBank
          siteId={layout.siteId}
          layoutId={layoutId}
          annotations={annotations}
          onRefresh={loadAnnotations}
          onClose={() => toggleAnnotationMode()}
        />
      )}
    </div>
  );
}
