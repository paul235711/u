import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getBuildingById } from '@/lib/db/synoptics-queries';
import { FloorForm } from '@/components/synoptics/forms/floor-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function NewFloorPage({
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

  return (
    <div className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/synoptics" className="hover:text-gray-700">
            Sites
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/synoptics/sites/${building.siteId}`} className="hover:text-gray-700">
            Site
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900">New Floor</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Floor</h1>
          <p className="text-sm text-gray-600 mb-6">to {building.name}</p>
          <FloorForm buildingId={buildingId} siteId={building.siteId} />
        </div>
      </div>
    </div>
  );
}
