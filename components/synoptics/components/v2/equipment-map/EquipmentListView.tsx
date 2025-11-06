'use client';

import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface EquipmentListViewProps {
  isLoading: boolean;
  equipment: EquipmentFeature[];
  hasEquipment: boolean;
  buildingMap: Record<string, BuildingSummary>;
  onEquipmentClick: (item: EquipmentFeature) => void;
}

export function EquipmentListView({
  isLoading,
  equipment,
  hasEquipment,
  buildingMap,
  onEquipmentClick,
}: EquipmentListViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-gray-600">
          {hasEquipment ? 'No equipment matches the current filters' : 'No equipment available yet'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="p-3 space-y-2">
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
              variant="compact"
              onClick={() => onEquipmentClick(item)}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
