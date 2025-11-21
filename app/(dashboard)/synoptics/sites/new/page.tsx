import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getOrganizationByTeamId } from '@/lib/db/synoptics-queries';
import { SiteForm } from '@/components/synoptics/forms/site-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';
import type { Messages } from '@/lib/i18n/en';

export default async function NewSitePage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser();

  if (!teamData) {
    redirect('/dashboard');
  }

  // Minimal shape needed here: we only use id (and name when creating)
  let organization = (await getOrganizationByTeamId(teamData.id)) as
    | { id: string; name: string | null }
    | null;
  
  if (!organization) {
    const { createOrganization } = await import('@/lib/db/synoptics-queries');
    organization = (await createOrganization({
      teamId: teamData.id,
      name: teamData.name,
    })) as { id: string; name: string | null };
  }

  const locale = await getRequestLocale();
  const messages: Messages = getMessages(locale);

  return (
    <div className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/synoptics" className="hover:text-gray-700">
            {messages['synoptics.siteDetail.breadcrumb.sites']}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">{messages['synoptics.sites.new']}</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {messages['synoptics.sites.create.title']}
          </h1>
          <SiteForm organizationId={organization.id} />
        </div>
      </div>
    </div>
  );
}
