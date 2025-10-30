import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getFittingById, updateFitting, deleteFitting } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().optional().nullable(),
  fittingType: z.string().min(1).optional(),
  gasType: z.string().min(1).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fittingId: string }> }
) {
  try {
    const user = await getUser();
    const { fittingId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fitting = await getFittingById(fittingId);

    if (!fitting) {
      return NextResponse.json({ error: 'Fitting not found' }, { status: 404 });
    }

    return NextResponse.json(fitting);
  } catch (error) {
    console.error('Error fetching fitting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fittingId: string }> }
) {
  try {
    const user = await getUser();
    const { fittingId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const fitting = await updateFitting(fittingId, validatedData);

    return NextResponse.json(fitting);
  } catch (error) {
    console.error('Error updating fitting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fittingId: string }> }
) {
  try {
    const user = await getUser();
    const { fittingId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteFitting(fittingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fitting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
