import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getFloorById } from '@/lib/db/synoptics-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { floorId: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { floorId } = params;

    if (!floorId) {
      return NextResponse.json(
        { error: 'floorId is required' },
        { status: 400 }
      );
    }

    const floor = await getFloorById(floorId);

    if (!floor) {
      return NextResponse.json(
        { error: 'Floor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(floor);
  } catch (error) {
    console.error('Error fetching floor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
