import { NextRequest, NextResponse } from 'next/server';
import { createNodePosition, getNodePosition } from '@/lib/db/synoptics-queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ layoutId: string }> }
) {
  try {
    const { layoutId } = await params;
    const body = await request.json();
    const { nodeIds } = body;
    
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return NextResponse.json(
        { error: 'nodeIds array is required' },
        { status: 400 }
      );
    }
    
    const results = [];
    const errors = [];
    
    // Auto-arrange nodes in a grid pattern
    const gridSpacing = 150;
    const nodesPerRow = Math.ceil(Math.sqrt(nodeIds.length));
    
    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      
      try {
        // Check if node already exists in this layout
        const existing = await getNodePosition(nodeId, layoutId);
        
        if (existing) {
          errors.push({ nodeId, error: 'Node already exists in this layout' });
          continue;
        }
        
        // Calculate position in grid
        const row = Math.floor(i / nodesPerRow);
        const col = i % nodesPerRow;
        const xPosition = 100 + (col * gridSpacing);
        const yPosition = 100 + (row * gridSpacing);
        
        // Create node position
        const position = await createNodePosition({
          nodeId,
          layoutId,
          xPosition: xPosition.toString(),
          yPosition: yPosition.toString(),
        });
        
        results.push(position);
      } catch (error) {
        console.error(`Error importing node ${nodeId}:`, error);
        errors.push({ 
          nodeId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Error importing nodes:', error);
    return NextResponse.json(
      { error: 'Failed to import nodes' },
      { status: 500 }
    );
  }
}
