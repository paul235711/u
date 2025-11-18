import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getBuildingById, getSiteById } from '@/lib/db/synoptics-queries';
import { BuildingForm } from '@/components/synoptics/forms/building-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const user = await getUser();
  const { buildingId } = await params;

  if (!user) {
    redirect('/sign-in');
  }

  const building = await getBuildingById(buildingId);

  if (!building) {
    notFound();
  }

  const site = await getSiteById(building.siteId);

  if (!site) {
    notFound();
  }

  const locale = await getRequestLocale();
  const messages = getMessages(locale);

  return (
    <div className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/synoptics" className="hover:text-gray-700">
            {messages['synoptics.siteDetail.breadcrumb.sites']}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/synoptics/sites/${site.id}`} className="hover:text-gray-700">
            {site.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">{messages['synoptics.buildingEdit.breadcrumb.edit']}</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{messages['synoptics.buildingEdit.title']}</h1>
          <BuildingForm
            siteId={site.id}
            buildingId={building.id}
            initialData={{
              name: building.name ?? '',
              latitude: building.latitude ?? '',
              longitude: building.longitude ?? '',
            }}
            siteLat={site.latitude ? parseFloat(site.latitude) : undefined}
            siteLng={site.longitude ? parseFloat(site.longitude) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
