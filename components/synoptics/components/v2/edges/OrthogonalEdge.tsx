'use client';

import React from 'react';
import { EdgeProps, getBezierPath, Position } from '@xyflow/react';

interface OrthogonalEdgeData {
  gasType?: string;
  isHighlighted?: boolean;
  label?: string;
}

/**
 * Custom orthogonal edge that creates clean 90-degree angle connections
 * Similar to professional P&ID diagrams
 */
export function OrthogonalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  data,
  markerEnd,
  style = {},
}: EdgeProps) {
  const edgeData = data as OrthogonalEdgeData;
  
  // Calculate orthogonal path
  const createOrthogonalPath = () => {
    const points: string[] = [];
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    
    // Start point
    points.push(`M ${sourceX} ${sourceY}`);
    
    // Determine routing strategy based on positions
    if (sourcePosition === Position.Right && targetPosition === Position.Left) {
      // Horizontal flow (most common)
      const midX = sourceX + dx / 2;
      points.push(`L ${midX} ${sourceY}`); // Move horizontally to midpoint
      points.push(`L ${midX} ${targetY}`); // Move vertically
      points.push(`L ${targetX} ${targetY}`); // Complete horizontal to target
      
    } else if (sourcePosition === Position.Bottom && targetPosition === Position.Top) {
      // Vertical flow
      const midY = sourceY + dy / 2;
      points.push(`L ${sourceX} ${midY}`); // Move vertically to midpoint
      points.push(`L ${targetX} ${midY}`); // Move horizontally
      points.push(`L ${targetX} ${targetY}`); // Complete vertical to target
      
    } else if (sourcePosition === Position.Left && targetPosition === Position.Right) {
      // Reverse horizontal flow
      const midX = sourceX + dx / 2;
      points.push(`L ${midX} ${sourceY}`);
      points.push(`L ${midX} ${targetY}`);
      points.push(`L ${targetX} ${targetY}`);
      
    } else if (sourcePosition === Position.Top && targetPosition === Position.Bottom) {
      // Reverse vertical flow
      const midY = sourceY + dy / 2;
      points.push(`L ${sourceX} ${midY}`);
      points.push(`L ${targetX} ${midY}`);
      points.push(`L ${targetX} ${targetY}`);
      
    } else if (sourcePosition === Position.Right && targetPosition === Position.Top) {
      // Right to top (L shape)
      points.push(`L ${targetX} ${sourceY}`); // Move horizontally
      points.push(`L ${targetX} ${targetY}`); // Move vertically
      
    } else if (sourcePosition === Position.Right && targetPosition === Position.Bottom) {
      // Right to bottom
      points.push(`L ${targetX} ${sourceY}`);
      points.push(`L ${targetX} ${targetY}`);
      
    } else if (sourcePosition === Position.Bottom && targetPosition === Position.Left) {
      // Bottom to left
      points.push(`L ${sourceX} ${targetY}`);
      points.push(`L ${targetX} ${targetY}`);
      
    } else if (sourcePosition === Position.Bottom && targetPosition === Position.Right) {
      // Bottom to right
      points.push(`L ${sourceX} ${targetY}`);
      points.push(`L ${targetX} ${targetY}`);
      
    } else {
      // Default: Use midpoint routing
      const midX = sourceX + dx / 2;
      const midY = sourceY + dy / 2;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal dominant
        points.push(`L ${midX} ${sourceY}`);
        points.push(`L ${midX} ${targetY}`);
        points.push(`L ${targetX} ${targetY}`);
      } else {
        // Vertical dominant
        points.push(`L ${sourceX} ${midY}`);
        points.push(`L ${targetX} ${midY}`);
        points.push(`L ${targetX} ${targetY}`);
      }
    }
    
    return points.join(' ');
  };
  
  const edgePath = createOrthogonalPath();
  
  // Get gas color - use same function from hierarchy/gas-config
  const getGasColor = (gasType: string) => {
    switch (gasType) {
      case 'oxygen': return '#ef4444'; // Red
      case 'nitrous_oxide': return '#3b82f6'; // Blue  
      case 'medical_air': return '#a855f7'; // Purple
      case 'vacuum': return '#22c55e'; // Green
      case 'nitrogen': return '#fbbf24'; // Amber
      case 'carbon_dioxide': return '#6b7280'; // Gray
      default: return '#9ca3af'; // Gray-400
    }
  };
  
  const gasColor = edgeData?.gasType ? getGasColor(edgeData.gasType) : '#9ca3af';
  
  return (
    <>
      {/* Main path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          stroke: gasColor,
          strokeWidth: edgeData?.isHighlighted ? 3 : 2,
          fill: 'none',
          strokeLinecap: 'square',
          strokeLinejoin: 'miter',
          opacity: edgeData?.isHighlighted ? 1 : 0.85,
        }}
        markerEnd={markerEnd}
      />
      
      {/* Minimalist label if provided */}
      {edgeData?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{
              fontSize: '9px',
              fill: '#6b7280',
              fontWeight: 500,
            }}
            startOffset="50%"
            textAnchor="middle"
          >
            {edgeData.label}
          </textPath>
        </text>
      )}
      
      {/* Interactive hover area */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
        }}
        className="react-flow__edge-interaction"
      />
    </>
  );
}

export default OrthogonalEdge;
