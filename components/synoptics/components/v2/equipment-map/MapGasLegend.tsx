'use client';

const GAS_COLORS: Record<string, { color: string; label: string }> = {
  oxygen: { color: '#ef4444', label: 'Oxygen (O₂)' },
  medical_air: { color: '#9333ea', label: 'Medical Air' },
  vacuum: { color: '#22c55e', label: 'Vacuum' },
  nitrogen: { color: '#3b82f6', label: 'Nitrogen (N₂)' },
  nitrous_oxide: { color: '#f97316', label: 'Nitrous Oxide (N₂O)' },
  carbon_dioxide: { color: '#6b7280', label: 'Carbon Dioxide (CO₂)' },
  co2: { color: '#6b7280', label: 'CO₂' },
  compressed_air: { color: '#8b5cf6', label: 'Compressed Air' },
};

export function MapGasLegend() {
  const gasTypes = Object.entries(GAS_COLORS)
    .filter(([key]) => !['co2'].includes(key)) // Skip duplicates
    .map(([key, { color, label }]) => ({ key, color, label }));

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
