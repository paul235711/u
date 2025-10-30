'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [equipmentType, setEquipmentType] = useState<'valve' | 'source' | 'fitting'>('valve');
  const [name, setName] = useState('');
  const [gasType, setGasType] = useState<GasType>('oxygen');
  const [buildingId, setBuildingId] = useState<string>('');
  const [floorId, setFloorId] = useState<string>('');
  const [zoneId, setZoneId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Quick create states
  const [isCreatingBuilding, setIsCreatingBuilding] = useState(false);
  const [isCreatingFloor, setIsCreatingFloor] = useState(false);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const selectedBuilding = hierarchyData?.buildings?.find((b: any) => b.id === buildingId);
  const floors = selectedBuilding?.floors || [];
  const selectedFloor = floors.find((f: any) => f.id === floorId);
  const zones = selectedFloor?.zones || [];

  const handleQuickCreate = async (type: 'building' | 'floor' | 'zone') => {
    if (!newItemName.trim()) return;
    
    try {
      let endpoint = '';
      let body: any = { name: newItemName.trim() };
      
      if (type === 'building') {
        endpoint = '/api/synoptics/buildings';
        body.siteId = siteId;
      } else if (type === 'floor' && buildingId) {
        endpoint = '/api/synoptics/floors';
        body.buildingId = buildingId;
        body.number = 0; // Default floor number
      } else if (type === 'zone' && floorId) {
        endpoint = '/api/synoptics/zones';
        body.floorId = floorId;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const created = await response.json();
      
      // Select the newly created item
      if (type === 'building') {
        setBuildingId(created.id);
        setIsCreatingBuilding(false);
      } else if (type === 'floor') {
        setFloorId(created.id);
        setIsCreatingFloor(false);
      } else if (type === 'zone') {
        setZoneId(created.id);
        setIsCreatingZone(false);
      }
      
      setNewItemName('');
      // Invalidate hierarchy to refresh the select options
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !buildingId) return;

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
        buildingId: buildingId || null,
        floorId: floorId || null,
        zoneId: zoneId || null,
      };

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
                    className={`transition-all ${
                      gasType === gas.value ? 'ring-2 ring-blue-500 ring-offset-2' : 'opacity-50'
                    }`}
                  >
                    <GasTypeBadge gasType={gas.value} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="building">Building *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setIsCreatingBuilding(!isCreatingBuilding)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {isCreatingBuilding ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="New building name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate('building')}
                  />
                  <Button type="button" size="sm" onClick={() => handleQuickCreate('building')}>
                    Add
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setIsCreatingBuilding(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyData?.buildings?.map((building: any) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {buildingId && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="floor">Floor (Optional)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setIsCreatingFloor(!isCreatingFloor)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {isCreatingFloor ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New floor name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate('floor')}
                    />
                    <Button type="button" size="sm" onClick={() => handleQuickCreate('floor')}>
                      Add
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsCreatingFloor(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select value={floorId} onValueChange={setFloorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {floors.map((floor: any) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {floorId && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="zone">Zone (Optional)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setIsCreatingZone(!isCreatingZone)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {isCreatingZone ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New zone name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate('zone')}
                    />
                    <Button type="button" size="sm" onClick={() => handleQuickCreate('zone')}>
                      Add
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsCreatingZone(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select value={zoneId} onValueChange={setZoneId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {zones.map((zone: any) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
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
            <Button type="submit" disabled={isSubmitting || !name.trim() || !buildingId}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Equipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
