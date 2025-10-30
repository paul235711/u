'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, X, Loader2, Building, Layers, Box, AlertCircle } from 'lucide-react';
import { GasTypeSelector } from './shared/gas-type-selector';
import { hasUnsavedChanges } from './shared/form-utils';

interface SiteData {
  id: string;
  name: string;
}

interface BuildingData {
  id: string;
  name: string;
  siteId: string;
}

interface FloorData {
  id: string;
  name: string;
  floorNumber: number;
  buildingId: string;
}

interface ZoneData {
  id: string;
  name: string;
  floorId: string;
}

interface ElementPropertiesPanelProps {
  element: any;
  organizationId: string;
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}

export function ElementPropertiesPanel({
  element,
  organizationId,
  onClose,
  onUpdate,
  onDelete,
}: ElementPropertiesPanelProps) {
  const initialData = {
    name: element.name || element.label || '',
    gasType: element.gasType || 'oxygen',
    state: element.state || 'open',
    valveType: element.valveType || 'isolation',
    fittingType: element.fittingType || 'tee',
    outletCount: element.outletCount?.toString() || '0',
    buildingId: element.buildingId || '',
    floorId: element.floorId || '',
    zoneId: element.zoneId || '',
  };

  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);

  // Load hierarchy data
  useEffect(() => {
    async function loadHierarchy() {
      try {
        setLoadingHierarchy(true);
        const sitesRes = await fetch(`/api/synoptics/sites?organizationId=${organizationId}`);
        const sitesData = await sitesRes.json();
        setSites(sitesData);
        
        // Load all buildings for all sites
        const allBuildings: BuildingData[] = [];
        for (const site of sitesData) {
          const buildingsRes = await fetch(`/api/synoptics/buildings?siteId=${site.id}`);
          const buildingsData: BuildingData[] = await buildingsRes.json();
          allBuildings.push(...buildingsData);
        }
        setBuildings(allBuildings);
        
        // If element has a floorId but no buildingId, infer buildingId from floor
        if (element.floorId && !element.buildingId) {
          try {
            const floorRes = await fetch(`/api/synoptics/floors/${element.floorId}`);
            const floorData: FloorData = await floorRes.json();
            if (floorData.buildingId) {
              // Update formData with inferred buildingId
              setFormData(prev => ({ ...prev, buildingId: floorData.buildingId }));
            }
          } catch (error) {
            console.error('Failed to load floor for buildingId inference:', error);
          }
        }
        
        // If element has a buildingId, load its floors
        if (element.buildingId) {
          const floorsRes = await fetch(`/api/synoptics/floors?buildingId=${element.buildingId}`);
          const floorsData: FloorData[] = await floorsRes.json();
          setFloors(floorsData);
        }
        
        // If element has a floorId, load its zones
        if (element.floorId) {
          const zonesRes = await fetch(`/api/synoptics/zones?floorId=${element.floorId}`);
          const zonesData: ZoneData[] = await zonesRes.json();
          setZones(zonesData);
        }
      } catch (error) {
        console.error('Failed to load hierarchy:', error);
      } finally {
        setLoadingHierarchy(false);
      }
    }
    loadHierarchy();
  }, [organizationId, element.buildingId, element.floorId]);

  // Track unsaved changes
  useEffect(() => {
    setIsDirty(hasUnsavedChanges(formData, initialData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Update element data
      await onUpdate(formData);
      
      // Update node location data
      await fetch(`/api/synoptics/nodes/${element.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: formData.buildingId || null,
          floorId: formData.floorId || null,
          zoneId: formData.zoneId || null,
        }),
      });
      
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to update element:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBuildingChange = async (buildingId: string) => {
    setFormData({ ...formData, buildingId, floorId: '', zoneId: '' });
    
    if (buildingId) {
      try {
        const floorsRes = await fetch(`/api/synoptics/floors?buildingId=${buildingId}`);
        const floorsData: FloorData[] = await floorsRes.json();
        setFloors(floorsData);
        setZones([]);
      } catch (error) {
        console.error('Failed to load floors:', error);
      }
    } else {
      setFloors([]);
      setZones([]);
    }
  };

  const handleFloorChange = async (floorId: string) => {
    setFormData({ ...formData, floorId, zoneId: '' });
    
    if (floorId) {
      try {
        const zonesRes = await fetch(`/api/synoptics/zones?floorId=${floorId}`);
        const zonesData: ZoneData[] = await zonesRes.json();
        setZones(zonesData);
      } catch (error) {
        console.error('Failed to load zones:', error);
      }
    } else {
      setZones([]);
    }
  };

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10" role="complementary" aria-label="Element properties">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {element.nodeType.charAt(0).toUpperCase() + element.nodeType.slice(1)} Properties
          {isDirty && <span className="ml-2 text-xs text-orange-600">(unsaved)</span>}
        </h3>
        <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close properties panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={`e.g., Main ${element.nodeType} O2`}
            className="mt-1"
          />
        </div>

        <GasTypeSelector
          value={formData.gasType}
          onChange={(value) => setFormData({ ...formData, gasType: value })}
          idPrefix="props"
          showSymbol={false}
        />

        {element.nodeType === 'valve' && (
          <>
            <div>
              <Label htmlFor="valveType">Valve Type</Label>
              <select
                id="valveType"
                value={formData.valveType}
                onChange={(e) => setFormData({ ...formData, valveType: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="isolation">Isolation</option>
                <option value="zone">Zone</option>
                <option value="area">Area</option>
                <option value="shutoff">Shutoff</option>
                <option value="regulator">Regulator</option>
              </select>
            </div>

            <div>
              <Label>State</Label>
              <RadioGroup
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
                className="mt-2 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="props-open" />
                  <Label htmlFor="props-open" className="font-normal cursor-pointer">Open</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="closed" id="props-closed" />
                  <Label htmlFor="props-closed" className="font-normal cursor-pointer">Closed</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        )}

        {element.nodeType === 'fitting' && (
          <div>
            <Label htmlFor="fittingType">Fitting Type</Label>
            <select
              id="fittingType"
              value={formData.fittingType}
              onChange={(e) => setFormData({ ...formData, fittingType: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="tee">Tee</option>
              <option value="elbow">Elbow</option>
              <option value="cross">Cross</option>
              <option value="reducer">Reducer</option>
              <option value="outlet">Outlet</option>
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="outletCount">Outlet Count</Label>
          <Input
            id="outletCount"
            type="number"
            min="0"
            max="100"
            value={formData.outletCount}
            onChange={(e) => setFormData({ ...formData, outletCount: e.target.value })}
            className="mt-1"
            aria-describedby="outletCount-help"
          />
          <p id="outletCount-help" className="text-xs text-gray-500 mt-1">
            Number of gas outlets connected to this element
          </p>
        </div>

        {/* Location Assignment Section */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Building className="h-4 w-4" />
            <span>Physical Location</span>
          </div>
          
          {loadingHierarchy ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading locations...
            </div>
          ) : buildings.length === 0 && !formData.buildingId && !formData.floorId && !formData.zoneId ? (
            <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900">No locations available</div>
                <div className="text-xs text-yellow-700 mt-1">
                  Create sites and buildings first to assign locations.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="buildingId" className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  Building
                </Label>
                <select
                  id="buildingId"
                  value={formData.buildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Unassigned / External</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.buildingId && (
                <div>
                  <Label htmlFor="floorId" className="flex items-center gap-2">
                    <Layers className="h-3 w-3" />
                    Floor
                  </Label>
                  <select
                    id="floorId"
                    value={formData.floorId}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled={floors.length === 0}
                  >
                    <option value="">Unassigned</option>
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.name || `Floor ${floor.floorNumber}`}
                      </option>
                    ))}
                  </select>
                  {floors.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No floors available for this building
                    </p>
                  )}
                </div>
              )}

              {formData.floorId && (
                <div>
                  <Label htmlFor="zoneId" className="flex items-center gap-2">
                    <Box className="h-3 w-3" />
                    Zone
                  </Label>
                  <select
                    id="zoneId"
                    value={formData.zoneId}
                    onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled={zones.length === 0}
                  >
                    <option value="">Unassigned</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  {zones.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No zones available for this floor
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting || !isDirty} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="px-3"
            aria-label="Delete element"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
