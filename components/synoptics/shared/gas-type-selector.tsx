'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GAS_CONFIG } from '../components/v2/hierarchy/gas-config';

export const GAS_TYPES = Object.entries(GAS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  symbol: config.shortLabel,
  color: config.bgColor,
}));

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
