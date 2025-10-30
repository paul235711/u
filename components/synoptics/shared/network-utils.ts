/**
 * Network analysis and validation utilities for gas distribution networks
 */

export interface NetworkNode {
  id: string;
  nodeType: 'source' | 'valve' | 'fitting';
  name: string;
  gasType: string;
  state?: string;
  outletCount?: number;
}

export interface NetworkConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  gasType: string;
  diameterMm?: string | null;
}

export interface NetworkStats {
  totalNodes: number;
  totalConnections: number;
  nodesByType: Record<string, number>;
  gasTypeDistribution: Record<string, number>;
  isolatedNodes: string[];
  avgConnectionsPerNode: number;
  networkDensity: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  affectedNodes: string[];
  affectedConnections?: string[];
}

/**
 * Calculate network statistics
 */
export function calculateNetworkStats(
  nodes: NetworkNode[],
  connections: NetworkConnection[]
): NetworkStats {
  const stats: NetworkStats = {
    totalNodes: nodes.length,
    totalConnections: connections.length,
    nodesByType: {},
    gasTypeDistribution: {},
    isolatedNodes: [],
    avgConnectionsPerNode: 0,
    networkDensity: 0,
  };

  // Count nodes by type
  nodes.forEach((node) => {
    stats.nodesByType[node.nodeType] = (stats.nodesByType[node.nodeType] || 0) + 1;
    stats.gasTypeDistribution[node.gasType] = (stats.gasTypeDistribution[node.gasType] || 0) + 1;
  });

  // Find isolated nodes
  const connectedNodeIds = new Set<string>();
  connections.forEach((conn) => {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  });

  stats.isolatedNodes = nodes
    .filter((node) => !connectedNodeIds.has(node.id))
    .map((node) => node.id);

  // Calculate averages
  if (nodes.length > 0) {
    stats.avgConnectionsPerNode = (connections.length * 2) / nodes.length;
  }

  // Calculate network density (actual connections / possible connections)
  const possibleConnections = nodes.length * (nodes.length - 1) / 2;
  if (possibleConnections > 0) {
    stats.networkDensity = connections.length / possibleConnections;
  }

  return stats;
}

/**
 * Validate network for issues
 */
export function validateNetwork(
  nodes: NetworkNode[],
  connections: NetworkConnection[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for isolated nodes
  const connectedNodeIds = new Set<string>();
  connections.forEach((conn) => {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  });

  const isolatedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id));
  if (isolatedNodes.length > 0) {
    issues.push({
      type: 'warning',
      message: `${isolatedNodes.length} isolated node(s) with no connections`,
      affectedNodes: isolatedNodes.map((n) => n.id),
    });
  }

  // Check for gas type mismatches in connections
  connections.forEach((conn) => {
    const fromNode = nodes.find((n) => n.id === conn.fromNodeId);
    const toNode = nodes.find((n) => n.id === conn.toNodeId);

    if (fromNode && toNode) {
      if (fromNode.gasType !== conn.gasType) {
        issues.push({
          type: 'error',
          message: `Connection gas type (${conn.gasType}) doesn't match source node (${fromNode.gasType})`,
          affectedNodes: [fromNode.id],
          affectedConnections: [conn.id],
        });
      }

      if (toNode.gasType !== conn.gasType) {
        issues.push({
          type: 'error',
          message: `Connection gas type (${conn.gasType}) doesn't match target node (${toNode.gasType})`,
          affectedNodes: [toNode.id],
          affectedConnections: [conn.id],
        });
      }
    }
  });

  // Check for nodes without names
  const unnamedNodes = nodes.filter((node) => !node.name || node.name.trim() === '');
  if (unnamedNodes.length > 0) {
    issues.push({
      type: 'info',
      message: `${unnamedNodes.length} node(s) without names`,
      affectedNodes: unnamedNodes.map((n) => n.id),
    });
  }

  // Check for duplicate connections
  const connectionPairs = new Map<string, string[]>();
  connections.forEach((conn) => {
    const pairKey = [conn.fromNodeId, conn.toNodeId].sort().join('-');
    if (!connectionPairs.has(pairKey)) {
      connectionPairs.set(pairKey, []);
    }
    connectionPairs.get(pairKey)!.push(conn.id);
  });

  connectionPairs.forEach((connIds, pairKey) => {
    if (connIds.length > 1) {
      const [nodeId1, nodeId2] = pairKey.split('-');
      issues.push({
        type: 'warning',
        message: `Duplicate connections between same nodes`,
        affectedNodes: [nodeId1, nodeId2],
        affectedConnections: connIds,
      });
    }
  });

  // Check for missing diameters
  const connectionsWithoutDiameter = connections.filter((conn) => !conn.diameterMm);
  if (connectionsWithoutDiameter.length > 0) {
    issues.push({
      type: 'info',
      message: `${connectionsWithoutDiameter.length} connection(s) without diameter specified`,
      affectedNodes: [],
      affectedConnections: connectionsWithoutDiameter.map((c) => c.id),
    });
  }

  return issues;
}

/**
 * Find shortest path between two nodes
 */
export function findShortestPath(
  startNodeId: string,
  endNodeId: string,
  connections: NetworkConnection[]
): string[] | null {
  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  connections.forEach((conn) => {
    if (!adjacency.has(conn.fromNodeId)) adjacency.set(conn.fromNodeId, []);
    if (!adjacency.has(conn.toNodeId)) adjacency.set(conn.toNodeId, []);
    adjacency.get(conn.fromNodeId)!.push(conn.toNodeId);
    adjacency.get(conn.toNodeId)!.push(conn.fromNodeId); // Bidirectional
  });

  // BFS to find shortest path
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: startNodeId, path: [startNodeId] },
  ];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;

    if (nodeId === endNodeId) {
      return path;
    }

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ nodeId: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null; // No path found
}

/**
 * Group nodes by gas type
 */
export function groupNodesByGasType(nodes: NetworkNode[]): Map<string, NetworkNode[]> {
  const groups = new Map<string, NetworkNode[]>();
  nodes.forEach((node) => {
    if (!groups.has(node.gasType)) {
      groups.set(node.gasType, []);
    }
    groups.get(node.gasType)!.push(node);
  });
  return groups;
}

/**
 * Filter connections by gas type
 */
export function filterConnectionsByGasType(
  connections: NetworkConnection[],
  gasType: string
): NetworkConnection[] {
  return connections.filter((conn) => conn.gasType === gasType);
}

/**
 * Get connected nodes for a given node
 */
export function getConnectedNodes(
  nodeId: string,
  connections: NetworkConnection[]
): { incoming: string[]; outgoing: string[] } {
  const incoming: string[] = [];
  const outgoing: string[] = [];

  connections.forEach((conn) => {
    if (conn.toNodeId === nodeId) {
      incoming.push(conn.fromNodeId);
    }
    if (conn.fromNodeId === nodeId) {
      outgoing.push(conn.toNodeId);
    }
  });

  return { incoming, outgoing };
}

/**
 * Calculate node importance (based on connections)
 */
export function calculateNodeImportance(
  nodeId: string,
  connections: NetworkConnection[]
): number {
  const { incoming, outgoing } = getConnectedNodes(nodeId, connections);
  return incoming.length + outgoing.length;
}

/**
 * Find all nodes downstream from a source
 */
export function findDownstreamNodes(
  sourceNodeId: string,
  connections: NetworkConnection[]
): Set<string> {
  const downstream = new Set<string>();
  const queue = [sourceNodeId];
  const visited = new Set<string>([sourceNodeId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const { outgoing } = getConnectedNodes(currentId, connections);

    outgoing.forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        downstream.add(nodeId);
        queue.push(nodeId);
      }
    });
  }

  return downstream;
}
