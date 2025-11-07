import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { updateNodePosition } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const updatePositionSchema = z.object({
  nodeId: z.string().uuid(),
  layoutId: z.string().uuid(),
  xPosition: z.number(),
  yPosition: z.number(),
  rotation: z.number().int().min(0).max(360).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePositionSchema.parse(body);

    // Try to update first
    let position = await updateNodePosition(
      validatedData.nodeId,
      validatedData.layoutId,
      {
        xPosition: validatedData.xPosition.toString(),
        yPosition: validatedData.yPosition.toString(),
        ...(validatedData.rotation !== undefined && { rotation: validatedData.rotation }),
      }
    );

    // If position doesn't exist, create it (upsert behavior)
    if (!position) {
      console.log('Position not found, creating new position for node:', validatedData.nodeId);
      const { createNodePosition } = await import('@/lib/db/synoptics-queries');
      position = await createNodePosition({
        nodeId: validatedData.nodeId,
        layoutId: validatedData.layoutId,
        xPosition: validatedData.xPosition.toString(),
        yPosition: validatedData.yPosition.toString(),
        rotation: validatedData.rotation ?? 0,
      });
    }

    return NextResponse.json(position);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating node position:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
