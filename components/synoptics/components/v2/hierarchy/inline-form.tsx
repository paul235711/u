'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, Building2, Layers, Box } from 'lucide-react';

type FormType = 'building' | 'floor' | 'zone';

interface InlineFormProps {
  type: FormType;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FORM_CONFIG = {
  building: {
    icon: Building2,
    title: 'New Building',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
  },
  floor: {
    icon: Layers,
    title: 'New Floor',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
  },
  zone: {
    icon: Box,
    title: 'New Zone',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
  },
};

/**
 * Reusable inline form for creating buildings, floors, or zones
 */
export function InlineForm({ type, onSubmit, onCancel, isSubmitting }: InlineFormProps) {
  const config = FORM_CONFIG[type];
  const Icon = config.icon;

  const [buildingName, setBuildingName] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [floorName, setFloorName] = useState('');
  const [zoneName, setZoneName] = useState('');

  const handleSubmit = async () => {
    let data: any;
    
    if (type === 'building') {
      if (!buildingName.trim()) return;
      data = { name: buildingName };
    } else if (type === 'floor') {
      if (!floorNumber.trim()) return;
      data = { floorNumber: parseInt(floorNumber), name: floorName || null };
    } else {
      if (!zoneName.trim()) return;
      data = { name: zoneName };
    }

    await onSubmit(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className={`mb-3 rounded-lg p-3 border-2 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        <h3 className={`font-semibold text-sm ${config.textColor}`}>{config.title}</h3>
      </div>

      <div className="space-y-3">
        {type === 'building' && (
          <div>
            <Label htmlFor="building-name">Building Name</Label>
            <Input
              id="building-name"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g., Main Building, East Wing"
              className="mt-1"
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {type === 'floor' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="floor-number" className="text-xs">
                Floor Number *
              </Label>
              <Input
                id="floor-number"
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g., 1, 2, -1"
                className="mt-1"
                autoFocus
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <Label htmlFor="floor-name" className="text-xs">
                Name (optional)
              </Label>
              <Input
                id="floor-name"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g., ICU, ER"
                className="mt-1"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )}

        {type === 'zone' && (
          <div>
            <Label htmlFor="zone-name" className="text-xs">
              Zone Name
            </Label>
            <Input
              id="zone-name"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="e.g., ICU-203, OR-1"
              className="mt-1"
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Check className="mr-1 h-3 w-3" />
            )}
            Create
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
