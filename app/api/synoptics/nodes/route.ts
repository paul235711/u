import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createNode, getNodesWithElementDataBySiteId } from '@/lib/db/synoptics-queries';
import { z } from 'zod';

const coordinateSchema = z.union([z.number(), z.string(), z.null()]).optional();

const nodeSchema = z.object({
  siteId: z.string().uuid(),
  nodeType: z.enum(['source', 'valve', 'fitting']),
  elementId: z.string().uuid(),
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  zoneId: z.string().uuid().optional().nullable(),
  zPosition: z.string().optional(),
  outletCount: z.number().int().optional(),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
});

function normaliseCoordinate(value: number | string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(numericValue)) {
    throw new Error('Invalid coordinate value');
  }

  return numericValue.toString();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');
    const buildingId = searchParams.get('buildingId');
    const floorId = searchParams.get('floorId');

    // Check if siteId is missing, empty, or the string 'undefined'
    if (!siteId || siteId.trim() === '' || siteId === 'undefined' || siteId === 'null') {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Validate siteId is a valid UUID
    try {
      z.string().uuid().parse(siteId);
    } catch (error) {
      return NextResponse.json(
        { error: 'siteId must be a valid UUID' },
        { status: 400 }
      );
    }

    // Get all nodes for this site
    let nodes = await getNodesWithElementDataBySiteId(siteId);
    
    // Apply additional hierarchical filters if provided
    if (buildingId) {
      nodes = nodes.filter((node: any) => node.buildingId === buildingId || !node.buildingId);
    } else if (floorId) {
      nodes = nodes.filter((node: any) => node.floorId === floorId || !node.floorId);
    }

    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = nodeSchema.parse(body);

    const { latitude, longitude, ...rest } = validatedData;

    const normalisedLatitude = normaliseCoordinate(latitude);
    const normalisedLongitude = normaliseCoordinate(longitude);

    const nodePayload = {
      ...rest,
      ...(normalisedLatitude !== undefined ? { latitude: normalisedLatitude } : {}),
      ...(normalisedLongitude !== undefined ? { longitude: normalisedLongitude } : {}),
    };

    const node = await createNode(nodePayload as any);

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Invalid coordinate value') {
      return NextResponse.json(
        { error: 'Invalid data', details: [{ message: error.message }] },
        { status: 400 }
      );
    }

    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
