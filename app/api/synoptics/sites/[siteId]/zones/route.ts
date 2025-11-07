import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { zones, floors, buildings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const siteId = params.siteId;

    // Fetch zones for this site via floors->buildings->site relationship
    const siteZones = await db
      .select({
        id: zones.id,
        name: zones.name,
        code: zones.id, // Use id as code since zones doesn't have a code column
        floorId: zones.floorId,
      })
      .from(zones)
      .innerJoin(floors, eq(zones.floorId, floors.id))
      .innerJoin(buildings, eq(floors.buildingId, buildings.id))
      .where(eq(buildings.siteId, siteId));

    // Transform to match expected interface
    const formattedZones = siteZones.map(zone => ({
      id: zone.id,
      name: zone.name,
      code: zone.id.substring(0, 8).toUpperCase(), // Use first 8 chars of UUID as code
      floorId: zone.floorId,
    }));

    return NextResponse.json(formattedZones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}
