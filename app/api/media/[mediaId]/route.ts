import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { stat, readFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    // Authentication check
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await params;

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    // Get media metadata from database
    const { getMediaById } = await import('@/lib/db/synoptics-queries');
    const media = await getMediaById(mediaId);

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Authorization: Check if user has access to this site's media
    // This is a basic check - you might want to add more sophisticated permissions
    // For now, we assume if the user is logged in and the media exists, they can access it

    const filePath = join(process.cwd(), 'public', media.storagePath);

    try {
      // Check if file exists and get stats
      const fileStat = await stat(filePath);

      // Read file
      const fileBuffer = await readFile(filePath);

      // Return file with appropriate headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': media.mimeType,
          'Content-Length': fileStat.size.toString(),
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour, private
          'Content-Disposition': `inline; filename="${media.fileName}"`,
        },
      });

      return response;

    } catch (fileError) {
      console.error('File access error:', fileError);
      return NextResponse.json({ error: 'File not accessible' }, { status: 404 });
    }

  } catch (error) {
    console.error('Media serving error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await params;

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const { getMediaById, deleteMedia } = await import('@/lib/db/synoptics-queries');
    const media = await getMediaById(mediaId);

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const filePath = join(process.cwd(), 'public', media.storagePath);

    try {
      await unlink(filePath);
    } catch (fileError) {
      console.warn('Failed to delete media file from disk:', fileError);
      // Continue to delete DB record even if file is missing
    }

    await deleteMedia(mediaId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
