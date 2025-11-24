'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Cylinder } from 'lucide-react';
import { NodeLocationBadge } from '../NodeLocationBadge';
import { getGasLineColor } from '../hierarchy/gas-config';

export const SourceNode = memo(({ data }: NodeProps) => {
  const gasColor = getGasLineColor(data.gasType as string);
  const showHandles = data.editable !== false;
  const isSelected = data.isSelected === true;
  const isDownstream = data.isDownstream === true;
  const rotation = (data.rotation as number) || 0;
  const showLocationBadge = (data as any).showLocationBadges && (data as any).siteId;

  let highlightClass = 'shadow-md transition-all duration-200';
  if (isSelected) {
    highlightClass = 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-110';
  } else if (isDownstream) {
    highlightClass = 'ring-1 ring-gray-400 shadow-md scale-105';
  }

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

  const fixedWidth = 120;

  return (
    <div className="relative inline-block">
      <div
        className={`px-2 py-1 rounded-md border-2 bg-white ${highlightClass}`}
        style={{
          width: `${fixedWidth}px`,
          borderColor: gasColor,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <Handle
          type="source"
          position={getHandlePosition()}
          className="w-2 h-2"
          style={{
            background: gasColor,
            border: '1px solid white',
            opacity: showHandles ? 0.9 : 0,
          }}
        />

        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center text-white px-1 py-0.5 rounded"
            style={{ backgroundColor: gasColor }}
          >
            <Cylinder className="w-4 h-4 text-white" />
          </div>

          <div className="overflow-hidden text-left">
            <div className="text-[10px] font-semibold text-gray-800 leading-tight truncate">
              {(data.label as string) || 'Source'}
            </div>
            <div className="text-[9px] text-gray-500 capitalize truncate">
              {(data.gasType as string)?.replace(/_/g, ' ')}
            </div>
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
