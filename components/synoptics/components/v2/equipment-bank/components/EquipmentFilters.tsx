'use client';

import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Zap, Box } from 'lucide-react';
import ValveIcon from '../../../../icons/ValveIcon';
import { EquipmentNodeType } from '../types';

interface EquipmentFiltersProps {
  searchTerm: string;
  selectedType: 'all' | EquipmentNodeType;
  onSearchChange: (value: string) => void;
  onTypeChange: (type: 'all' | EquipmentNodeType) => void;
}

export function EquipmentFilters({ searchTerm, selectedType, onSearchChange, onTypeChange }: EquipmentFiltersProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="p-3 space-y-2 border-b">
      <div className="relative">
        <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-7 h-8 text-sm"
        />
      </div>

      <div className="flex gap-1">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('all')}
          className="flex-1 h-7 text-xs"
        >
          Tous
        </Button>
        <Button
          variant={selectedType === 'valve' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('valve')}
          className="h-7 px-2"
        >
          <ValveIcon className="h-3 w-3" />
        </Button>
        <Button
          variant={selectedType === 'source' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('source')}
          className="h-7 px-2"
        >
          <Zap className="h-3 w-3" />
        </Button>
        <Button
          variant={selectedType === 'fitting' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('fitting')}
          className="h-7 px-2"
        >
          <Box className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
