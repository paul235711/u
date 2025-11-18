'use client';

import { Button } from '@/components/ui/button';

interface FloorSummary {
  id: string;
  name: string;
}

interface BuildingSummary {
  id: string;
  name: string;
  floors?: FloorSummary[];
}

interface EquipmentFiltersProps {
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  selectedBuildingId: string;
  onBuildingChange: (id: string) => void;
  selectedFloorId: string;
  onFloorChange: (id: string) => void;
  selectedGasTypes: string[];
  onGasTypeToggle: (gasType: string) => void;
  buildings: BuildingSummary[];
  floorsForSelectedBuilding: FloorSummary[];
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
}

function humanise(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function EquipmentFilters({
  selectedTypes,
  onTypeToggle,
  selectedBuildingId,
  onBuildingChange,
  selectedFloorId,
  onFloorChange,
  selectedGasTypes,
  onGasTypeToggle,
  buildings,
  floorsForSelectedBuilding,
  filteredCount,
  totalCount,
  onReset,
}: EquipmentFiltersProps) {
  const gasOptions: { key: string; label: string }[] = [
    { key: 'oxygen', label: 'Oxygen (O₂)' },
    { key: 'medical_air', label: 'Medical Air' },
    { key: 'vacuum', label: 'Vacuum' },
    { key: 'nitrogen', label: 'Nitrogen (N₂)' },
    { key: 'nitrous_oxide', label: 'Nitrous Oxide (N₂O)' },
    { key: 'carbon_dioxide', label: 'Carbon Dioxide (CO₂)' },
    { key: 'compressed_air', label: 'Compressed Air' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="space-y-4">
        {/* Equipment Type Filters */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500">Equipment Type</label>
          <div className="flex flex-wrap gap-2">
            {['valve', 'source', 'fitting'].map((type) => (
              <Button
                key={type}
                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTypeToggle(type)}
              >
                {humanise(type)}
              </Button>
            ))}
          </div>
        </div>

        {/* Gas Filters */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500">Gas</label>
          <div className="flex flex-wrap gap-2">
            {gasOptions.map((gas) => (
              <Button
                key={gas.key}
                variant={selectedGasTypes.includes(gas.key) ? 'default' : 'outline'}
                size="sm"
                onClick={() => onGasTypeToggle(gas.key)}
              >
                {gas.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Location Filters */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Building</label>
            <select
              value={selectedBuildingId}
              onChange={(e) => onBuildingChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {floorsForSelectedBuilding.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Floor</label>
              <select
                value={selectedFloorId}
                onChange={(e) => onFloorChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All floors</option>
                {floorsForSelectedBuilding.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredCount}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> items
          </div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
