'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Circle } from 'lucide-react';
import { NodeLocationBadge } from '../NodeLocationBadge';
import { getGasLineColor } from '../hierarchy/gas-config';

export const FittingNode = memo(({ data }: NodeProps) => {
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
  
  return (
    <div className="relative inline-block">
      <div 
        className={`px-3 py-2 rounded-full border-2 min-w-[80px] ${highlightClass} transition-all duration-150`}
        style={{ transform: `rotate(${rotation}deg)`, backgroundColor: gasColor, borderColor: gasColor }}
      >
        <Handle type="target" position={Position.Left} className="w-3 h-3" style={{ opacity: showHandles ? 1 : 0 }} />
        <Handle type="source" position={Position.Right} className="w-3 h-3" style={{ opacity: showHandles ? 1 : 0 }} />
        <Handle type="source" position={Position.Top} className="w-3 h-3" style={{ opacity: showHandles ? 1 : 0 }} />
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ opacity: showHandles ? 1 : 0 }} />
        
        <div className="flex items-center gap-2 text-white">
          <Circle className="w-4 h-4" />
          <div>
            <div className="text-xs font-semibold">{(data.label as string) || 'Fitting'}</div>
            <div className="text-[10px] text-gray-600 capitalize">
              {(data.gasType as string)?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>

      {showLocationBadge && (
        <div className="absolute -top-3 -right-3 z-10">
          <NodeLocationBadge node={data} siteId={(data as any).siteId as string} />
        </div>
      )}
    </div>
  );
});

FittingNode.displayName = 'FittingNode';
