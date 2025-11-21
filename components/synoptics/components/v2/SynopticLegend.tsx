'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Cylinder } from 'lucide-react';
import ValveIcon from '../../icons/ValveIcon';
import { getGasConfig, getGasLineColor } from './hierarchy/gas-config';

interface SynopticLegendProps {
  gasTypes: Set<string>;
  hasSource: boolean;
  hasValve: boolean;
  hasFitting: boolean;
}

export function SynopticLegend({ gasTypes, hasSource, hasValve, hasFitting }: SynopticLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-xl border-1 border-gray-300 overflow-hidden min-w-[120px]">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-100"
        >
          <span className="text-sm font-semibold text-gray-800">Legend</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </Button>

        {/* Legend Content */}
        {isExpanded && (
          <div className="p-3 space-y-3 border-t border-gray-200">
            {/* Gas Types */}
            {gasTypes.size > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Gases</div>
                <div className="space-y-1.5">
                  {Array.from(gasTypes).map((gasType) => {
                    const color = getGasLineColor(gasType);
                    const config = getGasConfig(gasType);
                    const label = config.label;
                    return (
                      <div key={gasType} className="flex items-center gap-2">
                        <div
                          className="w-8 h-0.5 rounded"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-gray-700">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Node Types */}
            {(hasSource || hasValve || hasFitting) && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Equipment</div>
                <div className="space-y-1.5">
                  {hasSource && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                        <Cylinder className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-gray-700">Source</span>
                    </div>
                  )}
                  {hasValve && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-red-500 bg-red-100 flex items-center justify-center">
                        <ValveIcon className="w-3 h-3 text-red-700" />
                      </div>
                      <span className="text-xs text-gray-700">Valve</span>
                    </div>
                  )}
                  {hasFitting && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-100" />
                      <span className="text-xs text-gray-700">Fitting</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
