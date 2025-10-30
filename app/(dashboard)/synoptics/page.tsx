import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { getOrganizationByTeamId } from '@/lib/db/synoptics-queries';
import { SitesManager } from '@/components/synoptics/sites';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

export default async function SynopticsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    redirect('/dashboard');
  }

  let organization = await getOrganizationByTeamId(teamData.id);
  
  // Create organization if it doesn't exist
  if (!organization) {
    const { createOrganization } = await import('@/lib/db/synoptics-queries');
    organization = await createOrganization({
      teamId: teamData.id,
      name: teamData.name,
    });
  }

  return <SitesManager organizationId={organization.id} />;
}
