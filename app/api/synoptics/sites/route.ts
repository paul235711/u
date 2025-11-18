import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createSite, getSitesByOrganizationId, getOrganizationById } from '@/lib/db/synoptics-queries';
import { syncTeamSubscriptionQuantity } from '@/lib/payments/stripe';
import { z } from 'zod';

const siteSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const sites = await getSitesByOrganizationId(organizationId);

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
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
    const validatedData = siteSchema.parse(body);

    const site = await createSite(validatedData);

    const organization = await getOrganizationById(validatedData.organizationId);
    if (organization?.teamId) {
      await syncTeamSubscriptionQuantity(organization.teamId);
    }

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
