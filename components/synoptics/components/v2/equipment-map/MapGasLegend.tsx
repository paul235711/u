'use client';

import { useState } from 'react';
import { GAS_LINE_COLORS, GAS_CONFIG } from '../hierarchy/gas-config';
import { Button } from '@/components/ui/button';
import { Cylinder, ChevronDown } from 'lucide-react';
import ValveIcon from '../../../icons/ValveIcon';

interface MapGasLegendProps {
  selectedGasTypes: string[];
  onGasTypeToggle: (gasType: string) => void;
  availableGasTypes: string[];
  selectedTypes: string[];
  onTypeToggle: (type: 'source' | 'valve' | 'fitting') => void;
  hasSource: boolean;
  hasValve: boolean;
  hasFitting: boolean;
}

export function MapGasLegend({
  selectedGasTypes,
  onGasTypeToggle,
  availableGasTypes,
  selectedTypes,
  onTypeToggle,
  hasSource,
  hasValve,
  hasFitting,
}: MapGasLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const gasTypes = Object.entries(GAS_CONFIG).filter(([key]) =>
    availableGasTypes.length === 0 ? true : availableGasTypes.includes(key)
  ).map(([key, config]) => {
    const color = GAS_LINE_COLORS[key] ?? GAS_LINE_COLORS.default;
    const label = config.shortLabel
      ? `${config.label} (${config.shortLabel})`
      : config.label;

    return { key, color, label };
  });

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-md rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 text-[11px] text-gray-700">
        <div className="font-semibold text-gray-700">Gas &amp; Legend</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-gray-100"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? 'Show gas and legend filters' : 'Hide gas and legend filters'}
        >
          <ChevronDown
            className={`h-3 w-3 text-gray-700 transition-transform ${
              isCollapsed ? '' : 'rotate-180'
            }`}
          />
        </Button>
      </div>

      {!isCollapsed && (
        <div className="mt-2 flex flex-col gap-2 text-[11px] text-gray-700">
        {gasTypes.length > 0 && (
          <div className="flex flex-1 flex-col gap-1">
            <div className="font-semibold text-gray-700">Gas</div>
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1">
              <div className="inline-flex gap-1">
                {gasTypes.map(({ key, color }) => {
                  const isActive = selectedGasTypes.includes(key);
                  return (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      className="h-6 px-2 text-[11px] leading-none"
                      onClick={() => onGasTypeToggle(key)}
                    >
                      <span
                        className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-white"
                        style={{ backgroundColor: color }}
                      />
                      {key}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(hasSource || hasValve || hasFitting) && (
          <div className="flex min-w-[120px] flex-col gap-1 border-t border-gray-100 pt-2">
            <div className="font-semibold text-gray-700">Legend</div>
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-1">
              <div className="inline-flex gap-2">
                {hasSource && (
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedTypes.includes('source') ? 'default' : 'outline'}
                    className="flex h-7 items-center gap-1.5 px-2 text-[11px] leading-none"
                    onClick={() => onTypeToggle('source')}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 bg-white">
                      <Cylinder className="h-3 w-3 text-gray-900" />
                    </div>
                    <span>Source</span>
                  </Button>
                )}
                {hasValve && (
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedTypes.includes('valve') ? 'default' : 'outline'}
                    className="flex h-7 items-center gap-1.5 px-2 text-[11px] leading-none"
                    onClick={() => onTypeToggle('valve')}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 bg-white">
                      <ValveIcon className="h-3 w-3 text-gray-900" />
                    </div>
                    <span>Valve</span>
                  </Button>
                )}
                {hasFitting && (
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedTypes.includes('fitting') ? 'default' : 'outline'}
                    className="flex h-7 items-center gap-1.5 px-2 text-[11px] leading-none"
                    onClick={() => onTypeToggle('fitting')}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-gray-700 bg-white">
                      <div className="h-3 w-3 rotate-45 rounded-[2px] border-2 border-gray-900" />
                    </div>
                    <span>Fitting</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
