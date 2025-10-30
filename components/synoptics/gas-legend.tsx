'use client';

import { Card } from '@/components/ui/card';

export function GasLegend() {
  const gasTypes = [
    { name: 'Oxygen', color: 'bg-red-500', code: 'O₂' },
    { name: 'Medical Air', color: 'bg-purple-600', code: 'Air' },
    { name: 'Vacuum', color: 'bg-green-500', code: 'VAC' },
    { name: 'Nitrogen', color: 'bg-blue-500', code: 'N₂' },
    { name: 'Nitrous Oxide', color: 'bg-orange-500', code: 'N₂O' },
    { name: 'Carbon Dioxide', color: 'bg-gray-600', code: 'CO₂' },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Gas Types</h3>
      <div className="grid grid-cols-2 gap-3">
        {gasTypes.map((gas) => (
          <div key={gas.name} className="flex items-center gap-2">
            <div className={`w-8 h-1 ${gas.color} rounded`}></div>
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
