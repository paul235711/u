'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Scissors, Loader2, AlertCircle } from 'lucide-react';
import { GAS_OPTIONS, GAS_CONFIG } from './gas-config';
import type { ValveDialogState } from './types';
import type { GasType } from './gas-indicators';

interface ValveCreationDialogProps {
  dialog: ValveDialogState;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (gasTypes: GasType[]) => void;
  onClose: () => void;
}

const VALVE_TYPE_MAP = {
  building: 'Isolation',
  floor: 'Area',
  zone: 'Zone',
};

/**
 * Dialog for creating isolation valves
 */
export function ValveCreationDialog({
  dialog,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: ValveCreationDialogProps) {
  const [selectedGases, setSelectedGases] = useState<GasType[]>(['oxygen']);
  const valveType = dialog.type ? VALVE_TYPE_MAP[dialog.type] : 'Isolation';

  const handleGasToggle = (gasType: GasType, checked: boolean) => {
    if (checked) {
      setSelectedGases(prev => [...prev, gasType]);
    } else {
      setSelectedGases(prev => prev.filter(g => g !== gasType));
    }
  };

  const handleConfirm = () => {
    if (selectedGases.length === 0) return;
    onConfirm(selectedGases);
  };

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-red-600" />
            Create Isolation Valve{dialog.type === 'building' ? 's' : 's'}
          </DialogTitle>
          <DialogDescription>
            Create dedicated isolation valve{dialog.type === 'building' ? 's' : 's'} for <strong>{dialog.targetName}</strong>. These valves
            will be automatically assigned to the {dialog.type} location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Gas Type Selection */}
          <div className="space-y-3">
            <Label>Gas Types *</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {GAS_OPTIONS.map((option) => {
                const config = GAS_CONFIG[option.value];
                const isSelected = selectedGases.includes(option.value);

                return (
                  <div key={option.value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                    <Checkbox
                      id={`gas-${option.value}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleGasToggle(option.value, checked as boolean)}
                    />
                    <label
                      htmlFor={`gas-${option.value}`}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded ${config.bgColor} border border-white shadow-sm`}
                        title={config.label}
                      />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            {selectedGases.length === 0 && (
              <p className="text-xs text-red-600">Please select at least one gas type</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ {selectedGases.length} valve{selectedGases.length !== 1 ? 's' : ''} will be created</li>
              <li>✓ Each valve will be assigned to: <strong>{dialog.targetName}</strong></li>
              <li>✓ Gas types: <strong>{selectedGases.map(g => GAS_CONFIG[g].label).join(', ')}</strong></li>
              <li>✓ Ready to be placed on a synoptic layout</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || selectedGases.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Scissors className="mr-2 h-4 w-4" />
                Create {selectedGases.length} Valve{selectedGases.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
