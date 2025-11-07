import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { annotations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/synoptics/annotations?layoutId={layoutId}
 * Get all annotations for a layout
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const layoutId = searchParams.get('layoutId');

    if (!layoutId) {
      return NextResponse.json(
        { error: 'layoutId is required' },
        { status: 400 }
      );
    }

    const layoutAnnotations = await db
      .select()
      .from(annotations)
      .where(eq(annotations.layoutId, layoutId));

    // Transform to frontend format
    const transformedAnnotations = layoutAnnotations.map((ann) => ({
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
    }));

    return NextResponse.json(transformedAnnotations);
  } catch (error) {
    console.error('Failed to fetch annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synoptics/annotations
 * Create a new annotation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { layoutId, type, title, subtitle, position, size, color, style, interactive, metadata } = body;

    if (!layoutId || !type || !title || !position) {
      return NextResponse.json(
        { error: 'layoutId, type, title, and position are required' },
        { status: 400 }
      );
    }

    const newAnnotation = await db
      .insert(annotations)
      .values({
        layoutId,
        annotationType: type,
        title,
        subtitle: subtitle || null,
        positionX: position.x.toString(),
        positionY: position.y.toString(),
        sizeWidth: size?.width ? size.width.toString() : null,
        sizeHeight: size?.height ? size.height.toString() : null,
        color: color || null,
        style: style || null,
        interactive: interactive ? 1 : 0,
        metadata: metadata || null,
      })
      .returning();

    // Transform to frontend format
    const ann = newAnnotation[0];
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

    return NextResponse.json(transformed, { status: 201 });
  } catch (error) {
    console.error('Failed to create annotation:', error);
    return NextResponse.json(
      { error: 'Failed to create annotation' },
      { status: 500 }
    );
  }
}
