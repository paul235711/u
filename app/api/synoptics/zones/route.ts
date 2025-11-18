import { NextRequest, NextResponse } from 'next/server';
import { createZone, getZonesByFloorId, deleteZone } from '@/lib/db/synoptics-queries';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const floorId = searchParams.get('floorId');

    if (!floorId) {
      return NextResponse.json(
        { error: 'floorId is required' },
        { status: 400 }
      );
    }

    const zones = await getZonesByFloorId(floorId);
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { floorId, name } = body;

    if (!floorId || !name) {
      return NextResponse.json(
        { error: 'floorId and name are required' },
        { status: 400 }
      );
    }

    const zone = await createZone({ floorId, name });
    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json(
        { error: 'zoneId is required' },
        { status: 400 }
      );
    }

    await deleteZone(zoneId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
