'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Circle } from 'lucide-react';

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

export const FittingNode = memo(({ data }: NodeProps) => {
  const colors = getGasColor(data.gasType);
  
  return (
    <div className={`px-3 py-2 shadow-md rounded-full border-2 min-w-[80px] ${colors.bg} ${colors.border}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <Handle type="source" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <Circle className={`w-4 h-4 ${colors.text}`} />
        <div>
          <div className={`text-xs font-semibold ${colors.text}`}>{data.label || 'Fitting'}</div>
          <div className="text-[10px] text-gray-600 capitalize">
            {data.gasType?.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </div>
  );
});

FittingNode.displayName = 'FittingNode';
