import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import {
  getOrganizationByTeamId,
  createOrganization,
  getSitesByOrganizationId,
} from '@/lib/db/synoptics-queries';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ siteId: null });
    }

    let organization = await getOrganizationByTeamId(team.id);
    if (!organization) {
      organization = await createOrganization({
        teamId: team.id,
        name: team.name,
      });
    }

    const sites = await getSitesByOrganizationId(organization.id);
    const siteId = sites.length === 1 ? sites[0].id : null;

    return NextResponse.json({ siteId });
  } catch (error) {
    console.error('Error resolving default site:', error);
    return NextResponse.json({ siteId: null }, { status: 500 });
  }
}
