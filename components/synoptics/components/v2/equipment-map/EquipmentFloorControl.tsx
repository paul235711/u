'use client';

interface FloorSummary {
  id: string;
  name: string;
}

interface EquipmentFloorControlProps {
  floors: FloorSummary[];
  selectedFloorId: string;
  onFloorChange: (id: string) => void;
}

export function EquipmentFloorControl({ floors, selectedFloorId, onFloorChange }: EquipmentFloorControlProps) {
  const orderedFloors = (floors || []).slice().reverse();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-col overflow-hidden rounded-full border border-gray-200 bg-white/90 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => onFloorChange('site')}
          className={`px-3 py-1.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white pt-2 ${
            selectedFloorId === 'site'
              ? 'bg-gray-900 text-white'
              : 'bg-transparent text-gray-800 hover:bg-gray-100'
          }`}
        >
          Site
        </button>

        {orderedFloors.map((floor, index) => {
          const isSelected = selectedFloorId === floor.id;
          const isLast = index === orderedFloors.length - 1;
          return (
            <button
              key={floor.id}
              type="button"
              onClick={() => onFloorChange(floor.id)}
              className={`px-3 py-1.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                isLast ? 'pb-2' : ''
              } ${
                isSelected
                  ? 'bg-gray-900 text-white'
                  : 'bg-transparent text-gray-800 hover:bg-gray-100'
              }`}
            >
              {floor.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
