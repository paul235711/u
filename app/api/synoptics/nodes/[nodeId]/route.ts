import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { deleteNode, updateNode } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const updateNodeSchema = z.object({
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  zoneId: z.string().uuid().optional().nullable(),
  zPosition: z.string().optional(),
  outletCount: z.number().int().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const user = await getUser();
    const { nodeId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import getNodeWithElementData here to avoid circular imports
    const { getNodeWithElementData } = await import('@/lib/db/synoptics-queries');
    const node = await getNodeWithElementData(nodeId);

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    return NextResponse.json(node);
  } catch (error) {
    console.error('Error fetching node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const user = await getUser();
    const { nodeId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateNodeSchema.parse(body);
    
    // Convert latitude/longitude to strings for database storage
    const updateData = {
      ...validatedData,
      latitude: validatedData.latitude !== undefined ? validatedData.latitude.toString() : undefined,
      longitude: validatedData.longitude !== undefined ? validatedData.longitude.toString() : undefined,
    };

    const node = await updateNode(nodeId, updateData);

    return NextResponse.json(node);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
