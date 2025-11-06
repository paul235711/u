'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ValveListCard } from './valve-list-card';
import { MediaDisplay } from '../MediaDisplay';
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
  const [selectedValve, setSelectedValve] = useState<ValveInfo | null>(null);
  const title = TITLES[locationType];
  const dialogTitle = `${title} - ${locationName}`;

  const handleValveClick = (valve: ValveInfo) => {
    setSelectedValve(valve);
  };

  const handleCloseDetails = () => {
    setSelectedValve(null);
  };

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
          {selectedValve ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedValve.name}</h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to list
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Type:</span> {selectedValve.valveType}
                </div>
                <div>
                  <span className="font-medium text-gray-600">State:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                    selectedValve.state === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedValve.state}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Gas Type:</span> {selectedValve.gasType}
                </div>
                <div>
                  <span className="font-medium text-gray-600">Location:</span> {locationName}
                </div>
              </div>

              <MediaDisplay
                elementId={selectedValve.id}
                elementType="valve"
              />
            </div>
          ) : valves ? (
            <ValveListCard
              valves={valves}
              locationType={locationType}
              isLoading={isLoading}
              isEditMode={isEditMode}
              onEditValve={onEditValve}
              onValveClick={handleValveClick}
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
