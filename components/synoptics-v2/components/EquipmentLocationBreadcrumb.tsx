'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Layers, Box, MapPin, ChevronRight } from 'lucide-react';

interface EquipmentLocationBreadcrumbProps {
  node: any;
  siteId: string;
}

export function EquipmentLocationBreadcrumb({ node, siteId }: EquipmentLocationBreadcrumbProps) {
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

  // Building
  if (node.buildingId) {
    const building = hierarchyData.buildings?.find((b: any) => b.id === node.buildingId);
    if (building) {
      parts.push(
        <div key="building" className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span>{building.name}</span>
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
          <span>{floor.name}</span>
        </div>
      );
    }
  }

  // Zone
  if (node.zoneId) {
    let zone: any = null;
    hierarchyData.buildings?.forEach((b: any) => {
      b.floors?.forEach((f: any) => {
        const z = f.zones?.find((z: any) => z.id === node.zoneId);
        if (z) zone = z;
      });
    });
    if (zone) {
      parts.push(
        <div key="zone" className="flex items-center gap-1">
          <Box className="h-3 w-3 text-gray-400" />
          <span>{zone.name}</span>
        </div>
      );
    }
  }

  if (parts.length === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <MapPin className="h-3 w-3" />
        <span>Site</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {parts.map((part, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
          {part}
        </div>
      ))}
    </div>
  );
}
