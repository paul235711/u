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
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg ${colors.bg} border-2 ${colors.border} min-w-[120px]`}>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
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
