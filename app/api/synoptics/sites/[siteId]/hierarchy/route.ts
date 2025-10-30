import { NextRequest, NextResponse } from 'next/server';
import { getSiteWithHierarchy } from '@/lib/db/synoptics-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    
    const siteData = await getSiteWithHierarchy(siteId);
    
    if (!siteData) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(siteData);
  } catch (error) {
    console.error('Error fetching site hierarchy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site hierarchy' },
      { status: 500 }
    );
  }
}
