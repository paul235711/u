'use client';

import { cn } from '@/lib/utils';
import type { GasType } from '@/components/synoptics/hierarchy/gas-indicators';

interface AllGasIndicatorsProps {
  activeGases: GasType[];
  allSiteGases: GasType[];
  size?: 'sm' | 'md';
}

// Fixed order for all gas types
const GAS_ORDER: GasType[] = ['oxygen', 'medical_air', 'nitrous_oxide', 'carbon_dioxide', 'nitrogen', 'vacuum'];

const GAS_COLORS: Record<GasType, string> = {
  oxygen: 'bg-red-500',
  medical_air: 'bg-yellow-500',
  nitrous_oxide: 'bg-blue-500',
  carbon_dioxide: 'bg-green-500',
  nitrogen: 'bg-gray-500',
  vacuum: 'bg-purple-500',
};

const GAS_LABELS: Record<GasType, string> = {
  oxygen: 'O₂',
  medical_air: 'Air',
  nitrous_oxide: 'N₂O',
  carbon_dioxide: 'CO₂',
  nitrogen: 'N₂',
  vacuum: 'Vac',
};

/**
 * Display all gas types in fixed order
 * Active gases are colored, inactive but present on site are grayed
 */
export function AllGasIndicators({ activeGases, allSiteGases, size = 'md' }: AllGasIndicatorsProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] min-w-[28px]',
    md: 'px-2 py-1 text-xs min-w-[32px]',
  };

  return (
    <div className="inline-flex items-center gap-1">
      {GAS_ORDER.map((gasType) => {
        const isActive = activeGases.includes(gasType);
        const isPresentOnSite = allSiteGases.includes(gasType);
        
        // Only show if active or present on site
        if (!isActive && !isPresentOnSite) {
          return null;
        }

        return (
          <div
            key={gasType}
            className={cn(
              'inline-flex items-center justify-center rounded font-medium text-white',
              sizeClasses[size],
              isActive ? GAS_COLORS[gasType] : 'bg-gray-300 text-gray-500'
            )}
            title={`${gasType}${isActive ? ' (active here)' : ' (used elsewhere on site)'}`}
          >
            {GAS_LABELS[gasType]}
          </div>
        );
      })}
    </div>
  );
}
