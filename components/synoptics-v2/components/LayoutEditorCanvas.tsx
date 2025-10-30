/**
 * Layout Editor Canvas - V2
 * Manages the ReactFlow canvas and node interactions
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedSynopticViewer } from '@/components/synoptics/enhanced-synoptic-viewer';
import { ElementToolbar } from '@/components/synoptics/element-toolbar';
import { useUIStore } from '../stores/ui-store';
import { useUpdateNodePosition } from '../hooks/use-layout';
import { apiClient } from '../api/client';

interface LayoutEditorCanvasProps {
  layout: any;
  layoutId: string;
  organizationId: string;
}

export function LayoutEditorCanvas({
  layout,
  layoutId,
  organizationId,
}: LayoutEditorCanvasProps) {
  const router = useRouter();
  const isLocked = useUIStore((state) => state.isLocked);
  const selectElement = useUIStore((state) => state.selectElement);
  
  // Mutation for updating node positions
  const { mutate: updatePosition } = useUpdateNodePosition();

  const handleNodeClick = useCallback((node: any) => {
    const fullElement = layout.nodes?.find((n: any) => n.id === node.id);
    if (fullElement) {
      selectElement(fullElement.id);
    }
  }, [layout.nodes, selectElement]);

  const handleNodeDragEnd = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!isLocked) {
      updatePosition({ nodeId, layoutId, position });
    }
  }, [isLocked, layoutId, updatePosition]);

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
        organizationId,
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
  }, [isLocked, layout.nodes, organizationId, router]);

  return (
    <>
      {!isLocked && <ElementToolbar onDragStart={() => {/* Handled by dialogs */}} />}
      
      <EnhancedSynopticViewer
        nodes={layout.nodes || []}
        connections={layout.connections || []}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={isLocked ? undefined : handleNodeDragEnd}
        onConnectionCreate={isLocked ? undefined : handleConnectionCreate}
        editable={!isLocked}
      />
    </>
  );
}
