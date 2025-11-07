'use client';

import { Button } from '@/components/ui/button';
import { Loader2, RotateCw, Trash2, Edit2, Zap, Box, X } from 'lucide-react';
import ValveIcon from '../../../../icons/ValveIcon';
import { EquipmentNode } from '../types';

interface SelectedEquipmentSectionProps {
  selectedEquipmentId: string | null;
  selectedEquipment: EquipmentNode | Record<string, any> | null | undefined;
  isLoading: boolean;
  onClearSelection: () => void;
  onOpenEdit: () => void;
  onRotate: () => void;
  onRemoveFromLayout: () => void;
  disableActions: boolean;
  disableRemove: boolean;
}

export function SelectedEquipmentSection({
  selectedEquipmentId,
  selectedEquipment,
  isLoading,
  onClearSelection,
  onOpenEdit,
  onRotate,
  onRemoveFromLayout,
  disableActions,
  disableRemove,
}: SelectedEquipmentSectionProps) {
  if (!selectedEquipmentId) {
    return null;
  }

  return (
    <div className="border-b bg-blue-50 p-3 space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      ) : selectedEquipment ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedEquipment.nodeType === 'source' && (
                <Zap className="h-4 w-4 text-yellow-600" />
              )}
              {selectedEquipment.nodeType === 'valve' && (
                <ValveIcon className="h-4 w-4 text-blue-600" />
              )}
              {selectedEquipment.nodeType === 'fitting' && (
                <Box className="h-4 w-4 text-purple-600" />
              )}
              <span className="font-medium text-sm">
                {selectedEquipment.name || 'Sans nom'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7"
              onClick={onOpenEdit}
              disabled={disableActions}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={onRotate}
              disabled={disableActions}
              title="Rotate 90°"
            >
              {disableActions ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCw className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2"
              onClick={onRemoveFromLayout}
              disabled={disableRemove}
              title="Retirer du layout"
            >
              {disableRemove ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500">Équipement sélectionné introuvable.</div>
      )}
    </div>
  );
}
