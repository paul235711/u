import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createValve } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const valveSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  valveType: z.string().min(1),
  gasType: z.string().min(1),
  state: z.enum(['open', 'closed']).default('open'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = valveSchema.parse(body);

    const valve = await createValve(validatedData);

    return NextResponse.json(valve, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating valve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
