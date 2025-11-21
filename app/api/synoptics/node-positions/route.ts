import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createNodePosition } from '@/lib/db/synoptics-queries';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { nodePositions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const nodePositionSchema = z.object({
  nodeId: z.string().uuid(),
  layoutId: z.string().uuid(),
  x: z.number().optional(),
  y: z.number().optional(),
  xPosition: z.number().optional(),
  yPosition: z.number().optional(),
  rotation: z.number().int().min(0).max(360).optional(),
}).refine(data => {
  // At least one set of coordinates must be provided
  return (data.x !== undefined && data.y !== undefined) || 
         (data.xPosition !== undefined && data.yPosition !== undefined);
}, { message: 'Must provide either x/y or xPosition/yPosition' });

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const layoutId = searchParams.get('layoutId');

    if (!nodeId && !layoutId) {
      return NextResponse.json(
        { error: 'Must provide nodeId or layoutId' },
        { status: 400 }
      );
    }

    let positions;
    if (nodeId) {
      positions = await db
        .select()
        .from(nodePositions)
        .where(eq(nodePositions.nodeId, nodeId));
    } else if (layoutId) {
      positions = await db
        .select()
        .from(nodePositions)
        .where(eq(nodePositions.layoutId, layoutId));
    }

    // Deduplicate by (nodeId, layoutId) to avoid duplicate entries
    const deduped = Array.isArray(positions)
      ? Array.from(
          positions.reduce((map, pos: any) => {
            const key = `${pos.nodeId}-${pos.layoutId}`;
            if (!map.has(key)) {
              map.set(key, pos);
            }
            return map;
          }, new Map<string, any>()).values()
        )
      : [];

    return NextResponse.json(deduped);
  } catch (error) {
    console.error('Error fetching node positions:', error);
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
    const validatedData = nodePositionSchema.parse(body);

    // Support both x/y and xPosition/yPosition
    const x = validatedData.x ?? validatedData.xPosition ?? 0;
    const y = validatedData.y ?? validatedData.yPosition ?? 0;
    const rotation = validatedData.rotation ?? 0;

    const position = await createNodePosition({
      nodeId: validatedData.nodeId,
      layoutId: validatedData.layoutId,
      xPosition: x.toString(),
      yPosition: y.toString(),
      rotation,
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating node position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
