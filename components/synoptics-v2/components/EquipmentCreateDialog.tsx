'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { GasTypeBadge } from './GasTypeBadge';
import type { GasType } from '@/components/synoptics/hierarchy/gas-indicators';

interface EquipmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  organizationId: string;
  hierarchyData: any;
  onSuccess: () => void;
}

const GAS_OPTIONS: { value: GasType; label: string }[] = [
  { value: 'oxygen', label: 'O₂' },
  { value: 'medical_air', label: 'Air' },
  { value: 'nitrous_oxide', label: 'N₂O' },
  { value: 'carbon_dioxide', label: 'CO₂' },
  { value: 'nitrogen', label: 'N₂' },
  { value: 'vacuum', label: 'Vac' },
];

export function EquipmentCreateDialog({ 
  open, 
  onOpenChange, 
  siteId,
  organizationId,
  hierarchyData,
  onSuccess 
}: EquipmentCreateDialogProps) {
  const [equipmentType, setEquipmentType] = useState<'valve' | 'source' | 'fitting'>('valve');
  const [name, setName] = useState('');
  const [gasType, setGasType] = useState<GasType>('oxygen');
  const [buildingId, setBuildingId] = useState<string>('');
  const [floorId, setFloorId] = useState<string>('');
  const [zoneId, setZoneId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBuilding = hierarchyData?.buildings?.find((b: any) => b.id === buildingId);
  const floors = selectedBuilding?.floors || [];
  const selectedFloor = floors.find((f: any) => f.id === floorId);
  const zones = selectedFloor?.zones || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create element (valve, source, or fitting)
      let elementEndpoint = '';
      let elementData: any = {
        organizationId,
        name: name.trim(),
      };

      if (equipmentType === 'valve') {
        elementEndpoint = '/api/synoptics/valves';
        elementData.valveType = 'isolation';
        elementData.gasType = gasType;
        elementData.state = 'closed';
      } else if (equipmentType === 'source') {
        elementEndpoint = '/api/synoptics/sources';
        elementData.gasType = gasType;
      } else if (equipmentType === 'fitting') {
        elementEndpoint = '/api/synoptics/fittings';
        elementData.fittingType = 'tee';
        elementData.gasType = gasType;
      }

      const elementResponse = await fetch(elementEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elementData),
      });

      if (!elementResponse.ok) {
        throw new Error('Failed to create equipment element');
      }

      const element = await elementResponse.json();

      // Step 2: Create node
      const nodeData: any = {
        organizationId,
        nodeType: equipmentType,
        elementId: element.id,
      };
      
      // Add location only if provided
      if (buildingId) nodeData.buildingId = buildingId;
      if (floorId) nodeData.floorId = floorId;
      if (zoneId) nodeData.zoneId = zoneId;

      const nodeResponse = await fetch('/api/synoptics/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData),
      });

      if (!nodeResponse.ok) {
        throw new Error('Failed to create node');
      }

      // Reset form
      setName('');
      setGasType('oxygen');
      setBuildingId('');
      setFloorId('');
      setZoneId('');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Equipment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="type">Equipment Type</Label>
              <Select value={equipmentType} onValueChange={(v: any) => setEquipmentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valve">Valve</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="fitting">Fitting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Equipment name"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label>Gas Type</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {GAS_OPTIONS.map((gas) => (
                  <button
                    key={gas.value}
                    type="button"
                    onClick={() => setGasType(gas.value)}
                    className={`transition-all rounded ${
                      gasType === gas.value ? 'ring-2 ring-blue-500 ring-offset-1' : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <GasTypeBadge gasType={gas.value} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Location (Optional)</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <Label htmlFor="building" className="text-xs">Building</Label>
                <Select value={buildingId || undefined} onValueChange={(value) => {
                  setBuildingId(value);
                  setFloorId('');
                  setZoneId('');
                }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyData?.buildings?.map((building: any) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="floor" className="text-xs">Floor</Label>
                <Select 
                  value={floorId || undefined} 
                  onValueChange={(value) => {
                    setFloorId(value);
                    setZoneId('');
                  }}
                  disabled={!buildingId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor: any) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="zone" className="text-xs">Zone</Label>
                <Select 
                  value={zoneId || undefined} 
                  onValueChange={setZoneId}
                  disabled={!floorId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone: any) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Equipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
