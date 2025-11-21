'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Cylinder } from 'lucide-react';
import { NodeLocationBadge } from '../NodeLocationBadge';
import { getGasLineColor } from '../hierarchy/gas-config';

export const SourceNode = memo(({ data }: NodeProps) => {
  const gasColor = getGasLineColor(data.gasType as string);
  const showHandles = data.editable !== false; // Show handles only in editable mode
  const isSelected = data.isSelected === true;
  const isDownstream = data.isDownstream === true;
  const rotation = (data.rotation as number) || 0; // 0, 90, 180, 270
  const showLocationBadge = (data as any).showLocationBadges && (data as any).siteId;
  
  // Determine highlight style
  let highlightClass = 'shadow-lg';
  if (isSelected) {
    highlightClass = 'ring-4 ring-gray-900 ring-offset-2 shadow-2xl scale-110 animate-pulse-slow';
  } else if (isDownstream) {
    highlightClass = 'ring-2 ring-gray-500/50 shadow-lg shadow-gray-400/40 scale-105';
  }
  
  // Handle position based on rotation (sources only have output)
  // 0°: Right (out)
  // 90°: Bottom (out)
  // 180°: Left (out)
  // 270°: Top (out)
  const getHandlePosition = () => {
    switch (rotation) {
      case 90:
        return Position.Bottom;
      case 180:
        return Position.Left;
      case 270:
        return Position.Top;
      default:
        return Position.Right;
    }
  };
  
  const handlePosition = getHandlePosition();
  
  return (
    <div className="relative inline-block">
      <div 
        className={`px-4 py-3 rounded-lg border-2 min-w-[120px] ${highlightClass} transition-all duration-150`}
        style={{ transform: `rotate(${rotation}deg)`, backgroundColor: gasColor, borderColor: gasColor }}
      >
        <Handle type="source" position={handlePosition} className="w-3 h-3" style={{ opacity: showHandles ? 1 : 0 }} />
        
        <div className="flex items-center gap-2">
          <Cylinder className="w-5 h-5 text-white" />
          <div className="text-white">
            <div className="text-xs font-semibold">{data.label as string}</div>
            <div className="text-[10px] opacity-90 capitalize">{(data.gasType as string)?.replace(/_/g, ' ')}</div>
          </div>
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

SourceNode.displayName = 'SourceNode';
