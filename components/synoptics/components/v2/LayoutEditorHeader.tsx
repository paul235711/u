/**
 * Header component for the layout editor
 * Demonstrates Zustand state management
 */

'use client';

import { Button } from '@/components/ui/button';
import { Lock, Unlock, Eye, EyeOff, Keyboard, Maximize2, Minimize2, Scissors } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';

interface LayoutEditorHeaderProps {
  layoutName?: string;
}

export function LayoutEditorHeader({ layoutName }: LayoutEditorHeaderProps = {}) {
  const isLocked = useUIStore((state) => state.isLocked);
  const isFullscreen = useUIStore((state) => state.isFullscreen);
  const edgeToolMode = useUIStore((state) => state.edgeToolMode);
  const toggleLock = useUIStore((state) => state.toggleLock);
  const toggleFullscreen = useUIStore((state) => state.toggleFullscreen);
  const toggleEdgeToolMode = useUIStore((state) => state.toggleEdgeToolMode);
  
  const showStats = useUIStore((state) => state.panels.stats);
  const showFilters = useUIStore((state) => state.panels.filters);
  const showLegend = useUIStore((state) => state.panels.legend);
  const togglePanel = useUIStore((state) => state.togglePanel);

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            {layoutName || 'Layout Editor V2'}
            {isLocked ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : (
              <Unlock className="h-4 w-4 text-blue-600" />
            )}
          </h1>
          <p className="text-xs text-gray-500">
            {isLocked ? 'View Mode • Click unlock to edit' : 'Edit Mode • Auto-save enabled'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Cut Connection Tool */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEdgeToolMode}
            disabled={isLocked}
            aria-pressed={edgeToolMode === 'cut'}
            className={`${
              edgeToolMode === 'cut' ? 'bg-red-50 border-red-300 text-red-600' : ''
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isLocked ? 'Unlock to cut connections' : 'Toggle cut connections tool'}
          >
            <Scissors className="mr-2 h-4 w-4" />
            Cut tool
          </Button>

          {/* Lock Toggle */}
          <Button
            variant={isLocked ? 'outline' : 'default'}
            size="sm"
            onClick={toggleLock}
            className={!isLocked ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {isLocked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock to Edit
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock View
              </>
            )}
          </Button>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePanel('filters')}
            className={showFilters ? 'bg-blue-50' : ''}
          >
            {showFilters ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Filters
          </Button>

          {/* Stats Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePanel('stats')}
            className={showStats ? 'bg-blue-50' : ''}
          >
            {showStats ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Stats
          </Button>

          {/* Legend Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePanel('legend')}
            className={showLegend ? 'bg-blue-50' : ''}
          >
            Legend
          </Button>

          {/* Shortcuts */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePanel('shortcuts')}
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
