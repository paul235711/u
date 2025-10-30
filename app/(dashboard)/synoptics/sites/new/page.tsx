import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getOrganizationByTeamId } from '@/lib/db/synoptics-queries';
import { SiteForm } from '@/components/synoptics/forms/site-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default async function NewSitePage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    redirect('/dashboard');
  }

  let organization = await getOrganizationByTeamId(teamData.id);
  
  if (!organization) {
    const { createOrganization } = await import('@/lib/db/synoptics-queries');
    organization = await createOrganization({
      teamId: teamData.id,
      name: teamData.name,
    });
  }

  return (
    <div className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/synoptics" className="hover:text-gray-700">
            Sites
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">New Site</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Site</h1>
          <SiteForm organizationId={organization.id} />
        </div>
      </div>
    </div>
  );
}
