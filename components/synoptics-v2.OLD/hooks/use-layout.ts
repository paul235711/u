/**
 * React Query hooks for layout data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

/**
 * Fetch layout data with automatic caching
 */
export function useLayout(layoutId: string) {
  return useQuery({
    queryKey: ['layout', layoutId],
    queryFn: () => apiClient.getLayout(layoutId),
    enabled: !!layoutId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Update node position with optimistic updates
 */
export function useUpdateNodePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      nodeId,
      layoutId,
      position,
    }: {
      nodeId: string;
      layoutId: string;
      position: { x: number; y: number };
    }) => {
      return apiClient.updateNodePosition(nodeId, layoutId, position);
    },

    // Optimistic update
    onMutate: async ({ nodeId, layoutId, position }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['layout', layoutId] });

      // Snapshot previous value
      const previousLayout = queryClient.getQueryData(['layout', layoutId]);

      // Optimistically update
      queryClient.setQueryData(['layout', layoutId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          nodes: old.nodes.map((node: any) =>
            node.id === nodeId
              ? {
                  ...node,
                  position: {
                    xPosition: position.x,
                    yPosition: position.y,
                  },
                }
              : node
          ),
        };
      });

      return { previousLayout };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousLayout) {
        queryClient.setQueryData(
          ['layout', variables.layoutId],
          context.previousLayout
        );
      }
      console.error('Failed to update node position:', err);
    },

    // Refetch on success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layout', variables.layoutId] });
    },
  });
}
