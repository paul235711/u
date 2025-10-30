import { NextRequest, NextResponse } from 'next/server';
import { createZone, getZonesByFloorId } from '@/lib/db/synoptics-queries';

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
