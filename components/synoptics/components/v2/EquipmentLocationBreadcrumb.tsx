'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Layers, Box, MapPin, ChevronRight } from 'lucide-react';

interface EquipmentLocationBreadcrumbProps {
  node: any;
  siteId: string;
  variant?: 'default' | 'compact';
}

export function EquipmentLocationBreadcrumb({ node, siteId, variant = 'default', onlyLast = false }: EquipmentLocationBreadcrumbProps & { onlyLast?: boolean }) {
  // Fetch hierarchy to get location names
  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['site-hierarchy', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30000,
  });

  if (isLoading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }

  if (!hierarchyData) {
    return <span className="text-xs text-gray-400">No data</span>;
  }

  const parts = [];
  const labelClass = variant === 'compact' ? 'truncate max-w-[100px] whitespace-nowrap' : '';

  // Building
  if (node.buildingId) {
    const building = hierarchyData.buildings?.find((b: any) => b.id === node.buildingId);
    if (building) {
      parts.push(
        <div key="building" className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className={labelClass}>{building.name}</span>
        </div>
      );
    }
  }

  // Floor
  if (node.floorId) {
    const building = hierarchyData.buildings?.find((b: any) =>
      b.floors?.some((f: any) => f.id === node.floorId)
    );
    const floor = building?.floors?.find((f: any) => f.id === node.floorId);
    if (floor) {
      parts.push(
        <div key="floor" className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-gray-400" />
          <span className={labelClass}>{floor.name}</span>
        </div>
      );
    }
  }

  // Zone (and infer building/floor if only zoneId is set)
  if (node.zoneId) {
    let zone: any = null;
    let zoneFloor: any = null;
    let zoneBuilding: any = null;

    hierarchyData.buildings?.forEach((b: any) => {
      b.floors?.forEach((f: any) => {
        const z = f.zones?.find((z: any) => z.id === node.zoneId);
        if (z) {
          zone = z;
          zoneFloor = f;
          zoneBuilding = b;
        }
      });
    });

    if (zone) {
      // If node doesn't explicitly carry buildingId/floorId but we can infer them from the zone,
      // prepend building and floor so the breadcrumb shows the full path.
      if (!node.buildingId && zoneBuilding) {
        parts.push(
          <div key="zone-building" className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-gray-400" />
            <span className={labelClass}>{zoneBuilding.name}</span>
          </div>
        );
      }

      if (!node.floorId && zoneFloor) {
        parts.push(
          <div key="zone-floor" className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-gray-400" />
            <span className={labelClass}>{zoneFloor.name}</span>
          </div>
        );
      }

      parts.push(
        <div key="zone" className="flex items-center gap-1">
          <Box className="h-3 w-3 text-gray-400" />
          <span className={labelClass}>{zone.name}</span>
        </div>
      );
    }
  }

  if (variant === 'compact') {
    const displayParts = onlyLast && parts.length > 0 ? [parts[parts.length - 1]] : parts;

    if (displayParts.length === 0) {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <MapPin className="h-3 w-3" />
          <span>Site</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-xs">
        {displayParts.map((part, index) => (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
            {part}
          </div>
        ))}
      </div>
    );
  }

  const displayParts = onlyLast && parts.length > 0 ? [parts[parts.length - 1]] : parts;

  if (displayParts.length === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <MapPin className="h-3 w-3" />
        <span>Site</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {displayParts.map((part, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
          {part}
        </div>
      ))}
    </div>
  );
}
