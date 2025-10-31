'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ValveListCard } from './valve-list-card';
import type { ValveInfo, LocationType } from './types';

interface ValveViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valves: ValveInfo[] | null;
  locationType: LocationType;
  locationName: string;
  isLoading: boolean;
  isEditMode?: boolean;
  onEditValve?: (valve: ValveInfo) => void;
}

const TITLES = {
  building: 'Isolation Valves',
  floor: 'Floor Isolation Valves',
  zone: 'Zone Valves',
};

/**
 * Modal dialog for viewing valves at a specific location
 */
export function ValveViewerDialog({
  open,
  onOpenChange,
  valves,
  locationType,
  locationName,
  isLoading,
  isEditMode = false,
  onEditValve,
}: ValveViewerDialogProps) {
  const title = TITLES[locationType];
  const dialogTitle = `${title} - ${locationName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-blue-600">▶◀</span>
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {valves ? (
            <ValveListCard
              valves={valves}
              locationType={locationType}
              isLoading={isLoading}
              isEditMode={isEditMode}
              onEditValve={onEditValve}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading valves...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
