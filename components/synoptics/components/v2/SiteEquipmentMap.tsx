'use client';

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
  } | null;
  buildingId?: string | null;
  floorId?: string | null;
}

interface EquipmentFeature {
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

  // Edit dialog state
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentFeature | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch equipment data
  const { data: nodesData, isLoading, isError } = useQuery<RawNode[]>({
    queryKey: ['site-equipment', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/nodes?siteId=${siteId}`);
      if (!response.ok) throw new Error('Failed to load equipment');
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30_000,
  });

  const nodes = nodesData ?? [];

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
          gasType: node.gasType || node.metadata?.gasType || 'Unknown',
          coordinates,
          latitude: node.latitude,
          longitude: node.longitude,
          buildingId: node.buildingId ?? node.location?.buildingId ?? null,
          floorId: node.floorId ?? node.location?.floorId ?? null,
        };

        return item;
      })
      .filter((item): item is EquipmentFeature => item !== null);
  }, [nodes]);


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

  // Apply filters
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.nodeType)) return false;

      // Building filter
      if (selectedBuildingId !== 'all' && item.buildingId !== selectedBuildingId) return false;

      // Floor filter
      if (selectedFloorId !== 'all' && item.floorId !== selectedFloorId) return false;

      return true;
    });
  }, [equipment, selectedTypes, selectedBuildingId, selectedFloorId]);

  // Prepare GeoJSON for map
  const featureCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: filteredEquipment
        .filter((item) => item.coordinates !== null)
        .map((item) => ({
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
          },
        })),
    }),
    [filteredEquipment, buildingMap]
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

  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedFloorId('all');
  };

  const resetFilters = () => {
    setSelectedTypes(['valve', 'source']);
    setSelectedBuildingId('all');
    setSelectedFloorId('all');
  };

  // Equipment interaction handlers
  const handleEquipmentClick = (item: EquipmentFeature) => {
    setSelectedEquipment(item);
    setShowEditDialog(true);
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
        buildings={buildings}
        floorsForSelectedBuilding={floorsForSelectedBuilding}
        filteredCount={filteredEquipment.length}
        totalCount={equipment.length}
        onReset={resetFilters}
      />

      {/* Content Area - Map View */}
      {viewMode === 'map' && (
        <EquipmentMapView
          isLoading={isLoading}
          isError={isError}
          featureCollection={featureCollection}
          equipmentWithCoordsCount={equipmentWithCoords.length}
          mapCenter={mapCenter}
          onMapReady={setMapReady}
          mapReady={mapReady}
        />
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

      {/* Content Area - List View */}
      {viewMode === 'list' && (
        <EquipmentListView
          isLoading={isLoading}
          equipment={filteredEquipment}
          hasEquipment={hasEquipment}
          buildingMap={buildingMap}
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
          siteLatitude={siteLatitude}
          siteLongitude={siteLongitude}
        />
      )}
    </div>
  );
}
