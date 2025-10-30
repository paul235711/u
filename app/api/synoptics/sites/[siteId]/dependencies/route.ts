import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { 
  getBuildingsBySiteId, 
  getLayoutsBySiteId,
} from '@/lib/db/synoptics-queries';
import { db } from '@/lib/db/drizzle';
import { floors, nodes } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const user = await getUser();
    const { siteId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get buildings for this site
    const buildings = await getBuildingsBySiteId(siteId);
    const buildingIds = buildings.map(b => b.id);

    // Get floors for these buildings
    let floorsCount = 0;
    if (buildingIds.length > 0) {
      const floorsData = await db
        .select()
        .from(floors)
        .where(inArray(floors.buildingId, buildingIds));
      floorsCount = floorsData.length;
    }

    // Get layouts for this site
    const layouts = await getLayoutsBySiteId(siteId);

    // Get nodes assigned to buildings/floors of this site
    let nodesCount = 0;
    if (buildingIds.length > 0) {
      const nodesData = await db
        .select()
        .from(nodes)
        .where(inArray(nodes.buildingId, buildingIds));
      nodesCount = nodesData.length;
    }

    const dependencies = {
      buildings: buildings.length,
      floors: floorsCount,
      layouts: layouts.length,
      nodes: nodesCount,
      totalItems: buildings.length + floorsCount + layouts.length + nodesCount,
    };

    return NextResponse.json(dependencies);
  } catch (error) {
    console.error('Error checking site dependencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
