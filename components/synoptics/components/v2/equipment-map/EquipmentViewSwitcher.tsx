'use client';

import { Map, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'map' | 'grid' | 'list';

interface EquipmentViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
  withCoordsCount: number;
}

export function EquipmentViewSwitcher({
  viewMode,
  onViewModeChange,
  totalCount,
  withCoordsCount,
}: EquipmentViewSwitcherProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Equipment Overview</h2>
        <p className="text-sm text-gray-500">
          {totalCount} equipment items · {withCoordsCount} with coordinates
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
        <Button
          variant={viewMode === 'map' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('map')}
          className="gap-1.5"
        >
          <Map className="h-4 w-4" />
          Map
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
          className="gap-1.5"
        >
          <Grid3x3 className="h-4 w-4" />
          Grid
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="gap-1.5"
        >
          <List className="h-4 w-4" />
          List
        </Button>
      </div>
    </div>
  );
}
