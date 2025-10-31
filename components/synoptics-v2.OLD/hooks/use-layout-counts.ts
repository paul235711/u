/**
 * React Query hook for layout counts per location
 * Counts layouts at site level and floor level
 */

import { useQuery } from '@tanstack/react-query';

interface LayoutCounts {
  [locationId: string]: number;
}

export function useLayoutCounts(siteId: string, layouts: any[]) {
  return useQuery({
    queryKey: ['layout-counts', siteId, JSON.stringify(layouts.map(l => l.id))],
    queryFn: () => {
      const counts: LayoutCounts = {};
      
      layouts.forEach((layout: any) => {
        // Site-level layouts (no floorId and no zoneId)
        if (!layout.floorId && !layout.zoneId) {
          counts[siteId] = (counts[siteId] || 0) + 1;
        }
        
        // Floor-level layouts (has floorId but no zoneId)
        if (layout.floorId && !layout.zoneId) {
          counts[layout.floorId] = (counts[layout.floorId] || 0) + 1;
        }
        
        // Zone-level layouts
        if (layout.zoneId) {
          counts[layout.zoneId] = (counts[layout.zoneId] || 0) + 1;
        }
      });
      
      return counts;
    },
    staleTime: 0, // No cache - always recalculate when layouts change
  });
}
