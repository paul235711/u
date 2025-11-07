import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { annotations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/synoptics/annotations/[id]
 * Get a single annotation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const annotation = await db
      .select()
      .from(annotations)
      .where(eq(annotations.id, id))
      .limit(1);

    if (annotation.length === 0) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    const ann = annotation[0];
    const transformed = {
      id: ann.id,
      layoutId: ann.layoutId,
      type: ann.annotationType,
      title: ann.title,
      subtitle: ann.subtitle || undefined,
      position: {
        x: parseFloat(ann.positionX as string),
        y: parseFloat(ann.positionY as string),
      },
      size: ann.sizeWidth && ann.sizeHeight
        ? {
            width: parseFloat(ann.sizeWidth as string),
            height: parseFloat(ann.sizeHeight as string),
          }
        : undefined,
      color: ann.color || undefined,
      style: ann.style === 'layer' ? 'layer' : undefined,
      interactive: ann.interactive === 1,
      metadata: ann.metadata as any,
      createdAt: ann.createdAt,
      updatedAt: ann.updatedAt,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Failed to fetch annotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/synoptics/annotations/[id]
 * Update an annotation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { type, title, subtitle, position, size, color, style, interactive, metadata } = body;

    const updateData: any = {};
    
    if (type !== undefined) updateData.annotationType = type;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (position) {
      updateData.positionX = position.x.toString();
      updateData.positionY = position.y.toString();
    }
    if (size) {
      updateData.sizeWidth = size.width ? size.width.toString() : null;
      updateData.sizeHeight = size.height ? size.height.toString() : null;
    }
    if (color !== undefined) updateData.color = color || null;
    if (style !== undefined) updateData.style = style || null;
    if (interactive !== undefined) updateData.interactive = interactive ? 1 : 0;
    if (metadata !== undefined) updateData.metadata = metadata || null;

    const updated = await db
      .update(annotations)
      .set(updateData)
      .where(eq(annotations.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    const ann = updated[0];
    const transformed = {
      id: ann.id,
      layoutId: ann.layoutId,
      type: ann.annotationType,
      title: ann.title,
      subtitle: ann.subtitle || undefined,
      position: {
        x: parseFloat(ann.positionX as string),
        y: parseFloat(ann.positionY as string),
      },
      size: ann.sizeWidth && ann.sizeHeight
        ? {
            width: parseFloat(ann.sizeWidth as string),
            height: parseFloat(ann.sizeHeight as string),
          }
        : undefined,
      color: ann.color || undefined,
      style: ann.style === 'layer' ? 'layer' : undefined,
      interactive: ann.interactive === 1,
      metadata: ann.metadata as any,
      createdAt: ann.createdAt,
      updatedAt: ann.updatedAt,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Failed to update annotation:', error);
    return NextResponse.json(
      { error: 'Failed to update annotation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synoptics/annotations/[id]
 * Delete an annotation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const deleted = await db
      .delete(annotations)
      .where(eq(annotations.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
