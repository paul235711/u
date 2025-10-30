/**
 * Utilities for managing node creation context (hierarchy assignments)
 * Ensures nodes are properly associated with their site/building/floor/zone hierarchy
 */

interface LayoutContext {
  siteId?: string | null;
  floorId?: string | null;
}

interface NodeContext {
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
}

/**
 * Infers the full hierarchy context for a node based on layout information
 * @param layoutContext - The layout's site and floor information
 * @returns Promise<NodeContext> - The complete node hierarchy context
 */
export async function inferNodeContext(layoutContext: LayoutContext): Promise<NodeContext> {
  const context: NodeContext = {};

  // If layout is floor-specific, inherit floor and infer building
  if (layoutContext.floorId) {
    context.floorId = layoutContext.floorId;
    
    try {
      const floorRes = await fetch(`/api/synoptics/floors/${layoutContext.floorId}`);
      if (floorRes.ok) {
        const floorData = await floorRes.json();
        if (floorData.buildingId) {
          context.buildingId = floorData.buildingId;
        }
      }
    } catch (err) {
      console.warn('Could not fetch floor data for buildingId inference:', err);
    }
  }

  return context;
}

/**
 * Merges node context with base node payload
 * @param basePayload - The base node creation payload
 * @param context - The hierarchy context to merge
 * @returns Combined payload with hierarchy context
 */
export function mergeNodeContext<T extends Record<string, any>>(
  basePayload: T,
  context: NodeContext
): T & NodeContext {
  return {
    ...basePayload,
    ...context,
  };
}

/**
 * Validates that a node's context is appropriate for a given layout
 * @param nodeContext - The node's hierarchy context
 * @param layoutContext - The layout's context
 * @returns boolean - Whether the node belongs in this layout
 */
export function validateNodeLayoutContext(
  nodeContext: NodeContext,
  layoutContext: LayoutContext
): boolean {
  // If layout is floor-specific, node must be on that floor or unassigned
  if (layoutContext.floorId) {
    return !nodeContext.floorId || nodeContext.floorId === layoutContext.floorId;
  }

  // For site-level layouts, all nodes from that site are valid
  return true;
}
