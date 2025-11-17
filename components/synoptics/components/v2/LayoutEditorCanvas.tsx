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
import { applyAutoLayout } from './hooks/useAutoLayout';
import { Annotation } from './AnnotationLayer';
import { useAnnotations } from './hooks/useAnnotations';
import { AnnotationBank } from './AnnotationBank';

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
      
      // Calculate new positions
      const nodesWithNewPositions = applyAutoLayout(nodes, {
        buildingSpacing: 400,
        floorSpacing: 300,
        gasSpacing: 120,
        startX: 100,
        startY: 100,
      });

      // Update all positions via API
      const updatePromises = nodesWithNewPositions.map(async (node) => {
        if (node.position) {
          const response = await fetch('/api/synoptics/node-positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: node.id,
              layoutId,
              x: node.position.x,
              y: node.position.y,
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
          nodes={layout.nodes || []}
          connections={layout.connections || []}
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
