'use client';

import { cn } from '@/lib/utils';
import { GAS_CONFIG, PRIMARY_GASES } from './gas-config';

export type GasType = 'oxygen' | 'medical_air' | 'vacuum' | 'nitrous_oxide' | 'nitrogen' | 'carbon_dioxide';

interface GasIndicatorsProps {
  gases: GasType[];
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

/**
 * Displays gas type indicators showing which gases have valves at this location
 * Shows ONLY the gas types that actually exist (not empty placeholders)
 */
export function GasIndicators({ gases, size = 'md', showLabels = false }: GasIndicatorsProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] min-w-[32px]',
    md: 'px-2 py-1 text-[10px] min-w-[36px]',
  };

  // Don't render anything if no gases
  if (gases.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {gases.map((gasType) => {
        const config = GAS_CONFIG[gasType];

        return (
          <div
            key={gasType}
            className={cn(
              'rounded flex items-center justify-center transition-all font-semibold',
              sizeClasses[size],
              config.bgColor,
              config.textColor
            )}
            title={`${config.label} valve present`}
          >
            {config.shortLabel}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact version showing just colored dots
 */
export function GasIndicatorsDots({ gases, size = 'sm' }: { gases: GasType[]; size?: 'sm' | 'md' }) {
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
  };

  // Don't render anything if no gases
  if (gases.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5">
      {gases.map((gasType) => {
        const config = GAS_CONFIG[gasType];

        return (
          <div
            key={gasType}
            className={cn(
              'rounded-full',
              dotSizes[size],
              config.bgColor
            )}
            title={`${config.label} valve present`}
          />
        );
      })}
    </div>
  );
}
