import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { annotations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/synoptics/annotations/bulk
 * Bulk update or create annotations for a layout
 * Useful for saving all annotations at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { layoutId, annotations: annotationsData } = body;

    if (!layoutId || !annotationsData || !Array.isArray(annotationsData)) {
      return NextResponse.json(
        { error: 'layoutId and annotations array are required' },
        { status: 400 }
      );
    }

    // Start a transaction
    const results = [];

    for (const ann of annotationsData) {
      if (ann.id) {
        // Update existing annotation
        const updateData: any = {
          title: ann.title,
          subtitle: ann.subtitle || null,
          positionX: ann.position.x.toString(),
          positionY: ann.position.y.toString(),
          sizeWidth: ann.size?.width ? ann.size.width.toString() : null,
          sizeHeight: ann.size?.height ? ann.size.height.toString() : null,
          color: ann.color || null,
          style: ann.style || null,
          interactive: ann.interactive ? 1 : 0,
        };

        const updated = await db
          .update(annotations)
          .set(updateData)
          .where(eq(annotations.id, ann.id))
          .returning();

        if (updated.length > 0) {
          results.push(updated[0]);
        }
      } else {
        // Create new annotation
        const created = await db
          .insert(annotations)
          .values({
            layoutId,
            annotationType: ann.type,
            title: ann.title,
            subtitle: ann.subtitle || null,
            positionX: ann.position.x.toString(),
            positionY: ann.position.y.toString(),
            sizeWidth: ann.size?.width ? ann.size.width.toString() : null,
            sizeHeight: ann.size?.height ? ann.size.height.toString() : null,
            color: ann.color || null,
            style: ann.style || null,
            interactive: ann.interactive ? 1 : 0,
          })
          .returning();

        results.push(created[0]);
      }
    }

    // Transform results to frontend format
    const transformed = results.map((ann: any) => ({
      id: ann.id,
      layoutId: ann.layoutId,
      type: ann.annotationType,
      title: ann.title,
      subtitle: ann.subtitle || undefined,
      position: {
        x: parseFloat(ann.positionX),
        y: parseFloat(ann.positionY),
      },
      size: ann.sizeWidth && ann.sizeHeight
        ? {
            width: parseFloat(ann.sizeWidth),
            height: parseFloat(ann.sizeHeight),
          }
        : undefined,
      color: ann.color || undefined,
      style: ann.style === 'layer' ? 'layer' : undefined,
      interactive: ann.interactive === 1,
      createdAt: ann.createdAt,
      updatedAt: ann.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      count: transformed.length,
      annotations: transformed,
    });
  } catch (error) {
    console.error('Failed to bulk update annotations:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update annotations' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synoptics/annotations/bulk?layoutId={layoutId}
 * Delete all annotations for a layout
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const layoutId = searchParams.get('layoutId');

    if (!layoutId) {
      return NextResponse.json(
        { error: 'layoutId is required' },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(annotations)
      .where(eq(annotations.layoutId, layoutId))
      .returning();

    return NextResponse.json({
      success: true,
      count: deleted.length,
    });
  } catch (error) {
    console.error('Failed to bulk delete annotations:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete annotations' },
      { status: 500 }
    );
  }
}
