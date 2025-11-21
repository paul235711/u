'use client';

import { GAS_LINE_COLORS, GAS_CONFIG } from '../hierarchy/gas-config';

export function MapGasLegend() {
  const gasTypes = Object.entries(GAS_CONFIG).map(([key, config]) => {
    const color = GAS_LINE_COLORS[key] ?? GAS_LINE_COLORS.default;
    const label = config.shortLabel
      ? `${config.label} (${config.shortLabel})`
      : config.label;

    return { key, color, label };
  });

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 text-xs font-semibold text-gray-700">Gas Types</div>
      <div className="space-y-1.5">
        {gasTypes.map(({ key, color, label }) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
