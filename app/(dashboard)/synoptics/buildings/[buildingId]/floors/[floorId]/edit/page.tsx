import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getFloorById, getBuildingById, getSiteById } from '@/lib/db/synoptics-queries';
import { FloorForm } from '@/components/synoptics/forms/floor-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getRequestLocale, getMessages } from '@/lib/i18n/server';

export default async function EditFloorPage({
  params,
}: {
  params: Promise<{ buildingId: string; floorId: string }>;
}) {
  const user = await getUser();
  const { buildingId, floorId } = await params;

  if (!user) {
    redirect('/sign-in');
  }

  const floor = await getFloorById(floorId);

  if (!floor || floor.buildingId !== buildingId) {
    notFound();
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
          <span className="text-gray-900">{messages['synoptics.floorEdit.breadcrumb.edit']}</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{messages['synoptics.floorEdit.title']}</h1>
          <p className="text-sm text-gray-600 mb-6">{messages['synoptics.floorEdit.subtitlePrefix']}{building.name}</p>
          <FloorForm
            buildingId={buildingId}
            siteId={building.siteId}
            floorId={floor.id}
            initialData={{
              floorNumber: floor.floorNumber,
              name: floor.name ?? undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}
