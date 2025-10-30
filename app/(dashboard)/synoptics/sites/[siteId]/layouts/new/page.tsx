import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getSiteById, getOrganizationByTeamId } from '@/lib/db/synoptics-queries';
import { LayoutForm } from '@/components/synoptics/forms/layout-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function NewLayoutPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const user = await getUser();
  const { siteId } = await params;

  if (!user) {
    redirect('/sign-in');
  }

  const site = await getSiteById(siteId);

  if (!site) {
    notFound();
  }

  const teamData = await getTeamForUser(user.id);
  if (!teamData) {
    redirect('/dashboard');
  }

  const organization = await getOrganizationByTeamId(teamData.id);
  if (!organization) {
    redirect('/dashboard');
  }

  return (
    <div className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/synoptics" className="hover:text-gray-700">
            Sites
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/synoptics/sites/${siteId}`} className="hover:text-gray-700">
            {site.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">New Layout</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Synoptic Layout</h1>
          <p className="text-sm text-gray-600 mb-6">
            Create an interactive diagram to visualize your medical gas distribution network
          </p>
          <LayoutForm organizationId={organization.id} siteId={siteId} />
        </div>
      </div>
    </div>
  );
}
