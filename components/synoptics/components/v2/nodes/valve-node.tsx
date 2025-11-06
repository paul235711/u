'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import ValveIcon from '../../../icons/ValveIcon';

const GAS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  oxygen: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
  medical_air: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-700' },
  vacuum: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  nitrogen: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
  nitrous_oxide: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700' },
  carbon_dioxide: { bg: 'bg-gray-100', border: 'border-gray-600', text: 'text-gray-700' },
};

function getGasColor(gasType: string) {
  const normalized = gasType?.toLowerCase().replace(/\s+/g, '_') || 'oxygen';
  return GAS_COLORS[normalized] || GAS_COLORS.oxygen;
}

export const ValveNode = memo(({ data }: NodeProps) => {
  const colors = getGasColor(data.gasType);
  const showHandles = data.editable !== false; // Show handles only in editable mode
  const isSelected = data.isSelected === true;
  const isDownstream = data.isDownstream === true;
  
  // Determine highlight style
  let highlightClass = 'shadow-md';
  if (isSelected) {
    highlightClass = 'ring-4 ring-gray-900 ring-offset-2 shadow-2xl scale-110 animate-pulse-slow';
  } else if (isDownstream) {
    highlightClass = 'ring-2 ring-gray-500/50 shadow-lg shadow-gray-400/40 scale-105';
  }
  
  return (
    <div className={`px-2 py-1 rounded border min-w-[60px] ${colors.bg} ${colors.border} ${highlightClass} transition-all duration-150`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2" style={{ opacity: showHandles ? 1 : 0 }} />
      <Handle type="source" position={Position.Right} className="w-2 h-2" style={{ opacity: showHandles ? 1 : 0 }} />
      
      <div className="flex items-center justify-center gap-1">
        <ValveIcon className={`w-3 h-3 ${colors.text}`} />
        <span className={`text-xs font-bold ${colors.text}`}>
          {data.label}
        </span>
      </div>
    </div>
  );
});

ValveNode.displayName = 'ValveNode';
