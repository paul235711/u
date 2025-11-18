import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getZoneById, updateZone } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const updateZoneSchema = z.object({
  floorId: z.string().uuid(),
  name: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = params;

    if (!zoneId) {
      return NextResponse.json(
        { error: 'zoneId is required' },
        { status: 400 }
      );
    }

    const zone = await getZoneById(zoneId);

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Error fetching zone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = params;

    if (!zoneId) {
      return NextResponse.json(
        { error: 'zoneId is required' },
        { status: 400 }
      );
    }

    const existing = await getZoneById(zoneId);

    if (!existing) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateZoneSchema.parse(body);

    const updated = await updateZone(zoneId, validatedData);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
