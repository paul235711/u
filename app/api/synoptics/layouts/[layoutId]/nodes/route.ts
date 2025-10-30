import { NextRequest, NextResponse } from 'next/server';
import { getNodePositionsByLayoutId, getNodeById } from '@/lib/db/synoptics-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const { layoutId } = await params;
    
    // Get all node positions for this layout
    const positions = await getNodePositionsByLayoutId(layoutId);
    const nodeIds = positions.map((p: any) => p.nodeId);
    
    // Get node details
    const nodes = await Promise.all(
      nodeIds.map(async (nodeId: string) => {
        const node = await getNodeById(nodeId);
        return node;
      })
    );
    
    return NextResponse.json(nodes.filter(n => n !== null));
  } catch (error) {
    console.error('Error fetching layout nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout nodes' },
      { status: 500 }
    );
  }
}
