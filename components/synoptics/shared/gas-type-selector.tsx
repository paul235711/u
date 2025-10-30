'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export const GAS_TYPES = [
  { value: 'oxygen', label: 'Oxygen', symbol: 'O₂', color: 'bg-red-500' },
  { value: 'medical_air', label: 'Medical Air', symbol: 'Air', color: 'bg-purple-600' },
  { value: 'vacuum', label: 'Vacuum', symbol: 'VAC', color: 'bg-green-500' },
  { value: 'nitrogen', label: 'Nitrogen', symbol: 'N₂', color: 'bg-blue-500' },
  { value: 'nitrous_oxide', label: 'Nitrous Oxide', symbol: 'N₂O', color: 'bg-orange-500' },
  { value: 'carbon_dioxide', label: 'Carbon Dioxide', symbol: 'CO₂', color: 'bg-gray-600' },
] as const;

interface GasTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  idPrefix?: string;
  required?: boolean;
  showSymbol?: boolean;
}

export function GasTypeSelector({ 
  value, 
  onChange, 
  idPrefix = 'gas',
  required = false,
  showSymbol = true,
}: GasTypeSelectorProps) {
  return (
    <div>
      <Label>Gas Type {required && '*'}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="mt-2 space-y-2"
        aria-label="Select gas type"
      >
        {GAS_TYPES.map((gas) => (
          <div key={gas.value} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={gas.value} 
              id={`${idPrefix}-${gas.value}`}
              aria-label={`${gas.label} (${gas.symbol})`}
            />
            <Label
              htmlFor={`${idPrefix}-${gas.value}`}
              className="font-normal cursor-pointer flex items-center gap-2"
            >
              <div className={`w-8 h-1 ${gas.color} rounded`} aria-hidden="true"></div>
              <span>
                {gas.label}
                {showSymbol && <span className="text-gray-500 ml-1">({gas.symbol})</span>}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
