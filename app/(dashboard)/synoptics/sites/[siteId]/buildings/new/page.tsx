import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getSiteById } from '@/lib/db/synoptics-queries';
import { BuildingForm } from '@/components/synoptics/forms/building-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function NewBuildingPage({
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
          <span className="text-gray-900">New Building</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Building</h1>
          <BuildingForm
            siteId={siteId}
            siteLat={site.latitude ? parseFloat(site.latitude) : undefined}
            siteLng={site.longitude ? parseFloat(site.longitude) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
