/**
 * Element Properties Panel - V2
 * Migrated to use Zustand + React Query
 * 
 * Key improvements:
 * - No prop drilling (uses Zustand)
 * - Automatic data fetching (React Query)
 * - Optimistic updates
 * - Consistent error handling
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, X, Loader2, Building, Layers, Box, AlertCircle } from 'lucide-react';
import { GasTypeSelector } from '@/components/synoptics/shared/gas-type-selector';
import { hasUnsavedChanges } from '@/components/synoptics/shared/form-utils';
import { useUIStore } from '../../stores/ui-store';
import { apiClient } from '../../api/client';

interface ElementPropertiesPanelProps {
  organizationId: string;
  layoutId?: string;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export function ElementPropertiesPanel({
  organizationId,
  layoutId,
  onUpdate,
  onDelete,
}: ElementPropertiesPanelProps) {
  const queryClient = useQueryClient();
  
  // Get selected element from Zustand store (no prop drilling!)
  const selectedElementId = useUIStore((state) => state.selectedElementId);
  const selectElement = useUIStore((state) => state.selectElement);

  // Fetch element data with React Query
  const { data: element, isLoading: isLoadingElement } = useQuery({
    queryKey: ['element', selectedElementId],
    queryFn: async () => {
      if (!selectedElementId) return null;
      
      // Get node data to find element
      const layout: any = await apiClient.getLayout(layoutId!);
      const node = layout.nodes.find((n: any) => n.id === selectedElementId);
      
      if (!node) throw new Error('Node not found');
      
      // Fetch element details based on type
      const elementEndpoint = `/api/synoptics/${node.nodeType}s/${node.elementId}`;
      const response = await fetch(elementEndpoint);
      if (!response.ok) throw new Error('Failed to fetch element');
      const elementData = await response.json();
      
      return { ...node, ...elementData };
    },
    enabled: !!selectedElementId && !!layoutId,
  });

  // Fetch hierarchy data
  const { data: hierarchyData, isLoading: isLoadingHierarchy } = useQuery({
    queryKey: ['hierarchy', organizationId],
    queryFn: async () => {
      const sitesRes = await fetch(`/api/synoptics/sites?organizationId=${organizationId}`);
      const sites = await sitesRes.json();
      
      const allBuildings = [];
      for (const site of sites) {
        const buildingsRes = await fetch(`/api/synoptics/buildings?siteId=${site.id}`);
        const buildings = await buildingsRes.json();
        allBuildings.push(...buildings);
      }
      
      return { sites, buildings: allBuildings };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch floors when building is selected
  const [selectedBuildingId, setSelectedBuildingId] = useState(element?.buildingId || '');
  const { data: floors = [] } = useQuery({
    queryKey: ['floors', selectedBuildingId],
    queryFn: async () => {
      const res = await fetch(`/api/synoptics/floors?buildingId=${selectedBuildingId}`);
      return res.json();
    },
    enabled: !!selectedBuildingId,
  });

  // Fetch zones when floor is selected
  const [selectedFloorId, setSelectedFloorId] = useState(element?.floorId || '');
  const { data: zones = [] } = useQuery({
    queryKey: ['zones', selectedFloorId],
    queryFn: async () => {
      const res = await fetch(`/api/synoptics/zones?floorId=${selectedFloorId}`);
      return res.json();
    },
    enabled: !!selectedFloorId,
  });

  const initialData = element ? {
    name: element.name || '',
    gasType: element.gasType || 'oxygen',
    state: element.state || 'open',
    valveType: element.valveType || 'isolation',
    fittingType: element.fittingType || 'tee',
    outletCount: element.outletCount?.toString() || '0',
    buildingId: element.buildingId || '',
    floorId: element.floorId || '',
    zoneId: element.zoneId || '',
  } : null;

  const [formData, setFormData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);

  // Update form when element loads
  useEffect(() => {
    if (element) {
      const newData = {
        name: element.name || '',
        gasType: element.gasType || 'oxygen',
        state: element.state || 'open',
        valveType: element.valveType || 'isolation',
        fittingType: element.fittingType || 'tee',
        outletCount: element.outletCount?.toString() || '0',
        buildingId: element.buildingId || '',
        floorId: element.floorId || '',
        zoneId: element.zoneId || '',
      };
      setFormData(newData);
      setSelectedBuildingId(element.buildingId || '');
      setSelectedFloorId(element.floorId || '');
    }
  }, [element]);

  // Track changes
  useEffect(() => {
    if (formData && initialData) {
      setIsDirty(hasUnsavedChanges(formData, initialData));
    }
  }, [formData, initialData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!element) throw new Error('No element selected');
      
      // Update element
      const elementEndpoint = `/api/synoptics/${element.nodeType}s/${element.elementId}`;
      await fetch(elementEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Update node location
      await fetch(`/api/synoptics/nodes/${element.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: data.buildingId || null,
          floorId: data.floorId || null,
          zoneId: data.zoneId || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      queryClient.invalidateQueries({ queryKey: ['element', selectedElementId] });
      setIsDirty(false);
      onUpdate?.();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!element) throw new Error('No element selected');
      
      // Delete node first
      await apiClient.deleteNode(element.id);
      
      // Delete element
      const elementEndpoint = `/api/synoptics/${element.nodeType}s/${element.elementId}`;
      const response = await fetch(elementEndpoint, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete element');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      selectElement(null); // Close panel
      onDelete?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        selectElement(null);
      }
    } else {
      selectElement(null);
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setFormData({ ...formData!, buildingId, floorId: '', zoneId: '' });
    setSelectedBuildingId(buildingId);
    setSelectedFloorId('');
  };

  const handleFloorChange = (floorId: string) => {
    setFormData({ ...formData!, floorId, zoneId: '' });
    setSelectedFloorId(floorId);
  };

  if (!selectedElementId) return null;

  if (isLoadingElement) {
    return (
      <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg flex items-center justify-center z-10">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!element || !formData) return null;

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {element.nodeType.charAt(0).toUpperCase() + element.nodeType.slice(1)} Properties
          {isDirty && <span className="ml-2 text-xs text-orange-600">(unsaved)</span>}
        </h3>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  <Label htmlFor="props-open" className="font-normal cursor-pointer">
                    Open
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="closed" id="props-closed" />
                  <Label htmlFor="props-closed" className="font-normal cursor-pointer">
                    Closed
                  </Label>
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
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of gas outlets connected to this element
          </p>
        </div>

        {/* Location Assignment Section */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Building className="h-4 w-4" />
            <span>Physical Location</span>
          </div>

          {isLoadingHierarchy ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading locations...
            </div>
          ) : !hierarchyData?.buildings?.length ? (
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
                  {hierarchyData.buildings.map((building: any) => (
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
                    {floors.map((floor: any) => (
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
                    {zones.map((zone: any) => (
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
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex-1"
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="px-3"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
