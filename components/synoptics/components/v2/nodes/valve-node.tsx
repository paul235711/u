'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import ValveIcon from '../../../icons/ValveIcon';
import { NodeLocationBadge } from '../NodeLocationBadge';
import { getGasLineColor } from '../hierarchy/gas-config';

export const ValveNode = memo(({ data }: NodeProps) => {
  const gasColor = getGasLineColor(data.gasType as string);
  const showHandles = data.editable !== false; // Show handles only in editable mode
  const isSelected = data.isSelected === true;
  const isDownstream = data.isDownstream === true;
  const rotation = (data.rotation as number) || 0; // 0, 90, 180, 270
  const showLocationBadge = (data as any).showLocationBadges && (data as any).siteId;
  
  // Determine highlight style
  let highlightClass = 'shadow-md';
  if (isSelected) {
    highlightClass = 'ring-4 ring-gray-900 ring-offset-2 shadow-2xl scale-110 animate-pulse-slow';
  } else if (isDownstream) {
    highlightClass = 'ring-2 ring-gray-500/50 shadow-lg shadow-gray-400/40 scale-105';
  }
  
  // Handle positions based on rotation
  // 0°: Left (in) → Right (out)
  // 90°: Top (in) → Bottom (out)
  // 180°: Right (in) → Left (out)
  // 270°: Bottom (in) → Top (out)
  const getHandlePositions = () => {
    switch (rotation) {
      case 90:
        return { target: Position.Top, source: Position.Bottom };
      case 180:
        return { target: Position.Right, source: Position.Left };
      case 270:
        return { target: Position.Bottom, source: Position.Top };
      default:
        return { target: Position.Left, source: Position.Right };
    }
  };
  
  const handlePositions = getHandlePositions();
  
  return (
    <div className="relative inline-block">
      <div 
        className={`px-2 py-1 rounded border min-w-[60px] ${highlightClass} transition-all duration-300`}
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          backgroundColor: gasColor,
          borderColor: gasColor,
        }}
      >
        <Handle type="target" position={handlePositions.target} className="w-2 h-2" style={{ opacity: showHandles ? 1 : 0 }} />
        <Handle type="source" position={handlePositions.source} className="w-2 h-2" style={{ opacity: showHandles ? 1 : 0 }} />
        
        <div className="flex items-center justify-center gap-1 text-white">
          <ValveIcon className="w-3 h-3" />
          <span className="text-xs font-bold">
            {data.label as string}
          </span>
        </div>
      </div>

      {showLocationBadge && (
        <div className="absolute -top-4 right-0 z-10">
          <NodeLocationBadge node={data} siteId={(data as any).siteId as string} />
        </div>
      )}
    </div>
  );
});

ValveNode.displayName = 'ValveNode';
