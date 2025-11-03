import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createFitting } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const fittingSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().optional().nullable(),
  fittingType: z.string().min(1),
  gasType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = fittingSchema.parse(body);

    const fitting = await createFitting(validatedData);

    return NextResponse.json(fitting, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating fitting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
