import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createMedia, getMediaByElement } from '@/lib/db/synoptics-queries';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fittingId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fittingId } = await params;
    const mediaList = await getMediaByElement(fittingId, 'fitting');
    
    const mediaWithUrls = mediaList.map((m) => ({
      ...m,
      fileUrl: m.storagePath,
      fileType: m.mimeType,
    }));

    return NextResponse.json(mediaWithUrls);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fittingId: string }> }
) {
  try {
    const user = await getUser();
    const { fittingId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const elementType = formData.get('elementType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Security: File size validation (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Convert to buffer for validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes as ArrayBuffer);

    // Security: File type validation using magic bytes
    const detectedType = await fileTypeFromBuffer(buffer);
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
      'image/tiff', 'image/bmp', 'application/pdf'
    ];

    if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
      return NextResponse.json({ error: 'Invalid file type detected' }, { status: 400 });
    }

    // Create optimized version for images
    let processedBuffer = buffer;
    let finalFileName: string;
    let finalMimeType = detectedType.mime;

    if (detectedType.mime.startsWith('image/') && detectedType.mime !== 'image/gif') {
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        const maxWidth = 1920;
        const maxHeight = 1080;

        let resizeOptions: any = {};
        if (metadata.width! > maxWidth || metadata.height! > maxHeight) {
          resizeOptions = {
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true
          };
        }

        processedBuffer = await image
          .resize(resizeOptions)
          .webp({ quality: 85, effort: 6 })
          .toBuffer();

        finalMimeType = 'image/webp';
        const fileExtension = 'webp';
        finalFileName = `${randomUUID()}.${fileExtension}`;

      } catch (error) {
        console.warn('Image processing failed, using original:', error);
        finalFileName = `${randomUUID()}.${file.name.split('.').pop()}`;
      }
    } else {
      finalFileName = `${randomUUID()}.${file.name.split('.').pop()}`;
    }

    // Upload file to Supabase Storage
    const bucket = process.env.SUPABASE_STORAGE_BUCKET!;
    const objectKey = `fittings/${fittingId}/${finalFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(objectKey, processedBuffer, {
        contentType: finalMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error (fitting media):', uploadError);
      return NextResponse.json({ error: 'Error uploading media' }, { status: 500 });
    }

    // Create database entry with processed file info
    const mediaData = {
      siteId: '', // We'll need to get this from the fitting
      elementId: fittingId,
      elementType: elementType || 'fitting',
      storagePath: objectKey,
      fileName: file.name,
      mimeType: finalMimeType,
    };

    // Get siteId from fitting
    const { getFittingById } = await import('@/lib/db/synoptics-queries');
    const fitting = await getFittingById(fittingId);
    if (!fitting) {
      return NextResponse.json({ error: 'Fitting not found' }, { status: 404 });
    }
    mediaData.siteId = fitting.siteId;

    const media = await createMedia(mediaData);

    return NextResponse.json({
      ...media,
      optimized: finalMimeType !== detectedType.mime,
      originalSize: buffer.length,
      optimizedSize: processedBuffer.length,
      compressionRatio: ((buffer.length - processedBuffer.length) / buffer.length * 100).toFixed(1)
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
