'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Layers, Box, MapPin, X, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Site {
  id: string;
  name: string;
  buildings?: BuildingData[];
}

interface BuildingData {
  id: string;
  name: string;
  floors?: FloorData[];
}

interface FloorData {
  id: string;
  name: string;
  floorNumber: number;
  zones?: ZoneData[];
}

interface ZoneData {
  id: string;
  name: string;
}

interface HierarchicalLocationFilterProps {
  organizationId: string;
  nodes: any[];
  selectedLocations: {
    buildingIds: Set<string>;
    floorIds: Set<string>;
    zoneIds: Set<string>;
    showUnassigned: boolean;
  };
  onChange: (locations: {
    buildingIds: Set<string>;
    floorIds: Set<string>;
    zoneIds: Set<string>;
    showUnassigned: boolean;
  }) => void;
  onClose: () => void;
}

export function HierarchicalLocationFilter({
  organizationId,
  nodes,
  selectedLocations,
  onChange,
  onClose,
}: HierarchicalLocationFilterProps) {
  const [hierarchy, setHierarchy] = useState<Site[]>([]);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load site hierarchy
  useEffect(() => {
    async function loadHierarchy() {
      try {
        setLoading(true);
        const response = await fetch(`/api/synoptics/sites?organizationId=${organizationId}`);
        if (!response.ok) throw new Error('Failed to load sites');
        
        const sites = await response.json();
        
        // Load buildings for each site
        const sitesWithHierarchy = await Promise.all(
          sites.map(async (site: Site) => {
            const buildingsRes = await fetch(`/api/synoptics/buildings?siteId=${site.id}`);
            const buildings = await buildingsRes.json();
            
            // Load floors for each building
            const buildingsWithFloors = await Promise.all(
              buildings.map(async (building: BuildingData) => {
                const floorsRes = await fetch(`/api/synoptics/floors?buildingId=${building.id}`);
                const floors = await floorsRes.json();
                
                // Load zones for each floor
                const floorsWithZones = await Promise.all(
                  floors.map(async (floor: FloorData) => {
                    const zonesRes = await fetch(`/api/synoptics/zones?floorId=${floor.id}`);
                    const zones = await zonesRes.json();
                    return { ...floor, zones };
                  })
                );
                
                return { ...building, floors: floorsWithZones };
              })
            );
            
            return { ...site, buildings: buildingsWithFloors };
          })
        );
        
        setHierarchy(sitesWithHierarchy);
      } catch (error) {
        console.error('Failed to load hierarchy:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadHierarchy();
  }, [organizationId]);

  // Calculate node counts at each level
  const nodeCounts = useMemo(() => {
    const counts = {
      unassigned: 0,
      buildings: new Map<string, number>(),
      floors: new Map<string, number>(),
      zones: new Map<string, number>(),
    };

    nodes.forEach((node) => {
      if (!node.buildingId && !node.floorId && !node.zoneId) {
        counts.unassigned++;
      } else {
        if (node.buildingId) {
          counts.buildings.set(node.buildingId, (counts.buildings.get(node.buildingId) || 0) + 1);
        }
        if (node.floorId) {
          counts.floors.set(node.floorId, (counts.floors.get(node.floorId) || 0) + 1);
        }
        if (node.zoneId) {
          counts.zones.set(node.zoneId, (counts.zones.get(node.zoneId) || 0) + 1);
        }
      }
    });

    return counts;
  }, [nodes]);

  const toggleBuilding = (buildingId: string) => {
    const newBuildingIds = new Set(selectedLocations.buildingIds);
    if (newBuildingIds.has(buildingId)) {
      newBuildingIds.delete(buildingId);
    } else {
      newBuildingIds.add(buildingId);
    }
    onChange({ ...selectedLocations, buildingIds: newBuildingIds });
  };

  const toggleFloor = (floorId: string) => {
    const newFloorIds = new Set(selectedLocations.floorIds);
    if (newFloorIds.has(floorId)) {
      newFloorIds.delete(floorId);
    } else {
      newFloorIds.add(floorId);
    }
    onChange({ ...selectedLocations, floorIds: newFloorIds });
  };

  const toggleZone = (zoneId: string) => {
    const newZoneIds = new Set(selectedLocations.zoneIds);
    if (newZoneIds.has(zoneId)) {
      newZoneIds.delete(zoneId);
    } else {
      newZoneIds.add(zoneId);
    }
    onChange({ ...selectedLocations, zoneIds: newZoneIds });
  };

  const toggleUnassigned = () => {
    onChange({ ...selectedLocations, showUnassigned: !selectedLocations.showUnassigned });
  };

  const clearAllFilters = () => {
    onChange({
      buildingIds: new Set(),
      floorIds: new Set(),
      zoneIds: new Set(),
      showUnassigned: true,
    });
  };

  const selectAllVisible = () => {
    const buildingIds = new Set<string>();
    const floorIds = new Set<string>();
    const zoneIds = new Set<string>();

    hierarchy.forEach((site) => {
      site.buildings?.forEach((building) => {
        buildingIds.add(building.id);
        building.floors?.forEach((floor) => {
          floorIds.add(floor.id);
          floor.zones?.forEach((zone) => {
            zoneIds.add(zone.id);
          });
        });
      });
    });

    onChange({ buildingIds, floorIds, zoneIds, showUnassigned: true });
  };

  const toggleBuildingExpansion = (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const toggleFloorExpansion = (floorId: string) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floorId)) {
      newExpanded.delete(floorId);
    } else {
      newExpanded.add(floorId);
    }
    setExpandedFloors(newExpanded);
  };

  const activeFilterCount = 
    selectedLocations.buildingIds.size + 
    selectedLocations.floorIds.size + 
    selectedLocations.zoneIds.size +
    (selectedLocations.showUnassigned ? 0 : 1);

  if (loading) {
    return (
      <Card className="absolute top-4 left-4 w-96 max-h-[calc(100vh-8rem)] shadow-lg z-20">
        <div className="p-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading hierarchy...</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="absolute top-4 left-4 w-96 max-h-[calc(100vh-8rem)] shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Location Filter</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-gray-200 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllVisible}
          className="flex-1"
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="flex-1"
        >
          Clear All
        </Button>
      </div>

      {/* Filter List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Unassigned Nodes */}
        <button
          onClick={toggleUnassigned}
          className={cn(
            "w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors",
            selectedLocations.showUnassigned
              ? "bg-blue-50 text-blue-900 border border-blue-200"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            <span className="font-medium">Unassigned / External</span>
          </div>
          <Badge variant={selectedLocations.showUnassigned ? "default" : "secondary"}>
            {nodeCounts.unassigned}
          </Badge>
        </button>

        {/* Hierarchy */}
        {hierarchy.map((site) => (
          <div key={site.id} className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 pt-2">
              {site.name}
            </div>

            {site.buildings?.map((building) => {
              const isExpanded = expandedBuildings.has(building.id);
              const isSelected = selectedLocations.buildingIds.has(building.id);
              const nodeCount = nodeCounts.buildings.get(building.id) || 0;

              return (
                <div key={building.id} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBuildingExpansion(building.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleBuilding(building.id)}
                      className={cn(
                        "flex-1 flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                        isSelected
                          ? "bg-blue-50 text-blue-900 border border-blue-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">{building.name}</span>
                      </div>
                      <Badge variant={isSelected ? "default" : "secondary"}>
                        {nodeCount}
                      </Badge>
                    </button>
                  </div>

                  {/* Floors */}
                  {isExpanded && building.floors?.map((floor) => {
                    const isFloorExpanded = expandedFloors.has(floor.id);
                    const isFloorSelected = selectedLocations.floorIds.has(floor.id);
                    const floorNodeCount = nodeCounts.floors.get(floor.id) || 0;

                    return (
                      <div key={floor.id} className="ml-6 space-y-1">
                        <div className="flex items-center gap-1">
                          {floor.zones && floor.zones.length > 0 && (
                            <button
                              onClick={() => toggleFloorExpansion(floor.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {isFloorExpanded ? (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => toggleFloor(floor.id)}
                            className={cn(
                              "flex-1 flex items-center justify-between p-2 rounded-md text-xs transition-colors",
                              isFloorSelected
                                ? "bg-green-50 text-green-900 border border-green-200"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="h-3 w-3" />
                              <span className="font-medium">
                                {floor.name || `Floor ${floor.floorNumber}`}
                              </span>
                            </div>
                            <Badge variant={isFloorSelected ? "default" : "secondary"} className="text-xs">
                              {floorNodeCount}
                            </Badge>
                          </button>
                        </div>

                        {/* Zones */}
                        {isFloorExpanded && floor.zones?.map((zone) => {
                          const isZoneSelected = selectedLocations.zoneIds.has(zone.id);
                          const zoneNodeCount = nodeCounts.zones.get(zone.id) || 0;

                          return (
                            <button
                              key={zone.id}
                              onClick={() => toggleZone(zone.id)}
                              className={cn(
                                "ml-4 w-full flex items-center justify-between p-2 rounded-md text-xs transition-colors",
                                isZoneSelected
                                  ? "bg-purple-50 text-purple-900 border border-purple-200"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Box className="h-3 w-3" />
                                <span className="font-medium">{zone.name}</span>
                              </div>
                              <Badge variant={isZoneSelected ? "default" : "secondary"} className="text-xs">
                                {zoneNodeCount}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}

        {hierarchy.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No sites or buildings configured yet.
            <br />
            Create a site structure to organize your elements.
          </div>
        )}
      </div>
    </Card>
  );
}
