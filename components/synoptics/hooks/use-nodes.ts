/**
 * React Query hooks for node operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

/**
 * Create a new node
 */
export function useCreateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      siteId: string;
      nodeType: 'source' | 'valve' | 'fitting';
      elementId: string;
      outletCount: number;
      buildingId?: string;
      floorId?: string;
      zoneId?: string;
    }) => apiClient.createNode(data),

    onSuccess: (newNode, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      
      // If we know the layout, optimistically add the node
      // This would need the layoutId passed in variables
      console.log('Node created successfully:', newNode);
    },

    onError: (error) => {
      console.error('Failed to create node:', error);
    },
  });
}

/**
 * Update node properties
 */
export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateNode(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['layout'] });
    },

    onError: (error) => {
      console.error('Failed to update node:', error);
    },
  });
}

/**
 * Delete a node
 */
export function useDeleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => apiClient.deleteNode(nodeId),

    onSuccess: (_, nodeId) => {
      // Update cache to remove the node
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['layout'] });
      console.log('Node deleted:', nodeId);
    },

    onError: (error) => {
      console.error('Failed to delete node:', error);
    },
  });
}
