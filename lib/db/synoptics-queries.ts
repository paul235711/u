import { db } from './drizzle';
import { eq, and, or, desc } from 'drizzle-orm';
import {
  organizations,
  sites,
  buildings,
  floors,
  zones,
  sources,
  valves,
  fittings,
  layouts,
  nodes,
  nodePositions,
  connections,
  media,
  type NewOrganization,
  type NewSite,
  type NewBuilding,
  type NewFloor,
  type NewZone,
  type NewSource,
  type NewValve,
  type NewFitting,
  type NewLayout,
  type NewNode,
  type NewNodePosition,
  type NewConnection,
  type NewMedia,
} from './schema';

// =====================================================
// ORGANIZATION QUERIES
// =====================================================

export async function getOrganizationByTeamId(teamId: number) {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.teamId, teamId))
    .limit(1);
  return result[0];
}

export async function createOrganization(data: NewOrganization) {
  const result = await db.insert(organizations).values(data).returning();
  return result[0];
}

// =====================================================
// SITE QUERIES
// =====================================================

export async function getSitesByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(sites)
    .where(eq(sites.organizationId, organizationId))
    .orderBy(desc(sites.createdAt));
}

export async function getSiteById(siteId: string) {
  const result = await db
    .select()
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);
  return result[0];
}

export async function createSite(data: NewSite) {
  const result = await db.insert(sites).values(data).returning();
  return result[0];
}

export async function updateSite(siteId: string, data: Partial<NewSite>) {
  const result = await db
    .update(sites)
    .set(data)
    .where(eq(sites.id, siteId))
    .returning();
  return result[0];
}

export async function deleteSite(siteId: string) {
  await db.delete(sites).where(eq(sites.id, siteId));
}

// =====================================================
// BUILDING QUERIES
// =====================================================

export async function getBuildingsBySiteId(siteId: string) {
  return db
    .select()
    .from(buildings)
    .where(eq(buildings.siteId, siteId))
    .orderBy(desc(buildings.createdAt));
}

export async function getBuildingById(buildingId: string) {
  const result = await db
    .select()
    .from(buildings)
    .where(eq(buildings.id, buildingId))
    .limit(1);
  return result[0];
}

export async function createBuilding(data: NewBuilding) {
  const result = await db.insert(buildings).values(data).returning();
  return result[0];
}

export async function updateBuilding(buildingId: string, data: Partial<NewBuilding>) {
  const result = await db
    .update(buildings)
    .set(data)
    .where(eq(buildings.id, buildingId))
    .returning();
  return result[0];
}

export async function deleteBuilding(buildingId: string) {
  await db.delete(buildings).where(eq(buildings.id, buildingId));
}

// =====================================================
// FLOOR QUERIES
// =====================================================

export async function getFloorsByBuildingId(buildingId: string) {
  return db
    .select()
    .from(floors)
    .where(eq(floors.buildingId, buildingId))
    .orderBy(floors.floorNumber);
}

export async function getFloorById(floorId: string) {
  const result = await db
    .select()
    .from(floors)
    .where(eq(floors.id, floorId))
    .limit(1);
  return result[0];
}

export async function createFloor(data: NewFloor) {
  const result = await db.insert(floors).values(data).returning();
  return result[0];
}

export async function updateFloor(floorId: string, data: Partial<NewFloor>) {
  const result = await db
    .update(floors)
    .set(data)
    .where(eq(floors.id, floorId))
    .returning();
  return result[0];
}

export async function deleteFloor(floorId: string) {
  await db.delete(floors).where(eq(floors.id, floorId));
}

// =====================================================
// ZONE QUERIES
// =====================================================

export async function getZonesByFloorId(floorId: string) {
  return db
    .select()
    .from(zones)
    .where(eq(zones.floorId, floorId))
    .orderBy(zones.name);
}

export async function getZoneById(zoneId: string) {
  const result = await db
    .select()
    .from(zones)
    .where(eq(zones.id, zoneId))
    .limit(1);
  return result[0];
}

export async function createZone(data: NewZone) {
  const result = await db.insert(zones).values(data).returning();
  return result[0];
}

export async function updateZone(zoneId: string, data: Partial<NewZone>) {
  const result = await db
    .update(zones)
    .set(data)
    .where(eq(zones.id, zoneId))
    .returning();
  return result[0];
}

export async function deleteZone(zoneId: string) {
  await db.delete(zones).where(eq(zones.id, zoneId));
}

// =====================================================
// SOURCE QUERIES
// =====================================================

export async function getSourcesByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(sources)
    .where(eq(sources.organizationId, organizationId))
    .orderBy(desc(sources.createdAt));
}

export async function getSourceById(sourceId: string) {
  const result = await db
    .select()
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);
  return result[0];
}

export async function createSource(data: NewSource) {
  const result = await db.insert(sources).values(data).returning();
  return result[0];
}

export async function updateSource(sourceId: string, data: Partial<NewSource>) {
  const result = await db
    .update(sources)
    .set(data)
    .where(eq(sources.id, sourceId))
    .returning();
  return result[0];
}

export async function deleteSource(sourceId: string) {
  await db.delete(sources).where(eq(sources.id, sourceId));
}

// =====================================================
// VALVE QUERIES
// =====================================================

export async function getValvesByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(valves)
    .where(eq(valves.organizationId, organizationId))
    .orderBy(desc(valves.createdAt));
}

export async function getValveById(valveId: string) {
  const result = await db
    .select()
    .from(valves)
    .where(eq(valves.id, valveId))
    .limit(1);
  return result[0];
}

export async function createValve(data: NewValve) {
  const result = await db.insert(valves).values(data).returning();
  return result[0];
}

export async function updateValve(valveId: string, data: Partial<NewValve>) {
  const result = await db
    .update(valves)
    .set(data)
    .where(eq(valves.id, valveId))
    .returning();
  return result[0];
}

export async function deleteValve(valveId: string) {
  await db.delete(valves).where(eq(valves.id, valveId));
}

// =====================================================
// FITTING QUERIES
// =====================================================

export async function getFittingsByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(fittings)
    .where(eq(fittings.organizationId, organizationId))
    .orderBy(desc(fittings.createdAt));
}

export async function getFittingById(fittingId: string) {
  const result = await db
    .select()
    .from(fittings)
    .where(eq(fittings.id, fittingId))
    .limit(1);
  return result[0];
}

export async function createFitting(data: NewFitting) {
  const result = await db.insert(fittings).values(data).returning();
  return result[0];
}

export async function updateFitting(fittingId: string, data: Partial<NewFitting>) {
  const result = await db
    .update(fittings)
    .set(data)
    .where(eq(fittings.id, fittingId))
    .returning();
  return result[0];
}

export async function deleteFitting(fittingId: string) {
  await db.delete(fittings).where(eq(fittings.id, fittingId));
}

// =====================================================
// LAYOUT QUERIES
// =====================================================

export async function getLayoutsByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(layouts)
    .where(eq(layouts.organizationId, organizationId))
    .orderBy(desc(layouts.createdAt));
}

export async function getLayoutsBySiteId(siteId: string) {
  return db
    .select()
    .from(layouts)
    .where(eq(layouts.siteId, siteId))
    .orderBy(desc(layouts.createdAt));
}

export async function getLayoutsByFloorId(floorId: string) {
  return db
    .select()
    .from(layouts)
    .where(eq(layouts.floorId, floorId))
    .orderBy(desc(layouts.createdAt));
}

export async function getLayoutById(layoutId: string) {
  const result = await db
    .select()
    .from(layouts)
    .where(eq(layouts.id, layoutId))
    .limit(1);
  return result[0];
}

export async function createLayout(data: NewLayout) {
  const result = await db.insert(layouts).values(data).returning();
  return result[0];
}

export async function updateLayout(layoutId: string, data: Partial<NewLayout>) {
  const result = await db
    .update(layouts)
    .set(data)
    .where(eq(layouts.id, layoutId))
    .returning();
  return result[0];
}

export async function deleteLayout(layoutId: string) {
  await db.delete(layouts).where(eq(layouts.id, layoutId));
}

// =====================================================
// NODE QUERIES
// =====================================================

export async function getNodesByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(nodes)
    .where(eq(nodes.organizationId, organizationId))
    .orderBy(desc(nodes.createdAt));
}

export async function getNodeById(nodeId: string) {
  const result = await db
    .select()
    .from(nodes)
    .where(eq(nodes.id, nodeId))
    .limit(1);
  return result[0];
}

export async function createNode(data: NewNode) {
  const result = await db.insert(nodes).values(data).returning();
  return result[0];
}

export async function updateNode(nodeId: string, data: Partial<NewNode>) {
  const result = await db
    .update(nodes)
    .set(data)
    .where(eq(nodes.id, nodeId))
    .returning();
  return result[0];
}

export async function deleteNode(nodeId: string) {
  await db.delete(nodes).where(eq(nodes.id, nodeId));
}

// =====================================================
// NODE POSITION QUERIES
// =====================================================

export async function getNodePositionsByLayoutId(layoutId: string) {
  return db
    .select()
    .from(nodePositions)
    .where(eq(nodePositions.layoutId, layoutId));
}

export async function getNodePosition(nodeId: string, layoutId: string) {
  const result = await db
    .select()
    .from(nodePositions)
    .where(
      and(
        eq(nodePositions.nodeId, nodeId),
        eq(nodePositions.layoutId, layoutId)
      )
    )
    .limit(1);
  return result[0];
}

export async function createNodePosition(data: NewNodePosition) {
  const result = await db.insert(nodePositions).values(data).returning();
  return result[0];
}

export async function updateNodePosition(
  nodeId: string,
  layoutId: string,
  data: Partial<NewNodePosition>
) {
  const result = await db
    .update(nodePositions)
    .set(data)
    .where(
      and(
        eq(nodePositions.nodeId, nodeId),
        eq(nodePositions.layoutId, layoutId)
      )
    )
    .returning();
  return result[0];
}

export async function deleteNodePosition(nodeId: string, layoutId: string) {
  await db
    .delete(nodePositions)
    .where(
      and(
        eq(nodePositions.nodeId, nodeId),
        eq(nodePositions.layoutId, layoutId)
      )
    );
}

// =====================================================
// CONNECTION QUERIES
// =====================================================

export async function getConnectionsByOrganizationId(organizationId: string) {
  return db
    .select()
    .from(connections)
    .where(eq(connections.organizationId, organizationId))
    .orderBy(desc(connections.createdAt));
}

export async function getConnectionById(connectionId: string) {
  const result = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1);
  return result[0];
}

export async function getConnectionsByNodeId(nodeId: string) {
  return db
    .select()
    .from(connections)
    .where(
      or(
        eq(connections.fromNodeId, nodeId),
        eq(connections.toNodeId, nodeId)
      )
    );
}

export async function createConnection(data: NewConnection) {
  const result = await db.insert(connections).values(data).returning();
  return result[0];
}

export async function updateConnection(
  connectionId: string,
  data: Partial<NewConnection>
) {
  const result = await db
    .update(connections)
    .set(data)
    .where(eq(connections.id, connectionId))
    .returning();
  return result[0];
}

export async function deleteConnection(connectionId: string) {
  await db.delete(connections).where(eq(connections.id, connectionId));
}

// =====================================================
// MEDIA QUERIES
// =====================================================

export async function getMediaByElement(elementId: string, elementType: string) {
  return db
    .select()
    .from(media)
    .where(
      and(
        eq(media.elementId, elementId),
        eq(media.elementType, elementType)
      )
    )
    .orderBy(desc(media.createdAt));
}

export async function getMediaById(mediaId: string) {
  const result = await db
    .select()
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);
  return result[0];
}

export async function createMedia(data: NewMedia) {
  const result = await db.insert(media).values(data).returning();
  return result[0];
}

export async function updateMedia(mediaId: string, data: Partial<NewMedia>) {
  const result = await db
    .update(media)
    .set(data)
    .where(eq(media.id, mediaId))
    .returning();
  return result[0];
}

export async function deleteMedia(mediaId: string) {
  await db.delete(media).where(eq(media.id, mediaId));
}

// =====================================================
// COMPLEX QUERIES FOR SYNOPTICS
// =====================================================

export async function getSiteWithHierarchy(siteId: string) {
  const site = await getSiteById(siteId);
  if (!site) return null;

  const buildingsData = await getBuildingsBySiteId(siteId);
  
  const buildingsWithFloors = await Promise.all(
    buildingsData.map(async (building: any) => {
      const floorsData = await getFloorsByBuildingId(building.id);
      const floorsWithZones = await Promise.all(
        floorsData.map(async (floor: any) => {
          const zonesData = await getZonesByFloorId(floor.id);
          return { ...floor, zones: zonesData };
        })
      );
      return { ...building, floors: floorsWithZones };
    })
  );

  return {
    ...site,
    buildings: buildingsWithFloors,
  };
}

// Helper function to get node with element data
export async function getNodeWithElementData(nodeId: string) {
  const node = await getNodeById(nodeId);
  if (!node) return null;

  // Fetch the actual element data based on node type
  let elementData = null;
  if (node.nodeType === 'source') {
    elementData = await getSourceById(node.elementId);
  } else if (node.nodeType === 'valve') {
    elementData = await getValveById(node.elementId);
  } else if (node.nodeType === 'fitting') {
    elementData = await getFittingById(node.elementId);
  }

  return {
    ...node,
    ...elementData, // Merge element data (name, gasType, etc.)
    id: node.id, // Preserve the actual node ID (don't let element ID overwrite it)
    elementId: node.elementId, // Keep element ID separate
  };
}

export async function getNodesWithElementDataByOrganizationId(organizationId: string) {
  const nodes = await getNodesByOrganizationId(organizationId);
  
  const nodesWithData = await Promise.all(
    nodes.map(async (node: any) => {
      return await getNodeWithElementData(node.id);
    })
  );
  
  return nodesWithData.filter((node: any) => node !== null);
}

export async function getLayoutWithNodesAndConnections(layoutId: string) {
  const layout = await getLayoutById(layoutId);
  if (!layout) return null;

  const positions = await getNodePositionsByLayoutId(layoutId);
  console.log('🔍 Positions found for layout:', layoutId, positions);
  const nodeIds = positions.map((p: any) => p.nodeId);

  // Create a Map for O(1) position lookup by nodeId
  const positionMap = new Map(
    positions.map((p: any) => [p.nodeId, p])
  );

  // Get all nodes with their element data
  const nodesData = await Promise.all(
    nodeIds.map(async (nodeId: any) => {
      return await getNodeWithElementData(nodeId);
    })
  );

  // Filter to valid nodes and create nodeId set for connection filtering
  const validNodes = nodesData.filter((node: any) => node !== null);
  const nodeIdSet = new Set(validNodes.map((n: any) => n.id));

  // Get all connections for the organization
  const allConnections = await db
    .select()
    .from(connections)
    .where(eq(connections.organizationId, layout.organizationId));

  // Filter connections to only include those between nodes in THIS layout
  const connectionsData = allConnections.filter(
    (conn: any) => nodeIdSet.has(conn.fromNodeId) && nodeIdSet.has(conn.toNodeId)
  );

  const result = {
    ...layout,
    nodes: validNodes.map((node: any) => {
      const positionData = positionMap.get(node.id);
      const finalNode = {
        ...node,
        position: positionData ? {
          xPosition: positionData.xPosition,
          yPosition: positionData.yPosition,
        } : {
          xPosition: '0',
          yPosition: '0',
        },
      };
      console.log('🔍 Final node data:', {
        id: node.id,
        name: node.name,
        nodeType: node.nodeType,
        position: finalNode.position,
        positionData
      });
      return finalNode;
    }),
    connections: connectionsData,
  };
  
  console.log('🔍 Final layout result:', {
    layoutId,
    nodeCount: result.nodes.length,
    connectionCount: result.connections.length
  });
  
  return result;
}
