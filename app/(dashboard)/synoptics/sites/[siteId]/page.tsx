import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getSiteWithHierarchy, getLayoutsBySiteId, getOrganizationByTeamId } from '@/lib/db/synoptics-queries';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteHierarchyManager } from '@/components/synoptics';
import { SiteDetailClient } from './site-detail-client';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';

// Force dynamic rendering to prevent stale cached data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const user = await getUser();
  const { siteId } = await params;

  if (!user) {
    redirect('/sign-in');
  }

  const siteData = await getSiteWithHierarchy(siteId);

  if (!siteData) {
    notFound();
  }

  const layouts = await getLayoutsBySiteId(siteId);
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  
  // Get organization for equipment manager
  const teamData = await getTeamForUser();
  const organization = (teamData as any)?.team
    ? await getOrganizationByTeamId((teamData as any).team.id)
    : null;
  const organizationId = organization?.id ?? siteData.organizationId ?? '';

  return (
    <div className="flex-1 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/synoptics" className="hover:text-gray-700">
              {messages['synoptics.siteDetail.breadcrumb.sites']}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900">{siteData.name}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{siteData.name}</h1>
              {siteData.address && (
                <div className="mt-2 flex items-start text-gray-600">
                  <MapPin className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{siteData.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Component with Tabs */}
        <SiteDetailClient 
          siteData={siteData}
          siteId={siteId}
          organizationId={organizationId}
          layouts={layouts}
        />
      </div>
    </div>
  );
}
