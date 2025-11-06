'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Cylinder } from 'lucide-react';

const GAS_COLORS: Record<string, { bg: string; border: string }> = {
  oxygen: { bg: 'bg-red-500', border: 'border-red-700' },
  medical_air: { bg: 'bg-purple-600', border: 'border-purple-800' },
  vacuum: { bg: 'bg-green-500', border: 'border-green-700' },
  nitrogen: { bg: 'bg-blue-500', border: 'border-blue-700' },
  nitrous_oxide: { bg: 'bg-orange-500', border: 'border-orange-700' },
  carbon_dioxide: { bg: 'bg-gray-600', border: 'border-gray-800' },
};

function getGasColor(gasType: string) {
  const normalized = gasType?.toLowerCase().replace(/\s+/g, '_') || 'oxygen';
  return GAS_COLORS[normalized] || GAS_COLORS.oxygen;
}

export const SourceNode = memo(({ data }: NodeProps) => {
  const colors = getGasColor(data.gasType);
  const showHandles = data.editable !== false; // Show handles only in editable mode
  const isSelected = data.isSelected === true;
  const isDownstream = data.isDownstream === true;
  
  // Determine highlight style
  let highlightClass = 'shadow-lg';
  if (isSelected) {
    highlightClass = 'ring-4 ring-gray-900 ring-offset-2 shadow-2xl scale-110 animate-pulse-slow';
  } else if (isDownstream) {
    highlightClass = 'ring-2 ring-gray-500/50 shadow-lg shadow-gray-400/40 scale-105';
  }
  
  return (
    <div className={`px-4 py-3 rounded-lg ${colors.bg} border-2 ${colors.border} min-w-[120px] ${highlightClass} transition-all duration-150`}>
      <Handle type="source" position={Position.Right} className="w-3 h-3" style={{ opacity: showHandles ? 1 : 0 }} />
      
      <div className="flex items-center gap-2">
        <Cylinder className="w-5 h-5 text-white" />
        <div className="text-white">
          <div className="text-xs font-semibold">{data.label}</div>
          <div className="text-[10px] opacity-90 capitalize">{data.gasType?.replace(/_/g, ' ')}</div>
        </div>
      </div>
    </div>
  );
});

SourceNode.displayName = 'SourceNode';
