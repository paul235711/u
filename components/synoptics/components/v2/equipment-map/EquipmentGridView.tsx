'use client';

import { Loader2 } from 'lucide-react';
import { EquipmentCard } from '../EquipmentCard';

interface FloorSummary {
  id: string;
  name: string;
}

interface BuildingSummary {
  id: string;
  name: string;
  floors?: FloorSummary[];
}

interface EquipmentFeature {
  id: string;
  name: string;
  nodeType: 'valve' | 'source' | 'fitting';
  elementId: string;
  status: string;
  gasType: string;
  coordinates: [number, number] | null;
  buildingId: string | null;
  floorId: string | null;
}

interface EquipmentGridViewProps {
  isLoading: boolean;
  equipment: EquipmentFeature[];
  hasEquipment: boolean;
  buildingMap: Record<string, BuildingSummary>;
  onEquipmentClick: (item: EquipmentFeature) => void;
}

export function EquipmentGridView({
  isLoading,
  equipment,
  hasEquipment,
  buildingMap,
  onEquipmentClick,
}: EquipmentGridViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-20 text-center">
        <p className="text-sm text-gray-600">
          {hasEquipment ? 'No equipment matches the current filters' : 'No equipment available yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {equipment.map((item) => {
        const building = item.buildingId ? buildingMap[item.buildingId] : null;
        const floor = item.floorId && building
          ? building.floors?.find((f: FloorSummary) => f.id === item.floorId)
          : null;

        return (
          <EquipmentCard
            key={item.id}
            id={item.id}
            name={item.name}
            nodeType={item.nodeType}
            gasType={item.gasType}
            status={item.status}
            buildingName={building?.name}
            floorName={floor?.name}
            variant="default"
            onClick={() => onEquipmentClick(item)}
          />
        );
      })}
    </div>
  );
}
