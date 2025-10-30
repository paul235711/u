import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getLayoutWithNodesAndConnections } from '@/lib/db/synoptics-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { layoutId } = await params;
    const layout = await getLayoutWithNodesAndConnections(layoutId);

    if (!layout) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
    }

    return NextResponse.json(layout);
  } catch (error) {
    console.error('Error fetching layout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}
