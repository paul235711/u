/**
 * React Query hooks for hierarchy data and operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

/**
 * Fetch site hierarchy data (buildings, floors, zones, valves)
 */
export function useSiteHierarchy(siteId: string) {
  return useQuery({
    queryKey: ['site-hierarchy', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!response.ok) throw new Error('Failed to fetch hierarchy');
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create building mutation
 */
export function useCreateBuilding() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { siteId: string; name: string; address?: string }) => {
      const response = await fetch('/api/synoptics/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create building');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', variables.siteId] });
      router.refresh();
    },
  });
}

/**
 * Create floor mutation
 */
export function useCreateFloor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { buildingId: string; name?: string; floorNumber: number; siteId: string }) => {
      const response = await fetch('/api/synoptics/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create floor');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', variables.siteId] });
      router.refresh();
    },
  });
}

/**
 * Create zone mutation
 */
export function useCreateZone() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { floorId: string; name: string; siteId: string }) => {
      const response = await fetch('/api/synoptics/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create zone');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', variables.siteId] });
      router.refresh();
    },
  });
}

/**
 * Delete building mutation
 */
export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ buildingId, siteId }: { buildingId: string; siteId: string }) => {
      const response = await fetch(`/api/synoptics/buildings/${buildingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete building');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', variables.siteId] });
      router.refresh();
    },
  });
}

/**
 * Delete floor mutation
 */
export function useDeleteFloor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ floorId, siteId }: { floorId: string; siteId: string }) => {
      const response = await fetch(`/api/synoptics/floors/${floorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete floor');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', variables.siteId] });
      router.refresh();
    },
  });
}

/**
 * Delete zone mutation
 */
export function useDeleteZone() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ zoneId, siteId }: { zoneId: string; siteId: string }) => {
      const response = await fetch(`/api/synoptics/zones/${zoneId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete zone');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', variables.siteId] });
      router.refresh();
    },
  });
}
