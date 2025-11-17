import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createLayout, getLayoutsBySiteId } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const layoutSchema = z.object({
  siteId: z.string().uuid(),
  floorId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  layoutType: z.enum(['site', 'floor', 'zone']),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId query parameter is required' },
        { status: 400 }
      );
    }

    const layouts = await getLayoutsBySiteId(siteId);
    return NextResponse.json(layouts);
  } catch (error) {
    console.error('Error fetching layouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = layoutSchema.parse(body);

    const layout = await createLayout(validatedData);

    return NextResponse.json(layout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating layout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
