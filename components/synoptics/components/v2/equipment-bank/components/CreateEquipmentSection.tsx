'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Plus, Zap, Box } from 'lucide-react';
import ValveIcon from '../../../../icons/ValveIcon';
import { GAS_OPTIONS, GasOptionValue } from '../constants';
import { EquipmentNodeType } from '../types';
import { Loader2 } from 'lucide-react';

interface CreateEquipmentSectionProps {
  isOpen: boolean;
  createType: EquipmentNodeType;
  createName: string;
  createGas: GasOptionValue;
  isSubmitting: boolean;
  onToggle: () => void;
  onTypeChange: (type: EquipmentNodeType) => void;
  onNameChange: (value: string) => void;
  onGasChange: (gas: GasOptionValue) => void;
  onSubmit: () => void;
}

export function CreateEquipmentSection({
  isOpen,
  createType,
  createName,
  createGas,
  isSubmitting,
  onToggle,
  onTypeChange,
  onNameChange,
  onGasChange,
  onSubmit,
}: CreateEquipmentSectionProps) {
  return (
    <div className="border-b">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Créer Nouvel Équipement
        </span>
        <Plus className="h-4 w-4 text-blue-600" />
      </button>

      {isOpen && (
        <div className="p-3 bg-gray-50 border-t space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={createType === 'valve' ? 'default' : 'outline'}
              onClick={() => onTypeChange('valve')}
              className="flex-1"
            >
              <ValveIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant={createType === 'source' ? 'default' : 'outline'}
              onClick={() => onTypeChange('source')}
              className="flex-1"
            >
              <Zap className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant={createType === 'fitting' ? 'default' : 'outline'}
              onClick={() => onTypeChange('fitting')}
              className="flex-1"
            >
              <Box className="h-3 w-3" />
            </Button>
          </div>

          <Input
            placeholder="Nom de l'équipement"
            value={createName}
            onChange={(event) => onNameChange(event.target.value)}
            className="h-8 text-sm"
          />

          <div>
            <Label className="text-xs text-gray-600">Type de gaz</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {GAS_OPTIONS.map((gas) => (
                <button
                  key={gas.value}
                  type="button"
                  onClick={() => onGasChange(gas.value)}
                  className={`px-2 py-1 text-xs font-medium text-white rounded transition-all ${gas.color} ${
                    createGas === gas.value ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  {gas.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!createName.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              'Créer'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
