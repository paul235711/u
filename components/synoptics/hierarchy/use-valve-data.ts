import { useState, useEffect, useCallback } from 'react';
import type { ValveInfo } from './types';
import type { GasType } from './gas-indicators';

/**
 * Custom hook to manage valve data loading and caching
 */
export function useValveData(organizationId: string) {
  const [locationValves, setLocationValves] = useState<Map<string, ValveInfo[]>>(new Map());
  const [valveCounts, setValveCounts] = useState<Map<string, number>>(new Map());
  const [locationGases, setLocationGases] = useState<Map<string, GasType[]>>(new Map());
  const [loadingValves, setLoadingValves] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // Load initial valve counts on mount
  useEffect(() => {
    if (!organizationId) return;

    async function loadInitialValveCounts() {
      setIsLoadingCounts(true);
      try {
        const response = await fetch(`/api/synoptics/nodes?organizationId=${organizationId}`);
        if (!response.ok) return;
        
        const nodes = await response.json();
        const valveNodes = nodes.filter((node: any) => node.nodeType === 'valve');

        // Fetch valve details to get gas types
        const valveDetailsPromises = valveNodes.map(async (node: any) => {
          try {
            const valveResponse = await fetch(`/api/synoptics/valves/${node.elementId}`);
            if (!valveResponse.ok) return null;
            const valve = await valveResponse.json();
            return { ...node, gasType: valve.gasType };
          } catch {
            return null;
          }
        });

        const valveNodesWithGas = (await Promise.all(valveDetailsPromises)).filter(Boolean);

        // Count valves and track gases per location
        const counts = new Map<string, number>();
        const gases = new Map<string, Set<GasType>>();

        valveNodesWithGas.forEach((node: any) => {
          const gasType = node.gasType as GasType;
          
          if (node.buildingId) {
            counts.set(node.buildingId, (counts.get(node.buildingId) || 0) + 1);
            if (!gases.has(node.buildingId)) gases.set(node.buildingId, new Set());
            gases.get(node.buildingId)!.add(gasType);
          }
          if (node.floorId) {
            counts.set(node.floorId, (counts.get(node.floorId) || 0) + 1);
            if (!gases.has(node.floorId)) gases.set(node.floorId, new Set());
            gases.get(node.floorId)!.add(gasType);
          }
          if (node.zoneId) {
            counts.set(node.zoneId, (counts.get(node.zoneId) || 0) + 1);
            if (!gases.has(node.zoneId)) gases.set(node.zoneId, new Set());
            gases.get(node.zoneId)!.add(gasType);
          }
        });

        // Convert Sets to Arrays
        const gasArrays = new Map<string, GasType[]>();
        gases.forEach((gasSet, locationId) => {
          gasArrays.set(locationId, Array.from(gasSet));
        });

        // Store the counts and gases
        setValveCounts(counts);
        setLocationGases(gasArrays);
      } catch (error) {
        console.error('Failed to load valve counts:', error);
      } finally {
        setIsLoadingCounts(false);
      }
    }

    loadInitialValveCounts();
  }, [organizationId]);

  // Load detailed valve information for a specific location
  const loadValvesForLocation = useCallback(
    async (locationId: string, locationType: 'building' | 'floor' | 'zone'): Promise<ValveInfo[]> => {
      setLoadingValves(true);
      
      try {
        const nodesResponse = await fetch(`/api/synoptics/nodes?organizationId=${organizationId}`);
        if (!nodesResponse.ok) throw new Error('Failed to fetch nodes');
        
        const nodes = await nodesResponse.json();

        // Filter nodes by location
        const locationNodes = nodes.filter((node: any) => {
          if (locationType === 'building') return node.buildingId === locationId;
          if (locationType === 'floor') return node.floorId === locationId;
          if (locationType === 'zone') return node.zoneId === locationId;
          return false;
        }).filter((node: any) => node.nodeType === 'valve');

        // Fetch valve details
        const valvePromises = locationNodes.map(async (node: any) => {
          try {
            const valveResponse = await fetch(`/api/synoptics/valves/${node.elementId}`);
            if (!valveResponse.ok) return null;
            const valve = await valveResponse.json();
            return { ...valve, nodeId: node.id };
          } catch {
            return null;
          }
        });

        const valves = (await Promise.all(valvePromises)).filter(Boolean) as ValveInfo[];
        setLocationValves(prev => new Map(prev).set(locationId, valves));
        return valves;
      } catch (error) {
        console.error('Failed to load valves:', error);
        return [];
      } finally {
        setLoadingValves(false);
      }
    },
    [organizationId]
  );

  // Manual refresh function
  const refreshValveCounts = useCallback(async () => {
    if (!organizationId) return;

    try {
      const response = await fetch(`/api/synoptics/nodes?organizationId=${organizationId}`);
      if (!response.ok) return;
      
      const nodes = await response.json();
      const valveNodes = nodes.filter((node: any) => node.nodeType === 'valve');

      // Fetch valve details to get gas types
      const valveDetailsPromises = valveNodes.map(async (node: any) => {
        try {
          const valveResponse = await fetch(`/api/synoptics/valves/${node.elementId}`);
          if (!valveResponse.ok) return null;
          const valve = await valveResponse.json();
          return { ...node, gasType: valve.gasType };
        } catch {
          return null;
        }
      });

      const valveNodesWithGas = (await Promise.all(valveDetailsPromises)).filter(Boolean);

      // Count valves and track gases per location
      const counts = new Map<string, number>();
      const gases = new Map<string, Set<GasType>>();

      valveNodesWithGas.forEach((node: any) => {
        const gasType = node.gasType as GasType;
        
        if (node.buildingId) {
          counts.set(node.buildingId, (counts.get(node.buildingId) || 0) + 1);
          if (!gases.has(node.buildingId)) gases.set(node.buildingId, new Set());
          gases.get(node.buildingId)!.add(gasType);
        }
        if (node.floorId) {
          counts.set(node.floorId, (counts.get(node.floorId) || 0) + 1);
          if (!gases.has(node.floorId)) gases.set(node.floorId, new Set());
          gases.get(node.floorId)!.add(gasType);
        }
        if (node.zoneId) {
          counts.set(node.zoneId, (counts.get(node.zoneId) || 0) + 1);
          if (!gases.has(node.zoneId)) gases.set(node.zoneId, new Set());
          gases.get(node.zoneId)!.add(gasType);
        }
      });

      // Convert Sets to Arrays
      const gasArrays = new Map<string, GasType[]>();
      gases.forEach((gasSet, locationId) => {
        gasArrays.set(locationId, Array.from(gasSet));
      });

      // Update state
      setValveCounts(counts);
      setLocationGases(gasArrays);
    } catch (error) {
      console.error('Failed to refresh valve counts:', error);
    }
  }, [organizationId]);

  return {
    locationValves,
    valveCounts,
    locationGases,
    loadingValves,
    isLoadingCounts,
    loadValvesForLocation,
    refreshValveCounts,
  };
}
