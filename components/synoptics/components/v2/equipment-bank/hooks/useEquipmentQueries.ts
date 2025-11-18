'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EquipmentDetailsRecord, EquipmentNode, EquipmentPosition } from '../types';

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export function useEquipmentList(siteId: string) {
  return useQuery<EquipmentNode[]>({
    queryKey: ['site-equipment', siteId],
    queryFn: () => fetchJson(`/api/synoptics/nodes?siteId=${siteId}`),
    enabled: !!siteId,
  });
}

export function useLayoutPositions(layoutId: string) {
  return useQuery<EquipmentPosition[]>({
    queryKey: ['layout-positions', layoutId],
    queryFn: () => fetchJson(`/api/synoptics/node-positions?layoutId=${layoutId}`),
    enabled: !!layoutId,
    select: (positions) => positions ?? [],
  });
}

interface UseEquipmentDetailsOptions {
  enabled: boolean;
}

export function useEquipmentDetails(nodes: EquipmentNode[], options: UseEquipmentDetailsOptions) {
  return useQuery<EquipmentDetailsRecord>({
    queryKey: ['equipment-details', nodes.map((node) => node.id)],
    enabled: options.enabled && nodes.length > 0,
    queryFn: async () => {
      const details: EquipmentDetailsRecord = {};

      await Promise.all(
        nodes.map(async (node) => {
          const baseEndpoint = (() => {
            switch (node.nodeType) {
              case 'valve':
                return `/api/synoptics/valves/${node.elementId}`;
              case 'source':
                return `/api/synoptics/sources/${node.elementId}`;
              case 'fitting':
                return `/api/synoptics/fittings/${node.elementId}`;
              default:
                return null;
            }
          })();

          if (!baseEndpoint) return;

          try {
            details[node.id] = await fetchJson(baseEndpoint);
          } catch (error) {
            console.error(`Failed to fetch details for ${node.id}:`, error);
          }
        })
      );

      return details;
    },
    staleTime: 30_000,
    initialData: {},
  });
}

export function useSelectedEquipment(nodeId: string | null, allNodes: EquipmentNode[]) {
  return useQuery({
    queryKey: ['selected-equipment', nodeId],
    enabled: !!nodeId,
    queryFn: async () => {
      if (!nodeId) return null;

      const node = allNodes.find((candidate) => candidate.id === nodeId);
      if (!node) return null;

      const detailsEndpoint = (() => {
        switch (node.nodeType) {
          case 'valve':
            return `/api/synoptics/valves/${node.elementId}`;
          case 'source':
            return `/api/synoptics/sources/${node.elementId}`;
          case 'fitting':
            return `/api/synoptics/fittings/${node.elementId}`;
          default:
            return null;
        }
      })();

      if (!detailsEndpoint) return node;

      try {
        const elementDetails = await fetchJson<Record<string, any>>(detailsEndpoint);
        return {
          ...node,
          ...elementDetails,
          // Ensure we keep the node identity consistent for updates
          id: node.id,
          elementId: node.elementId,
        };
      } catch (error) {
        console.error(`Failed to fetch selected equipment details for ${nodeId}:`, error);
        return node;
      }
    },
  });
}

export function useAvailableNodes(allNodes: EquipmentNode[], positions: EquipmentPosition[]) {
  return useMemo(() => {
    const positionedNodeIds = new Set(positions.map((position) => position.nodeId));
    return allNodes.filter((node) => !positionedNodeIds.has(node.id));
  }, [allNodes, positions]);
}
