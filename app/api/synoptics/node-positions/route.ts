import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createNodePosition } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const nodePositionSchema = z.object({
  nodeId: z.string().uuid(),
  layoutId: z.string().uuid(),
  xPosition: z.number(),
  yPosition: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = nodePositionSchema.parse(body);

    const position = await createNodePosition({
      nodeId: validatedData.nodeId,
      layoutId: validatedData.layoutId,
      xPosition: validatedData.xPosition.toString(),
      yPosition: validatedData.yPosition.toString(),
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
