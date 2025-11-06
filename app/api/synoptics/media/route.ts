import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getMediaByElement } from '@/lib/db/synoptics-queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const elementId = searchParams.get('elementId');
    const elementType = searchParams.get('elementType');

    if (!elementId || !elementType) {
      return NextResponse.json({ error: 'elementId and elementType are required' }, { status: 400 });
    }

    const media = await getMediaByElement(elementId, elementType);

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
