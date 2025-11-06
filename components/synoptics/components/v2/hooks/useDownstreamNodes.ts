import { useMemo } from 'react';

interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

/**
 * Hook to calculate all downstream nodes from a selected node.
 * Uses BFS to traverse the graph and find all connected nodes downstream.
 */
export function useDownstreamNodes(
  connections: Connection[],
  selectedNodeId: string | null
): Set<string> {
  return useMemo(() => {
    const downstreamNodes = new Set<string>();
    
    if (!selectedNodeId) {
      return downstreamNodes;
    }

    // Build adjacency list for efficient graph traversal
    const adjacencyMap = new Map<string, string[]>();
    connections.forEach((conn) => {
      if (!adjacencyMap.has(conn.fromNodeId)) {
        adjacencyMap.set(conn.fromNodeId, []);
      }
      adjacencyMap.get(conn.fromNodeId)!.push(conn.toNodeId);
    });

    // BFS to find all downstream nodes
    const queue: string[] = [selectedNodeId];
    const visited = new Set<string>([selectedNodeId]);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const neighbors = adjacencyMap.get(currentNodeId) || [];

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          downstreamNodes.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return downstreamNodes;
  }, [connections, selectedNodeId]);
}
