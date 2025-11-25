import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    const bucket = process.env.SUPABASE_STORAGE_BUCKET!;

    // Generate a signed URL from Supabase Storage and redirect the client to it
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(media.storagePath, 60 * 60);

    if (error || !data?.signedUrl) {
      console.error('Supabase signed URL error:', error);
      return NextResponse.json({ error: 'File not accessible' }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl, 302);

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

    const bucket = process.env.SUPABASE_STORAGE_BUCKET!;

    // Attempt to delete file from Supabase Storage (non-fatal if it fails)
    const { error: removeError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([media.storagePath]);

    if (removeError) {
      console.warn('Failed to delete media file from Supabase:', removeError);
      // Continue to delete DB record even if storage object is missing
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
