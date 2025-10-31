import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getLayoutWithNodesAndConnections, getOrganizationByTeamId } from '@/lib/db/synoptics-queries';
import { notFound } from 'next/navigation';
import { LayoutEditorContainer } from '@/components/synoptics';
import Link from 'next/link';
import { ChevronRight, Layers } from 'lucide-react';

// Force dynamic rendering for fresh layout data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LayoutPage({
  params,
}: {
  params: Promise<{ layoutId: string }>;
}) {
  const user = await getUser();
  const { layoutId } = await params;

  if (!user) {
    redirect('/sign-in');
  }

  const layoutData = await getLayoutWithNodesAndConnections(layoutId);

  if (!layoutData) {
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

  // Fetch site data for proper breadcrumb
  let siteName = 'Site';
  if (layoutData.siteId) {
    const { getSiteById } = await import('@/lib/db/synoptics-queries');
    const siteData = await getSiteById(layoutData.siteId);
    if (siteData) {
      siteName = siteData.name;
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/synoptics" className="hover:text-gray-700">
            Sites
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/synoptics/sites/${layoutData.siteId}`} className="hover:text-gray-700">
            {siteName}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">{layoutData.name}</span>
        </div>
      </div>

      {/* Unified Editor with Lock/Unlock */}
      <div className="flex-1 overflow-hidden">
        <LayoutEditorContainer
          layoutId={layoutId}
          organizationId={organization.id}
          siteId={layoutData.siteId || undefined}
        />
      </div>
    </div>
  );
}
