"use client";

import { cn } from '@/lib/utils';
import type { GasType } from './hierarchy/gas-indicators';
import { getGasConfig } from './hierarchy/gas-config';

interface AllGasIndicatorsProps {
  activeGases: GasType[];
  allSiteGases: GasType[];
  size?: 'sm' | 'md';
}

// Fixed order for all gas types
const GAS_ORDER: GasType[] = ['oxygen', 'medical_air', 'nitrous_oxide', 'carbon_dioxide', 'nitrogen', 'vacuum'];

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
              isActive
                ? `${getGasConfig(gasType).bgColor} ${getGasConfig(gasType).textColor}`
                : 'bg-gray-300 text-gray-500'
            )}
            title={`${gasType}${isActive ? ' (active here)' : ' (used elsewhere on site)'}`}
          >
            {getGasConfig(gasType).shortLabel}
          </div>
        );
      })}
    </div>
  );
}
