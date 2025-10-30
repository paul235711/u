import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getValveById, updateValve, deleteValve } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  valveType: z.string().min(1).optional(),
  gasType: z.string().min(1).optional(),
  state: z.enum(['open', 'closed']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ valveId: string }> }
) {
  try {
    const user = await getUser();
    const { valveId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const valve = await getValveById(valveId);

    if (!valve) {
      return NextResponse.json({ error: 'Valve not found' }, { status: 404 });
    }

    return NextResponse.json(valve);
  } catch (error) {
    console.error('Error fetching valve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ valveId: string }> }
) {
  try {
    const user = await getUser();
    const { valveId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const valve = await updateValve(valveId, validatedData);

    return NextResponse.json(valve);
  } catch (error) {
    console.error('Error updating valve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ valveId: string }> }
) {
  try {
    const user = await getUser();
    const { valveId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteValve(valveId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting valve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
