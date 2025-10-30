import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { nodePositions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const user = await getUser();
    const { positionId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // positionId format: "nodeId-layoutId"
    const [nodeId, layoutId] = positionId.split('-');
    
    if (!nodeId || !layoutId) {
      return NextResponse.json({ error: 'Invalid position ID format' }, { status: 400 });
    }

    await db
      .delete(nodePositions)
      .where(
        and(
          eq(nodePositions.nodeId, nodeId),
          eq(nodePositions.layoutId, layoutId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting node position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
