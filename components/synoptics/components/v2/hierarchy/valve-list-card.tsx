'use client';

import { Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getGasConfig } from './gas-config';
import type { ValveInfo, LocationType } from './types';

interface ValveListCardProps {
  valves: ValveInfo[];
  locationType: LocationType;
  isLoading: boolean;
  isEditMode?: boolean;
  onEditValve?: (valve: ValveInfo) => void;
  onValveClick?: (valve: ValveInfo) => void;
}

const CARD_STYLES = {
  building: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    titleColor: 'text-green-900',
    iconColor: 'text-green-600',
    itemBorder: 'border-green-200',
  },
  floor: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    titleColor: 'text-green-900',
    iconColor: 'text-green-600',
    itemBorder: 'border-green-200',
  },
  zone: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    titleColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    itemBorder: 'border-purple-200',
  },
};

const TITLES = {
  building: 'Isolation Valves',
  floor: 'Floor Isolation Valves',
  zone: 'Zone Valves',
};

/**
 * Card displaying list of valves for a location
 */
export function ValveListCard({ valves, locationType, isLoading, isEditMode = false, onEditValve, onValveClick }: ValveListCardProps) {
  const styles = CARD_STYLES[locationType];
  const title = TITLES[locationType];
  const hasValves = valves.length > 0;

  return (
    <div className={cn('rounded-lg p-3 border mb-3', styles.bg, styles.border)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('text-sm font-semibold', styles.iconColor)}>▶◀</span>
        <h4 className={cn('font-semibold text-sm', styles.titleColor)}>{title}</h4>
        {isLoading && <Loader2 className={cn('h-3 w-3 animate-spin', styles.iconColor)} />}
      </div>

      {hasValves ? (
        <div className="space-y-2">
          {valves.map((valve) => {
            const gas = getGasConfig(valve.gasType);

            return (
              <div
                key={valve.id}
                className={cn(
                  'flex items-center justify-between p-3 bg-white rounded-md border hover:bg-gray-50 transition-colors',
                  styles.itemBorder,
                  onValveClick ? 'cursor-pointer' : ''
                )}
                onClick={() => onValveClick?.(valve)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {/* Gas Badge */}
                  <div className={cn('px-2 py-1 rounded font-bold text-xs min-w-[40px] text-center', gas.bgColor, gas.textColor)}>
                    {gas.shortLabel}
                  </div>
                  
                  {/* Valve Info */}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{valve.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {valve.valveType}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      valve.state === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {valve.state}
                  </span>
                  {isEditMode && onEditValve && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditValve(valve)}
                      className="h-7 w-7 p-0 hover:bg-gray-100"
                      title="Edit valve"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={cn('text-sm', styles.titleColor)}>
          No valves yet. {locationType === 'building' && 'Click the scissors icon to create one.'}
        </p>
      )}
    </div>
  );
}
