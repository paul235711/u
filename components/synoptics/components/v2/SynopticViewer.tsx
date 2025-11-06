'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
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
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { SynopticLegend } from './SynopticLegend';
import { useDownstreamNodes } from './hooks/useDownstreamNodes';

type EdgeToolMode = 'select' | 'cut';

interface SynopticViewerProps {
  nodes: any[];
  connections: any[];
  siteId?: string;
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
  siteId,
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  
  // Calculate downstream nodes from selected node
  const downstreamNodeIds = useDownstreamNodes(initialConnections, selectedNodeId);

  // Transform data to React Flow format
  const flowNodes: Node[] = useMemo(() => {
    return initialNodes.map((node) => {
      const isVisible = !visibleNodeIds || visibleNodeIds.has(node.id);
      const isHighlighted = highlightedNodeIds && highlightedNodeIds.has(node.id);
      const isSelected = !editable && selectedNodeId === node.id;
      const isDownstream = !editable && downstreamNodeIds.has(node.id);
      
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
          isSelected,
          isDownstream,
          editable, // Pass editable to node data for handle visibility
        },
        draggable: editable,
        // Apply visibility styling
        style: {
          opacity: isVisible ? 1 : 0.05,
        },
        // Apply highlighting
        className: isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : '',
      };
    });
  }, [initialNodes, editable, visibleNodeIds, highlightedNodeIds, selectedNodeId, downstreamNodeIds]);

  const cutModeActive = editable && edgeToolMode === 'cut';

  const flowEdges: Edge[] = useMemo(() => {
    return initialConnections.map((conn) => {
      const isVisible = (!visibleNodeIds || 
        (visibleNodeIds.has(conn.fromNodeId) && visibleNodeIds.has(conn.toNodeId)));

      // Determine if edge is connected to selected or downstream nodes
      const isFromSelected = !editable && selectedNodeId === conn.fromNodeId;
      const isConnectingDownstream = !editable && (
        (selectedNodeId === conn.fromNodeId && downstreamNodeIds.has(conn.toNodeId)) ||
        (downstreamNodeIds.has(conn.fromNodeId) && downstreamNodeIds.has(conn.toNodeId))
      );
      const isHighlightedEdge = isFromSelected || isConnectingDownstream;

      // Subtle styling for highlighted edges
      const strokeWidth = isHighlightedEdge ? 4 : 3;
      const opacity = isVisible ? (isHighlightedEdge ? 1 : 0.9) : 0.05;

      return {
        id: conn.id,
        source: conn.fromNodeId,
        target: conn.toNodeId,
        type: 'smoothstep',
        animated: isHighlightedEdge, // Animation for highlighted edges
        style: {
          stroke: getGasColor(conn.gasType),
          strokeWidth,
          opacity,
          cursor: cutModeActive ? 'crosshair' : 'pointer',
        },
        label: conn.diameterMm ? `Ø${conn.diameterMm}mm` : undefined,
        labelStyle: { 
          fontSize: 10, 
          fill: '#666',
          fontWeight: isHighlightedEdge ? 600 : 400,
        },
        labelBgStyle: { 
          fill: '#fff', 
          fillOpacity: 0.8,
        },
        data: conn,
      };
    });
  }, [initialConnections, visibleNodeIds, cutModeActive, editable, selectedNodeId, downstreamNodeIds]);

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
      // In non-editable mode, open details panel
      if (!editable) {
        setSelectedNodeId(node.id);
        setSelectedNodeData(node.data);
      }
      
      // Call parent callback if provided
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [editable, onNodeClick]
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

  const isEmpty = nodes.length === 0;

  // Calculate gas types and node types for legend
  const gasTypes = useMemo(() => {
    const types = new Set<string>();
    initialConnections.forEach((conn) => {
      if (conn.gasType) {
        types.add(conn.gasType);
      }
    });
    return types;
  }, [initialConnections]);

  const nodeTypeFlags = useMemo(() => {
    const flags = {
      hasSource: false,
      hasValve: false,
      hasFitting: false,
    };
    initialNodes.forEach((node) => {
      if (node.nodeType === 'source') flags.hasSource = true;
      if (node.nodeType === 'valve') flags.hasValve = true;
      if (node.nodeType === 'fitting') flags.hasFitting = true;
    });
    return flags;
  }, [initialNodes]);

  return (
    <div className="w-full h-full flex">
      <div 
        ref={reactFlowWrapper} 
        className={`flex-1 bg-gray-50 relative transition-all ${
          isDraggingOver && editable ? 'ring-4 ring-blue-400 ring-inset' : ''
        } ${cutModeActive ? 'cursor-crosshair' : ''}`}
      >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={editable ? handleEdgesDelete : undefined}
        onEdgeClick={editable ? handleEdgeClick : undefined}
        onConnect={editable ? handleConnect : undefined}
        onNodeClick={handleNodeClick}
        onNodeDragStop={editable ? handleNodeDragStop : undefined}
        onDrop={editable ? handleDrop : undefined}
        onDragOver={editable ? handleDragOver : undefined}
        onDragLeave={editable ? handleDragLeave : undefined}
        nodeTypes={nodeTypes}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={true}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        snapToGrid={editable}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 3 },
          type: 'smoothstep',
        }}
        connectionLineStyle={{ strokeWidth: 3 }}
        connectionLineType={'smoothstep' as any}
        deleteKeyCode={editable ? 'Delete' : null}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
      </ReactFlow>
      
      {/* Legend */}
      <SynopticLegend
        gasTypes={gasTypes}
        hasSource={nodeTypeFlags.hasSource}
        hasValve={nodeTypeFlags.hasValve}
        hasFitting={nodeTypeFlags.hasFitting}
      />
      
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
      
      {/* Details Panel */}
      {!editable && selectedNodeData && siteId && (
        <NodeDetailsPanel 
          node={selectedNodeData}
          siteId={siteId}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedNodeData(null);
          }} 
        />
      )}
    </div>
  );
}
