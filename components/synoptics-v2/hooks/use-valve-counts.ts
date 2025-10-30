/**
 * React Query hook for valve counts per location
 * Loads valve counts for all buildings, floors, zones in a site
 */

import { useQuery } from '@tanstack/react-query';

interface ValveCounts {
  [locationId: string]: number;
}

export function useValveCounts(organizationId: string, siteId: string) {
  return useQuery({
    queryKey: ['valve-counts', organizationId, siteId],
    queryFn: async () => {
      if (!organizationId) return {};

      // Fetch all nodes for the organization filtered by site
      const response = await fetch(`/api/synoptics/nodes?organizationId=${organizationId}&siteId=${siteId}`);
      if (!response.ok) return {};
      
      const nodes = await response.json();
      
      // Filter only valve nodes
      const valveNodes = nodes.filter((node: any) => node.nodeType === 'valve');
      
      // Count valves per location (building, floor, zone)
      const counts: ValveCounts = {};
      
      valveNodes.forEach((node: any) => {
        // Count at building level
        if (node.buildingId) {
          counts[node.buildingId] = (counts[node.buildingId] || 0) + 1;
        }
        
        // Count at floor level
        if (node.floorId) {
          counts[node.floorId] = (counts[node.floorId] || 0) + 1;
        }
        
        // Count at zone level
        if (node.zoneId) {
          counts[node.zoneId] = (counts[node.zoneId] || 0) + 1;
        }
      });
      
      return counts;
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: !!organizationId && !!siteId,
  });
}
