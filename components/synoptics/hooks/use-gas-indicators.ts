/**
 * React Query hook for gas type indicators per location
 * Loads unique gas types for each building, floor, zone
 */

import { useQuery } from '@tanstack/react-query';
import type { GasType } from '@/components/synoptics/hierarchy/gas-indicators';

interface GasIndicators {
  byLocation: {
    [locationId: string]: GasType[];
  };
  allSiteGases: GasType[];
}

export function useGasIndicators(siteId: string) {
  return useQuery({
    queryKey: ['gas-indicators', siteId],
    queryFn: async () => {
      if (!siteId) return { byLocation: {}, allSiteGases: [] };

      // Fetch all nodes for the site
      const response = await fetch(`/api/synoptics/nodes?siteId=${siteId}`);
      if (!response.ok) return { byLocation: {}, allSiteGases: [] };
      
      const nodes = await response.json();
      
      // Filter only valve nodes (they have gasType)
      const valveNodes = nodes.filter((node: any) => node.nodeType === 'valve' && node.gasType);
      
      // Collect unique gas types per location
      const indicators: Record<string, Set<string>> = {};
      const allSiteGasesSet = new Set<string>();
      
      valveNodes.forEach((node: any) => {
        const gasType = node.gasType;
        allSiteGasesSet.add(gasType);
        
        // Collect at building level
        if (node.buildingId) {
          if (!indicators[node.buildingId]) {
            indicators[node.buildingId] = new Set();
          }
          indicators[node.buildingId].add(gasType);
        }
        
        // Collect at floor level
        if (node.floorId) {
          if (!indicators[node.floorId]) {
            indicators[node.floorId] = new Set();
          }
          indicators[node.floorId].add(gasType);
        }
        
        // Collect at zone level
        if (node.zoneId) {
          if (!indicators[node.zoneId]) {
            indicators[node.zoneId] = new Set();
          }
          indicators[node.zoneId].add(gasType);
        }
      });
      
      // Convert Sets to Arrays
      const byLocation: Record<string, GasType[]> = {};
      Object.keys(indicators).forEach(locationId => {
        byLocation[locationId] = Array.from(indicators[locationId]) as GasType[];
      });
      
      return {
        byLocation,
        allSiteGases: Array.from(allSiteGasesSet) as GasType[],
      };
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: !!siteId,
  });
}
