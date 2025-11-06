import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { deleteConnection } from '@/lib/db/synoptics-queries';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = params;

    await deleteConnection(connectionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
