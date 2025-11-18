'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GasType } from './hierarchy/gas-indicators';
import { useI18n } from '@/app/i18n-provider';

interface QuickValveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationType: 'building' | 'floor' | 'zone';
  siteId: string;
  onSuccess: () => void;
}

// Gas types configuration
const GAS_OPTIONS: { value: GasType; label: string; color: string }[] = [
  { value: 'oxygen', label: 'O₂', color: 'bg-red-500' },
  { value: 'medical_air', label: 'Air', color: 'bg-yellow-500' },
  { value: 'nitrous_oxide', label: 'N₂O', color: 'bg-blue-500' },
  { value: 'carbon_dioxide', label: 'CO₂', color: 'bg-green-500' },
  { value: 'nitrogen', label: 'N₂', color: 'bg-gray-500' },
  { value: 'vacuum', label: 'Vac', color: 'bg-purple-500' },
];

/**
 * Quick dialog to create a valve with gas type selection
 */
export function QuickValveDialog({ 
  open, 
  onOpenChange, 
  locationId,
  locationType,
  siteId,
  onSuccess 
}: QuickValveDialogProps) {
  const [name, setName] = useState('');
  const [selectedGas, setSelectedGas] = useState<GasType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGas) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the valve element
      const valveResponse = await fetch('/api/synoptics/valves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          name: name.trim(),
          valveType: 'isolation', // Default valve type
          gasType: selectedGas,
          state: 'closed', // Default state
        }),
      });

      if (!valveResponse.ok) {
        const errorData = await valveResponse.json();
        throw new Error(errorData.error || 'Failed to create valve element');
      }

      const valve = await valveResponse.json();

      // Step 2: Create the node linking the valve to the location
      const nodeData: any = {
        siteId,
        nodeType: 'valve',
        elementId: valve.id,
      };

      // Add location-specific fields
      if (locationType === 'building') {
        nodeData.buildingId = locationId;
      } else if (locationType === 'floor') {
        nodeData.floorId = locationId;
      } else if (locationType === 'zone') {
        nodeData.zoneId = locationId;
      }

      const nodeResponse = await fetch('/api/synoptics/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData),
      });

      if (!nodeResponse.ok) {
        throw new Error('Failed to create node');
      }

      setName('');
      setSelectedGas(null);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('synoptics.quickValve.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valve-name">{t('synoptics.quickValve.nameLabel')}</Label>
              <Input
                id="valve-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main O2 Valve"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>Gas Type</Label>
              <div className="flex flex-wrap gap-2">
                {GAS_OPTIONS.map((gas) => (
                  <button
                    key={gas.value}
                    type="button"
                    onClick={() => setSelectedGas(gas.value)}
                    className={cn(
                      'inline-flex items-center justify-center rounded px-3 py-2 text-xs font-medium text-white transition-all min-w-[48px]',
                      selectedGas === gas.value
                        ? `${gas.color} ring-2 ring-offset-2 ring-blue-500`
                        : `${gas.color} opacity-50 hover:opacity-100`
                    )}
                    disabled={isSubmitting}
                  >
                    {gas.label}
                  </button>
                ))}
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !selectedGas}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('synoptics.quickValve.submit')}
                </>
              ) : (
                t('synoptics.quickValve.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
