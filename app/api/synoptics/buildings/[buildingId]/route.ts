import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getBuildingById, updateBuilding } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const updateBuildingSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { buildingId: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buildingId } = params;

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId is required' },
        { status: 400 }
      );
    }

    const existing = await getBuildingById(buildingId);

    if (!existing) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateBuildingSchema.parse(body);

    const updated = await updateBuilding(buildingId, validatedData);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating building:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
