'use client';

import { Card } from '@/components/ui/card';
import { GAS_CONFIG, GAS_LINE_COLORS } from './hierarchy/gas-config';

export function GasLegend() {
  const gasTypes = Object.entries(GAS_CONFIG).map(([key, config]) => ({
    key,
    name: config.label,
    code: config.shortLabel,
    color: GAS_LINE_COLORS[key] ?? GAS_LINE_COLORS.default,
  }));

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Gas Types</h3>
      <div className="grid grid-cols-2 gap-3">
        {gasTypes.map((gas) => (
          <div key={gas.key} className="flex items-center gap-2">
            <div className="w-8 h-1 rounded" style={{ backgroundColor: gas.color }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">{gas.name}</div>
              <div className="text-[10px] text-gray-500">{gas.code}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
