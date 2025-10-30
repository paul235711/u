import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { deleteNode } from '@/lib/db/synoptics-queries';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const user = await getUser();
    const { nodeId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteNode(nodeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
