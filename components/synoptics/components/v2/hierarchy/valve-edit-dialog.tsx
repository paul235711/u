'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Edit2, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { GAS_OPTIONS } from './gas-config';
import type { ValveInfo } from './types';
import type { GasType } from './gas-indicators';

interface ValveEditDialogProps {
  valve: ValveInfo | null;
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSave: (valveId: string, updates: Partial<ValveInfo>) => void;
  onDelete: (valveId: string) => void;
  onClose: () => void;
}

const VALVE_TYPE_OPTIONS = [
  { value: 'isolation', label: 'Isolation' },
  { value: 'area', label: 'Area' },
  { value: 'zone', label: 'Zone' },
  { value: 'shutoff', label: 'Shutoff' },
];

/**
 * Dialog for editing or deleting valves
 */
export function ValveEditDialog({
  valve,
  open,
  isSubmitting,
  error,
  onSave,
  onDelete,
  onClose,
}: ValveEditDialogProps) {
  const [name, setName] = useState(valve?.name || '');
  const [gasType, setGasType] = useState<GasType>((valve?.gasType as GasType) || 'oxygen');
  const [valveType, setValveType] = useState(valve?.valveType || 'isolation');
  const [state, setState] = useState<'open' | 'closed'>(valve?.state || 'open');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update state when valve changes
  useState(() => {
    if (valve) {
      setName(valve.name);
      setGasType(valve.gasType as GasType);
      setValveType(valve.valveType);
      setState(valve.state);
      setShowDeleteConfirm(false);
    }
  });

  const handleSave = () => {
    if (!valve) return;
    onSave(valve.id, { name, gasType, valveType, state });
  };

  const handleDelete = () => {
    if (!valve) return;
    onDelete(valve.id);
  };

  if (!valve) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-blue-600" />
            Edit Valve
          </DialogTitle>
          <DialogDescription>
            Modify valve properties or delete this valve.
          </DialogDescription>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <>
            <div className="space-y-4 py-4">
              {/* Valve Name */}
              <div className="space-y-2">
                <Label htmlFor="valve-name">Valve Name *</Label>
                <Input
                  id="valve-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Building - O₂ Isolation"
                />
              </div>

              {/* Gas Type */}
              <div className="space-y-2">
                <Label htmlFor="gas-type">Gas Type *</Label>
                <select
                  id="gas-type"
                  value={gasType}
                  onChange={(e) => setGasType(e.target.value as GasType)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GAS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valve Type */}
              <div className="space-y-2">
                <Label htmlFor="valve-type">Valve Type *</Label>
                <select
                  id="valve-type"
                  value={valveType}
                  onChange={(e) => setValveType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {VALVE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="valve-state">State *</Label>
                <select
                  id="valve-state"
                  value={state}
                  onChange={(e) => setState(e.target.value as 'open' | 'closed')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
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

            <div className="flex gap-2 justify-between">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Delete Valve?</h4>
                    <p className="text-sm text-red-800 mb-2">
                      Are you sure you want to delete <strong>{valve.name}</strong>?
                    </p>
                    <p className="text-sm text-red-700">
                      This action cannot be undone. The valve will be removed from the system and
                      any associated nodes will be deleted.
                    </p>
                  </div>
                </div>
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
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Valve
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
