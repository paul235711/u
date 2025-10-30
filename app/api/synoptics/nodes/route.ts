import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createNode, getNodesWithElementDataByOrganizationId } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const nodeSchema = z.object({
  organizationId: z.string().uuid(),
  nodeType: z.enum(['source', 'valve', 'fitting']),
  elementId: z.string().uuid(),
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  zoneId: z.string().uuid().optional().nullable(),
  zPosition: z.string().optional(),
  outletCount: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const siteId = searchParams.get('siteId');
    const buildingId = searchParams.get('buildingId');
    const floorId = searchParams.get('floorId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    let nodes = await getNodesWithElementDataByOrganizationId(organizationId);
    
    // Apply hierarchical filters if provided
    if (siteId) {
      // Fetch site buildings to filter nodes
      const { getSiteWithHierarchy } = await import('@/lib/db/synoptics-queries');
      const siteData = await getSiteWithHierarchy(siteId);
      
      if (siteData) {
        const siteBuildingIds = new Set(
          siteData.buildings?.map((b: any) => b.id) || []
        );
        const siteFloorIds = new Set(
          siteData.buildings?.flatMap((b: any) => 
            b.floors?.map((f: any) => f.id) || []
          ) || []
        );
        
        nodes = nodes.filter((node: any) => {
          if (!node.buildingId && !node.floorId) return true; // Include unassigned
          if (node.buildingId && siteBuildingIds.has(node.buildingId)) return true;
          if (node.floorId && siteFloorIds.has(node.floorId)) return true;
          return false;
        });
      }
    } else if (buildingId) {
      nodes = nodes.filter((node: any) => node.buildingId === buildingId || !node.buildingId);
    } else if (floorId) {
      nodes = nodes.filter((node: any) => node.floorId === floorId || !node.floorId);
    }

    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = nodeSchema.parse(body);

    const node = await createNode(validatedData);

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
