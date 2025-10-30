'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Building2, Plus, Layers, Box, ChevronDown, ChevronRight, 
  Check, X, Loader2, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import modular components
import { useValveData } from './hierarchy/use-valve-data';
import { ValveBadge } from './hierarchy/valve-badge';
import { InlineForm } from './hierarchy/inline-form';
import { ValveCreationDialog } from './hierarchy/valve-creation-dialog';
import { ValveEditDialog } from './hierarchy/valve-edit-dialog';
import { GasIndicators } from './hierarchy/gas-indicators';
import { ValveViewerDialog } from './hierarchy/valve-viewer-dialog';
import { GAS_CONFIG } from './hierarchy/gas-config';
import type { SiteData, ValveDialogState, LocationType, ValveInfo } from './hierarchy/types';
import type { GasType } from './hierarchy/gas-indicators';

interface SiteHierarchyManagerProps {
  siteData: SiteData;
  siteId: string;
}

/**
 * Main site hierarchy manager component
 * Manages buildings, floors, zones, and their isolation valves
 */
export function SiteHierarchyManagerV2({ siteData, siteId }: SiteHierarchyManagerProps) {
  const router = useRouter();
  
  // UI State
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form State
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [addingFloorTo, setAddingFloorTo] = useState<string | null>(null);
  const [addingZoneTo, setAddingZoneTo] = useState<string | null>(null);
  
  // Valve Dialog State
  const [valveDialog, setValveDialog] = useState<ValveDialogState>({
    open: false,
    type: null,
    targetId: null,
    targetName: null,
  });
  
  // Edit Valve Dialog State
  const [editValveDialog, setEditValveDialog] = useState<{
    open: boolean;
    valve: ValveInfo | null;
  }>({
    open: false,
    valve: null,
  });

  // Valve Viewer Dialog State
  const [valveViewerDialog, setValveViewerDialog] = useState<{
    open: boolean;
    locationType: LocationType | null;
    locationId: string | null;
    locationName: string;
    valves: ValveInfo[] | null;
  }>({
    open: false,
    locationType: null,
    locationId: null,
    locationName: '',
    valves: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom hook for valve data
  const { locationValves, valveCounts, locationGases, loadingValves, isLoadingCounts, loadValvesForLocation, refreshValveCounts } = useValveData(
    siteData.organizationId
  );

  // Toggle functions
  const toggleBuilding = (id: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFloor = (id: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Handle valve badge click - open viewer dialog
  const handleValveBadgeClick = async (
    locationId: string,
    locationType: LocationType,
    parentBuildingId?: string
  ) => {
    // Get location name
    let locationName = '';
    if (locationType === 'building') {
      const building = siteData.buildings.find(b => b.id === locationId);
      locationName = building?.name || '';
    } else if (locationType === 'floor') {
      // Find floor in buildings
      for (const building of siteData.buildings) {
        const floor = building.floors.find(f => f.id === locationId);
        if (floor) {
          locationName = `${building.name} - Floor ${floor.floorNumber}`;
          break;
        }
      }
    } else if (locationType === 'zone') {
      // Find zone in buildings/floors
      for (const building of siteData.buildings) {
        for (const floor of building.floors) {
          const zone = floor.zones.find(z => z.id === locationId);
          if (zone) {
            locationName = zone.name;
            break;
          }
        }
      }
    }

    // Open dialog immediately with current valves (or null if not loaded)
    const currentValves = locationValves.get(locationId) || null;
    
    setValveViewerDialog({
      open: true,
      locationType,
      locationId,
      locationName,
      valves: currentValves,
    });

    // Load valves if not already loaded
    if (!locationValves.has(locationId)) {
      const loadedValves = await loadValvesForLocation(locationId, locationType);
      // Update dialog with loaded valves
      setValveViewerDialog(prev => ({
        ...prev,
        valves: loadedValves,
      }));
    }
  };

  // CRUD operations
  const handleCreateBuilding = async (data: { name: string }) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/synoptics/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, ...data }),
      });
      
      if (!response.ok) throw new Error('Failed to create building');
      
      setAddingBuilding(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create building');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFloor = async (buildingId: string, data: { floorNumber: number; name?: string }) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/synoptics/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId, ...data }),
      });
      
      if (!response.ok) throw new Error('Failed to create floor');
      
      setAddingFloorTo(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create floor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateZone = async (floorId: string, data: { name: string }) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/synoptics/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorId, ...data }),
      });
      
      if (!response.ok) throw new Error('Failed to create zone');
      
      setAddingZoneTo(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openValveDialog = (type: LocationType, targetId: string, targetName: string) => {
    setValveDialog({ open: true, type, targetId, targetName });
  };

  const handleCreateIsolationValve = async (gasTypes: GasType[]) => {
    if (!valveDialog.type || !valveDialog.targetId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create multiple valves for each gas type
      const valvePromises = gasTypes.map(async (gasType) => {
        // Use centralized gas config for consistent labels
        const gasLabel = GAS_CONFIG[gasType]?.shortLabel || gasType.toUpperCase();
        const valveName = `${valveDialog.targetName} - ${gasLabel} Valve`;
        const valveTypeMap = { building: 'isolation', floor: 'area', zone: 'zone' };
        
        // Create valve
        const valveResponse = await fetch('/api/synoptics/valves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: siteData.organizationId,
            name: valveName,
            valveType: valveTypeMap[valveDialog.type],
            gasType,
            state: 'open',
          }),
        });
        
        if (!valveResponse.ok) throw new Error(`Failed to create ${gasLabel} valve`);
        const valve = await valveResponse.json();
        
        // Create node
        const nodeData: any = {
          organizationId: siteData.organizationId,
          nodeType: 'valve',
          elementId: valve.id,
          outletCount: 0,
        };
        
        if (valveDialog.type === 'building') nodeData.buildingId = valveDialog.targetId;
        if (valveDialog.type === 'floor') nodeData.floorId = valveDialog.targetId;
        if (valveDialog.type === 'zone') nodeData.zoneId = valveDialog.targetId;
        
        const nodeResponse = await fetch('/api/synoptics/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nodeData),
        });
        
        if (!nodeResponse.ok) throw new Error(`Failed to create ${gasLabel} node`);
        
        return valve;
      });

      await Promise.all(valvePromises);
      
      // Reload valves for location
      if (valveDialog.type && valveDialog.targetId) {
        await loadValvesForLocation(valveDialog.targetId, valveDialog.type);
      }
      
      // Refresh counts and gas indicators
      await refreshValveCounts();
      
      setValveDialog({ open: false, type: null, targetId: null, targetName: null });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create isolation valve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditValve = (valve: ValveInfo) => {
    setEditValveDialog({ open: true, valve });
  };

  const handleSaveValve = async (valveId: string, updates: Partial<ValveInfo>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/synoptics/valves/${valveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update valve');
      
      // Refresh counts and gas indicators
      await refreshValveCounts();
      
      setEditValveDialog({ open: false, valve: null });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update valve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteValve = async (valveId: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/synoptics/valves/${valveId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete valve');
      
      // Refresh counts and gas indicators
      await refreshValveCounts();
      
      setEditValveDialog({ open: false, valve: null });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete valve');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Site Structure</h2>
        <div className="flex gap-2">
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? (
              <><Check className="mr-2 h-4 w-4" />Done Editing</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" />Edit Mode</>
            )}
          </Button>
          {isEditMode && (
            <Button variant="outline" size="sm" onClick={() => setAddingBuilding(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Building
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Building Form */}
      {isEditMode && addingBuilding && (
        <InlineForm
          type="building"
          onSubmit={handleCreateBuilding}
          onCancel={() => setAddingBuilding(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Buildings List */}
      {siteData.buildings.length === 0 && !addingBuilding ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No buildings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add buildings to organize your hospital site structure.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {siteData.buildings.map((building) => {
            const isExpanded = expandedBuildings.has(building.id);
            const valveCount = valveCounts.get(building.id) || 0;
            const gases = locationGases.get(building.id) || [];
            const valves = locationValves.get(building.id);

            return (
              <div key={building.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Building Header */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => toggleBuilding(building.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{building.name}</h3>
                        <p className="text-xs text-gray-500">
                          {building.floors.length} floor{building.floors.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <ValveBadge
                        locationId={building.id}
                        count={valveCount}
                        onClick={() => handleValveBadgeClick(building.id, 'building')}
                        isLoading={isLoadingCounts}
                      />
                      <GasIndicators gases={gases} size="md" />
                      {isEditMode && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openValveDialog('building', building.id, building.name)}
                            className="text-xs"
                          >
                            Add Valve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExpandedBuildings(prev => new Set(prev).add(building.id));
                              setAddingFloorTo(building.id);
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />Floor
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Building Content */}
                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {/* Add Floor Form */}
                    {isEditMode && addingFloorTo === building.id && (
                      <InlineForm
                        type="floor"
                        onSubmit={(data) => handleCreateFloor(building.id, data)}
                        onCancel={() => setAddingFloorTo(null)}
                        isSubmitting={isSubmitting}
                      />
                    )}

                    {/* Floors List - TODO: Extract to separate component */}
                    {building.floors.length > 0 && (
                      <div className="space-y-2">
                        {building.floors.map((floor) => {
                          const isFloorExpanded = expandedFloors.has(floor.id);
                          const floorValveCount = valveCounts.get(floor.id) || 0;
                          const floorGases = locationGases.get(floor.id) || [];
                          const floorValves = locationValves.get(floor.id);

                          return (
                            <div key={floor.id} className="border border-gray-200 rounded-md overflow-hidden">
                              {/* Floor Header */}
                              <div className="p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <button
                                      onClick={() => toggleFloor(floor.id)}
                                      className="p-0.5 hover:bg-gray-200 rounded"
                                    >
                                      {isFloorExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                      )}
                                    </button>
                                    <Layers className="h-4 w-4 text-green-600" />
                                    <div>
                                      <span className="font-medium text-sm text-gray-900">
                                        Floor {floor.floorNumber}
                                      </span>
                                      {floor.name && (
                                        <span className="ml-2 text-xs text-gray-500">{floor.name}</span>
                                      )}
                                      {floor.zones.length > 0 && (
                                        <span className="ml-2 text-xs text-gray-400">
                                          ({floor.zones.length} zone{floor.zones.length !== 1 ? 's' : ''})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <ValveBadge
                                      locationId={floor.id}
                                      count={floorValveCount}
                                      onClick={() => handleValveBadgeClick(floor.id, 'floor', building.id)}
                                      size="sm"
                                      isLoading={isLoadingCounts}
                                    />
                                    <GasIndicators gases={floorGases} size="sm" />
                                    {isEditMode && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openValveDialog('floor', floor.id, `${building.name} - Floor ${floor.floorNumber}`)}
                                          className="text-xs"
                                        >
                                          Add Valve
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setExpandedBuildings(prev => new Set(prev).add(building.id));
                                            setExpandedFloors(prev => new Set(prev).add(floor.id));
                                            setAddingZoneTo(floor.id);
                                          }}
                                        >
                                          <Plus className="mr-1 h-3 w-3" />Zone
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Floor Content */}
                              {isFloorExpanded && (
                                <div className="p-3 bg-white space-y-2">
                                  {/* Add Zone Form */}
                                  {isEditMode && addingZoneTo === floor.id && (
                                    <InlineForm
                                      type="zone"
                                      onSubmit={(data) => handleCreateZone(floor.id, data)}
                                      onCancel={() => setAddingZoneTo(null)}
                                      isSubmitting={isSubmitting}
                                    />
                                  )}

                                  {/* Zones List - Card Grid Layout */}
                                  {floor.zones.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {floor.zones.map((zone) => {
                                        const zoneValveCount = valveCounts.get(zone.id) || 0;
                                        const zoneGases = locationGases.get(zone.id) || [];
                                        const zoneValves = locationValves.get(zone.id);

                                        return (
                                          <div 
                                            key={zone.id} 
                                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                          >
                                            {/* Zone Header - Centered */}
                                            <div className="flex flex-col items-center text-center mb-3">
                                              <Box className="h-5 w-5 text-purple-600 mb-2" />
                                              <h4 className="font-semibold text-sm text-gray-900">
                                                {zone.name}
                                              </h4>
                                            </div>

                                            {/* Zone Badges - Centered */}
                                            <div className="flex flex-wrap justify-center gap-2 mb-3">
                                              <ValveBadge
                                                locationId={zone.id}
                                                count={zoneValveCount}
                                                onClick={() => handleValveBadgeClick(zone.id, 'zone', building.id)}
                                                size="sm"
                                                isLoading={isLoadingCounts}
                                              />
                                              <GasIndicators gases={zoneGases} size="sm" />
                                            </div>

                                            {/* Zone Actions - Centered */}
                                            {isEditMode && (
                                              <div className="flex justify-center">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => openValveDialog('zone', zone.id, zone.name)}
                                                  className="text-xs w-full"
                                                >
                                                  Add Valve
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Valve Creation Dialog */}
      <ValveCreationDialog
        dialog={valveDialog}
        isSubmitting={isSubmitting}
        error={error}
        onConfirm={handleCreateIsolationValve}
        onClose={() => setValveDialog({ open: false, type: null, targetId: null, targetName: null })}
      />

      {/* Valve Edit Dialog */}
      <ValveEditDialog
        valve={editValveDialog.valve}
        open={editValveDialog.open}
        isSubmitting={isSubmitting}
        error={error}
        onSave={handleSaveValve}
        onDelete={handleDeleteValve}
        onClose={() => setEditValveDialog({ open: false, valve: null })}
      />

      {/* Valve Viewer Dialog */}
      <ValveViewerDialog
        open={valveViewerDialog.open}
        onOpenChange={(open) => setValveViewerDialog(prev => ({ ...prev, open }))}
        valves={valveViewerDialog.valves}
        locationType={valveViewerDialog.locationType || 'building'}
        locationName={valveViewerDialog.locationName}
        isLoading={loadingValves}
        isEditMode={isEditMode}
        onEditValve={handleEditValve}
      />
    </div>
  );
}
