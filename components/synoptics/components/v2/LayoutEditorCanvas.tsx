/**
 * Layout Editor Canvas - V2
 * Manages the ReactFlow canvas and node interactions
 */

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SynopticViewer } from './SynopticViewer';
import { useUIStore } from '../../stores/ui-store';
import { useUpdateNodePosition } from '../../hooks/use-layout';
import { apiClient } from '../../api/client';
import { EquipmentBankEnhanced } from './EquipmentBankEnhanced';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

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
  const selectElement = useUIStore((state) => state.selectElement);
  const [showEquipmentBank, setShowEquipmentBank] = useState(false);
  
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

  const handleConnectionCreate = useCallback(async (fromNodeId: string, toNodeId: string) => {
    if (isLocked) return;

    try {
      const fromNode = layout.nodes?.find((n: any) => n.id === fromNodeId);
      const toNode = layout.nodes?.find((n: any) => n.id === toNodeId);

      if (!fromNode || !toNode) {
        alert('Error: Could not find nodes to connect.');
        return;
      }

      if (fromNode.gasType !== toNode.gasType) {
        alert(`Cannot connect different gas types!\n\nFrom: ${fromNode.name} (${fromNode.gasType})\nTo: ${toNode.name} (${toNode.gasType})`);
        return;
      }

      await apiClient.createConnection({
        siteId: layout.siteId,
        fromNodeId,
        toNodeId,
        gasType: fromNode.gasType,
        diameterMm: null,
      });

      router.refresh();
    } catch (error) {
      console.error('Failed to create connection:', error);
      alert('Failed to create connection. Please try again.');
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

  return (
    <div className="relative flex h-full">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Equipment Bank Toggle Button */}
        {!isLocked && !showEquipmentBank && (
          <Button
            className="absolute top-4 right-4 z-10 shadow-lg"
            onClick={() => setShowEquipmentBank(true)}
            title="Ouvrir la banque d'équipements"
          >
            <Package className="h-4 w-4 mr-2" />
            Banque d'Équipements
          </Button>
        )}
        
        <SynopticViewer
          nodes={layout.nodes || []}
          connections={layout.connections || []}
          onNodeClick={handleNodeClick}
          onNodeDragEnd={isLocked ? undefined : handleNodeDragEnd}
          onConnectionCreate={isLocked ? undefined : handleConnectionCreate}
          onConnectionDelete={isLocked ? undefined : handleConnectionDelete}
          edgeToolMode={isLocked ? 'select' : edgeToolMode}
          editable={!isLocked}
        />
      </div>

      {/* Equipment Bank Sidebar */}
      {showEquipmentBank && !isLocked && (
        <EquipmentBankEnhanced
          siteId={layout.siteId}
          layoutId={layoutId}
          onAddToLayout={(nodeId: string) => {
            addToLayoutMutation.mutate(nodeId);
          }}
          onClose={() => setShowEquipmentBank(false)}
        />
      )}
    </div>
  );
}
