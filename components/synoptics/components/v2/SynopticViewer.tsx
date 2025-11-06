'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  OnConnect,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SourceNode } from './nodes/source-node';
import { ValveNode } from './nodes/valve-node';
import { FittingNode } from './nodes/fitting-node';
import { CustomEdge } from '../../custom-edge';

type EdgeToolMode = 'select' | 'cut';

interface SynopticViewerProps {
  nodes: any[];
  connections: any[];
  onNodeClick?: (node: Node) => void;
  onNodeDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionCreate?: (fromNodeId: string, toNodeId: string) => Promise<void>;
  onConnectionDelete?: (
    connectionId: string,
    options?: { skipConfirm?: boolean }
  ) => Promise<void>;
  onDrop?: (position: { x: number; y: number }) => void;
  editable?: boolean;
  visibleNodeIds?: Set<string>;
  highlightedNodeIds?: Set<string>;
  edgeToolMode?: EdgeToolMode;
}

const GAS_COLORS = {
  oxygen: '#EF4444',
  medical_air: '#9333EA',
  vacuum: '#10B981',
  nitrogen: '#3B82F6',
  nitrous_oxide: '#F59E0B',
  carbon_dioxide: '#6B7280',
  default: '#000000',
};

function getGasColor(gasType: string): string {
  const normalized = gasType.toLowerCase().replace(/\s+/g, '_');
  return GAS_COLORS[normalized as keyof typeof GAS_COLORS] || GAS_COLORS.default;
}

export function SynopticViewer({
  nodes: initialNodes,
  connections: initialConnections,
  onNodeClick,
  onNodeDragEnd,
  onConnectionCreate,
  onConnectionDelete,
  onDrop,
  editable = false,
  visibleNodeIds,
  highlightedNodeIds,
  edgeToolMode = 'select',
}: SynopticViewerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Transform data to React Flow format
  const flowNodes: Node[] = useMemo(() => {
    return initialNodes.map((node) => {
      const isVisible = !visibleNodeIds || visibleNodeIds.has(node.id);
      const isHighlighted = highlightedNodeIds && highlightedNodeIds.has(node.id);
      
      // Handle position - it could be in different formats
      let xPos = 0;
      let yPos = 0;
      
      if (node.position) {
        // If position has xPosition/yPosition (from database)
        if ('xPosition' in node.position && 'yPosition' in node.position) {
          xPos = parseFloat(node.position.xPosition) || 0;
          yPos = parseFloat(node.position.yPosition) || 0;
        }
        // If position has x/y (from local state updates)
        else if ('x' in node.position && 'y' in node.position) {
          xPos = parseFloat(node.position.x) || 0;
          yPos = parseFloat(node.position.y) || 0;
        }
      }
      
      return {
        id: node.id,
        type: node.nodeType,
        position: {
          x: xPos,
          y: yPos,
        },
        data: {
          ...node,
          label: node.name || node.label || `${node.nodeType} ${node.id.slice(0, 8)}`,
          isVisible,
          isHighlighted,
        },
        draggable: editable,
        // Apply visibility styling
        style: {
          opacity: isVisible ? 1 : 0.15,
          transition: 'opacity 0.2s ease-in-out',
        },
        // Apply highlighting
        className: isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : '',
      };
    });
  }, [initialNodes, editable, visibleNodeIds, highlightedNodeIds]);

  const cutModeActive = editable && edgeToolMode === 'cut';

  const flowEdges: Edge[] = useMemo(() => {
    return initialConnections.map((conn) => {
      const isVisible = (!visibleNodeIds || 
        (visibleNodeIds.has(conn.fromNodeId) && visibleNodeIds.has(conn.toNodeId)));

      return {
        id: conn.id,
        source: conn.fromNodeId,
        target: conn.toNodeId,
        type: 'smoothstep', // Use smoothstep for better looking connections
        animated: false,
        style: {
          stroke: getGasColor(conn.gasType),
          strokeWidth: 3,
          opacity: isVisible ? 1 : 0.15,
          transition: 'opacity 0.2s ease-in-out',
          cursor: cutModeActive ? 'crosshair' : 'pointer',
        },
        label: conn.diameterMm ? `Ø${conn.diameterMm}mm` : undefined,
        labelStyle: { fontSize: 10, fill: '#666' },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        data: conn,
      };
    });
  }, [initialConnections, visibleNodeIds, cutModeActive]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  // Update edges when initialConnections change
  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Handle connection creation
  const handleConnect: OnConnect = useCallback(
    async (params: Connection) => {
      if (editable && params.source && params.target && onConnectionCreate) {
        // Add edge to UI immediately
        setEdges((eds) => addEdge(params, eds));
        // Save to database
        await onConnectionCreate(params.source, params.target);
      }
    },
    [editable, onConnectionCreate, setEdges]
  );

  const handleEdgesDelete = useCallback(
    (edgesToRemove: Edge[]) => {
      if (!cutModeActive) return;

      if (edgesToRemove.length === 0) return;

      if (onConnectionDelete) {
        edgesToRemove.forEach((edge) => {
          onConnectionDelete(edge.id, { skipConfirm: true });
        });
      }

      setEdges((current) =>
        current.filter((edge) => !edgesToRemove.some((removed) => removed.id === edge.id))
      );
    },
    [cutModeActive, onConnectionDelete, setEdges]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!cutModeActive) return;
      if (onConnectionDelete) {
        onConnectionDelete(edge.id, { skipConfirm: true });
      }
      setEdges((current) => current.filter((existing) => existing.id !== edge.id));
    },
    [cutModeActive, onConnectionDelete]
  );

  // Handle node drag end with auto-save
  const handleNodeDragStop = useCallback(
    (_event: any, node: any) => {
      if (editable && onNodeDragEnd) {
        onNodeDragEnd(node.id, node.position);
      }
    },
    [editable, onNodeDragEnd]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Handle drop from toolbar
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDraggingOver(false);

      if (!onDrop) return;

      // Use screenToFlowPosition to get accurate coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onDrop(position);
    },
    [onDrop, screenToFlowPosition]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only set to false if leaving the wrapper entirely
    if (event.currentTarget === event.target) {
      setIsDraggingOver(false);
    }
  }, []);

  const nodeTypes = useMemo(
    () => ({
      source: SourceNode,
      valve: ValveNode,
      fitting: FittingNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      default: CustomEdge,
      smoothstep: CustomEdge,
    }),
    []
  );

  const isEmpty = nodes.length === 0;

  return (
    <div 
      ref={reactFlowWrapper} 
      className={`w-full h-full bg-gray-50 relative transition-all ${
        isDraggingOver && editable ? 'ring-4 ring-blue-400 ring-inset' : ''
      } ${cutModeActive ? 'cursor-crosshair' : ''}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onEdgesDelete={handleEdgesDelete}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 3 },
          type: 'smoothstep',
        }}
        connectionLineStyle={{ strokeWidth: 3 }}
        connectionLineType={'smoothstep' as any}
        attributionPosition="bottom-left"
        deleteKeyCode={editable ? 'Delete' : null}
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        <Controls position="top-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            if (node.type === 'source') return '#10B981';
            if (node.type === 'valve') return '#EF4444';
            if (node.type === 'fitting') return '#3B82F6';
            return '#6B7280';
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(255, 255, 255, 0.8)"
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          zoomable
          pannable
        />
      </ReactFlow>
      
      {/* Empty State */}
      {isEmpty && editable && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-lg p-8 text-center max-w-md">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No elements yet</h3>
            <p className="text-sm text-gray-600">
              Drag elements from the toolbar above to start building your gas distribution layout
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
