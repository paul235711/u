'use client';

import { Button } from '@/components/ui/button';

interface EquipmentGasFilterControlProps {
  selectedGasTypes: string[];
  onGasTypeToggle: (gasType: string) => void;
}

const gasOptions: { key: string; label: string }[] = [
  { key: 'oxygen', label: 'Oxygen (O)' },
  { key: 'medical_air', label: 'Medical Air' },
  { key: 'vacuum', label: 'Vacuum' },
  { key: 'nitrogen', label: 'Nitrogen (N)' },
  { key: 'nitrous_oxide', label: 'Nitrous Oxide (NO)' },
  { key: 'carbon_dioxide', label: 'Carbon Dioxide (CO)' },
  { key: 'compressed_air', label: 'Compressed Air' },
];

export function EquipmentGasFilterControl({ selectedGasTypes, onGasTypeToggle }: EquipmentGasFilterControlProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-2 py-1 text-[11px] shadow-sm backdrop-blur">
      {gasOptions.map((gas) => {
        const isActive = selectedGasTypes.includes(gas.key);
        return (
          <Button
            key={gas.key}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-[11px] leading-none"
            onClick={() => onGasTypeToggle(gas.key)}
          >
            {gas.label}
          </Button>
        );
      })}
    </div>
  );
}
