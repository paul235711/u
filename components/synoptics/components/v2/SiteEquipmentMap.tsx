"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EquipmentViewSwitcher,
  EquipmentFilters,
  EquipmentMapView,
  EquipmentGridView,
  EquipmentListView,
} from './equipment-map';
import { EquipmentEditDialog } from './EquipmentEditDialog';
import { EquipmentCreateDialog } from './EquipmentCreateDialog';
import { EquipmentDeleteDialog } from './EquipmentDeleteDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EquipmentCard } from './EquipmentCard';
import { MediaDisplay } from './MediaDisplay';
import { useDownstreamNodes } from './hooks/useDownstreamNodes';

const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];

type ViewMode = 'map' | 'grid' | 'list';

interface FloorSummary {
  id: string;
  name: string;
}

interface BuildingSummary {
  id: string;
  name: string;
  floors?: FloorSummary[];
}

export interface SiteEquipmentMapProps {
  siteId: string;
  siteName: string;
  siteLatitude?: number;
  siteLongitude?: number;
  buildings?: BuildingSummary[];
}

interface RawNode {
  id: string;
  nodeType?: string;
  elementId: string;
  name?: string;
  label?: string;
  gasType?: string;
  state?: string;
  status?: string;
  valveType?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  metadata?: Record<string, any> | null;
  location?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    buildingId?: string | null;
    floorId?: string | null;
    zoneId?: string | null;
  } | null;
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
}

interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface EquipmentFeature {
  id: string;
  name: string;
  nodeType: 'valve' | 'source' | 'fitting';
  elementId: string;
  status: string;
  gasType: string;
  coordinates: [number, number] | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  buildingId: string | null;
  floorId: string | null;
  zoneId: string | null;
}

// Utility functions
function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normaliseStatus(status?: string): string {
  if (!status) return 'unknown';
  return status.toLowerCase().replace(/\s+/g, '_');
}

function normaliseGasType(gasType?: string): string {
  if (!gasType) return 'unknown';
  const key = gasType.toLowerCase().replace(/\s+/g, '_');
  switch (key) {
    case 'oxygen':
    case 'medical_air':
    case 'vacuum':
    case 'nitrous_oxide':
    case 'nitrogen':
    case 'carbon_dioxide':
    case 'co2':
    case 'compressed_air':
      return key;
    default:
      return gasType;
  }
}

function humanise(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

/**
 * Comprehensive site equipment map with multiple view modes (Map, Grid, List)
 * Displays valves, sources, and fittings with advanced filtering and editing capabilities
 */
export function SiteEquipmentMap({
  siteId,
  siteName,
  siteLatitude,
  siteLongitude,
  buildings = [],
}: SiteEquipmentMapProps) {
  const queryClient = useQueryClient();

  // View state
  const [mapReady, setMapReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['valve', 'source']);
  const [selectedBuildingId, setSelectedBuildingId] = useState('all');
  const [selectedFloorId, setSelectedFloorId] = useState('all');
  const [selectedGasTypes, setSelectedGasTypes] = useState<string[]>([]);

  // Edit dialog state
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentFeature | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingNodeIds, setDeletingNodeIds] = useState<string[]>([]);

  // Fetch equipment data
  const { data: nodesData, isLoading, isError } = useQuery<RawNode[]>({
    queryKey: ['site-equipment', siteId, selectedBuildingId, selectedFloorId],
    queryFn: async () => {
      let url = `/api/synoptics/nodes?siteId=${siteId}`;

      if (selectedBuildingId !== 'all') {
        url += `&buildingId=${selectedBuildingId}`;
      } else if (selectedFloorId !== 'all') {
        url += `&floorId=${selectedFloorId}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load equipment');
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30_000,
  });

  const nodes = nodesData ?? [];

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['site-connections', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/connections?siteId=${siteId}`);
      if (!response.ok) throw new Error('Failed to load connections');
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30_000,
  });

  // Transform raw nodes into equipment features
  const equipment = useMemo<EquipmentFeature[]>(() => {
    return nodes
      .map((node) => {
        const nodeType = node.nodeType?.toLowerCase();
        if (!nodeType || !['valve', 'source', 'fitting'].includes(nodeType)) return null;

        const lat =
          toNumber(node.latitude) ??
          toNumber(node.metadata?.latitude) ??
          toNumber(node.metadata?.lat) ??
          toNumber(node.location?.latitude);
        const lng =
          toNumber(node.longitude) ??
          toNumber(node.metadata?.longitude) ??
          toNumber(node.metadata?.lng) ??
          toNumber(node.location?.longitude);

        const coordinates: [number, number] | null =
          lat !== undefined && lng !== undefined ? [lng, lat] : null;

        const item: EquipmentFeature = {
          id: node.id,
          name: node.name || node.label || humanise(nodeType),
          nodeType: nodeType as 'valve' | 'source' | 'fitting',
          elementId: node.elementId,
          status: normaliseStatus(node.state || node.status),
          gasType: normaliseGasType(node.gasType || node.metadata?.gasType || undefined),
          coordinates,
          latitude: node.latitude,
          longitude: node.longitude,
          buildingId: node.buildingId ?? node.location?.buildingId ?? null,
          floorId: node.floorId ?? node.location?.floorId ?? null,
          zoneId: node.zoneId ?? node.location?.zoneId ?? null,
        };

        return item;
      })
      .filter((item): item is EquipmentFeature => item !== null);
  }, [nodes]);

  const { data: hierarchyData } = useQuery({
    queryKey: ['site-hierarchy', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30000,
  });

  const { data: nodePositions = {} } = useQuery({
    queryKey: ['node-positions', nodes.map((n) => n.id)],
    queryFn: async () => {
      const positions: Record<string, any[]> = {};

      await Promise.all(
        nodes.map(async (node) => {
          try {
            const response = await fetch(`/api/synoptics/node-positions?nodeId=${node.id}`);
            if (response.ok) {
              positions[node.id] = await response.json();
            } else {
              positions[node.id] = [];
            }
          } catch (error) {
            console.error(`Failed to fetch positions for ${node.id}:`, error);
            positions[node.id] = [];
          }
        })
      );

      return positions;
    },
    enabled: nodes.length > 0,
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ['layouts', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/layouts?siteId=${siteId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!siteId,
  });


  // Build building lookup map
  const buildingMap = useMemo(() => {
    const map: Record<string, BuildingSummary> = {};
    buildings.forEach((building) => {
      map[building.id] = {
        id: building.id,
        name: building.name,
        floors: building.floors ?? [],
      };
    });
    return map;
  }, [buildings]);

  const floorsForSelectedBuilding = useMemo(() => {
    if (selectedBuildingId === 'all') return [];
    return buildingMap[selectedBuildingId]?.floors ?? [];
  }, [selectedBuildingId, buildingMap]);

  const selectedEquipmentId = selectedEquipment?.id ?? null;

  const downstreamNodeIds = useDownstreamNodes(connections, selectedEquipmentId);

  // Apply filters
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.nodeType)) return false;

      // Building filter
      if (selectedBuildingId !== 'all' && item.buildingId !== selectedBuildingId) return false;

      // Floor filter
      if (selectedFloorId !== 'all' && item.floorId !== selectedFloorId) return false;

      // Gas filter
      if (selectedGasTypes.length > 0 && !selectedGasTypes.includes(item.gasType)) return false;

      return true;
    });
  }, [equipment, selectedTypes, selectedBuildingId, selectedFloorId, selectedGasTypes]);

  // Prepare GeoJSON for map
  const featureCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: filteredEquipment
        .filter((item) => item.coordinates !== null)
        .map((item) => {
          let highlightType: 'selected' | 'downstream' | 'default' = 'default';
          if (selectedEquipmentId) {
            if (item.id === selectedEquipmentId) {
              highlightType = 'selected';
            } else if (downstreamNodeIds.has(item.id)) {
              highlightType = 'downstream';
            }
          }

          return {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: item.coordinates! },
            properties: {
              id: item.id,
              elementId: item.elementId,
              name: item.name,
              nodeType: item.nodeType,
              status: item.status,
              gasType: item.gasType,
              buildingName: item.buildingId ? buildingMap[item.buildingId]?.name ?? '' : '',
              floorName:
                item.floorId && item.buildingId
                  ? buildingMap[item.buildingId]?.floors?.find(
                      (floor: FloorSummary) => floor.id === item.floorId
                    )?.name ?? ''
                  : '',
              highlightType,
            },
          };
        }),
    }),
    [filteredEquipment, buildingMap, selectedEquipmentId, downstreamNodeIds]
  );

  const mapCenter = useMemo((): [number, number] => {
    if (typeof siteLongitude === 'number' && typeof siteLatitude === 'number') {
      return [siteLongitude, siteLatitude];
    }
    const withCoords = filteredEquipment.find((e) => e.coordinates !== null);
    if (withCoords?.coordinates) return withCoords.coordinates;
    return DEFAULT_CENTER;
  }, [filteredEquipment, siteLongitude, siteLatitude]);

  // Filter handlers
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleGasType = (gasType: string) => {
    setSelectedGasTypes((prev) =>
      prev.includes(gasType) ? prev.filter((g) => g !== gasType) : [...prev, gasType]
    );
  };

  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedFloorId('all');
  };

  const resetFilters = () => {
    setSelectedTypes(['valve', 'source']);
    setSelectedBuildingId('all');
    setSelectedFloorId('all');
    setSelectedGasTypes([]);
  };

  // Equipment interaction handlers
  const handleEquipmentClick = (item: any) => {
    setSelectedEquipment(item);
    setShowEditDialog(true);
  };

  const handleDeleteFromList = (id: string) => {
    setDeletingNodeIds([id]);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
    setShowEditDialog(false);
    setSelectedEquipment(null);
  };

  const hasEquipment = equipment.length > 0;
  const equipmentWithCoords = equipment.filter((e) => e.coordinates !== null);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50 px-6 py-20 text-center">
        <p className="text-sm text-red-600">Failed to load equipment data</p>
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-4">
      {/* View Switcher */}
      <EquipmentViewSwitcher
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={equipment.length}
        withCoordsCount={equipmentWithCoords.length}
      />

      {/* Filters Panel */}
      <EquipmentFilters
        selectedTypes={selectedTypes}
        onTypeToggle={toggleType}
        selectedBuildingId={selectedBuildingId}
        onBuildingChange={handleBuildingChange}
        selectedFloorId={selectedFloorId}
        onFloorChange={setSelectedFloorId}
        selectedGasTypes={selectedGasTypes}
        onGasTypeToggle={toggleGasType}
        buildings={buildings}
        floorsForSelectedBuilding={floorsForSelectedBuilding}
        filteredCount={filteredEquipment.length}
        totalCount={equipment.length}
        onReset={resetFilters}
      />

      {/* Content Area - Map View */}
      {viewMode === 'map' && (
        <div className="flex w-full">
          <div className="flex-1 min-w-0">
            <EquipmentMapView
              isLoading={isLoading}
              isError={isError}
              featureCollection={featureCollection}
              equipmentWithCoordsCount={equipmentWithCoords.length}
              mapCenter={mapCenter}
              onMapReady={setMapReady}
              mapReady={mapReady}
              focusedEquipmentId={selectedEquipment?.id ?? null}
              onFeatureClick={(id: string) => {
                const found = equipment.find((e) => e.id === id);
                if (found) {
                  setSelectedEquipment(found);
                  setShowEditDialog(false);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Content Area - Grid View */}
      {viewMode === 'grid' && (
        <EquipmentGridView
          isLoading={isLoading}
          equipment={filteredEquipment}
          hasEquipment={hasEquipment}
          buildingMap={buildingMap}
          onEquipmentClick={handleEquipmentClick}
        />
      )}

      {viewMode === 'list' && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {filteredEquipment.length} équipements
            {filteredEquipment.length !== equipment.length && (
              <span className="text-gray-400"> (sur {equipment.length})</span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      )}

      {/* Content Area - List View */}
      {viewMode === 'list' && (
        <EquipmentListView
          isLoading={isLoading}
          equipment={filteredEquipment}
          hasEquipment={hasEquipment}
          layouts={layouts}
          nodePositions={nodePositions}
          siteId={siteId}
          onDelete={handleDeleteFromList}
          onEquipmentClick={handleEquipmentClick}
        />
      )}

      {/* Equipment Edit Dialog */}
      {selectedEquipment && (
        <EquipmentEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          node={selectedEquipment}
          onSuccess={handleEditSuccess}
          siteId={siteId}
          siteLatitude={siteLatitude}
          siteLongitude={siteLongitude}
        />
      )}

      <EquipmentCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        siteId={siteId}
        hierarchyData={hierarchyData}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
          queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
          setIsCreateOpen(false);
        }}
      />

      <EquipmentDeleteDialog
        open={deletingNodeIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeletingNodeIds([]);
        }}
        nodeIds={deletingNodeIds}
        nodes={nodes}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
          setDeletingNodeIds([]);
        }}
      />
    </div>
  );
}
