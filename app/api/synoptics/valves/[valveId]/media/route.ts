import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createMedia, getMediaByElement } from '@/lib/db/synoptics-queries';
import { writeFile, mkdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ valveId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { valveId } = await params;
    const mediaList = await getMediaByElement(valveId, 'valve');
    
    // Transform to include full URL
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
  { params }: { params: Promise<{ valveId: string }> }
) {
  try {
    const user = await getUser();
    const { valveId } = await params;

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
    const buffer = Buffer.from(bytes);

    // Security: File type validation using magic bytes (more secure than MIME type)
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
        // Image optimization: resize, compress, convert to WebP
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Resize if larger than 1920px (maintain aspect ratio)
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

        // Process image: convert to WebP for better compression
        processedBuffer = await image
          .resize(resizeOptions)
          .webp({ quality: 85, effort: 6 })
          .toBuffer();

        finalMimeType = 'image/webp';
        const fileExtension = 'webp';
        finalFileName = `${randomUUID()}.${fileExtension}`;

      } catch (error) {
        console.warn('Image processing failed, using original:', error);
        // Fall back to original if processing fails
        finalFileName = `${randomUUID()}.${file.name.split('.').pop()}`;
      }
    } else {
      // Non-image files (PDF, GIF, etc.) - keep original
      finalFileName = `${randomUUID()}.${file.name.split('.').pop()}`;
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'media');
    await mkdir(uploadsDir, { recursive: true });

    // Save processed file to disk
    const filePath = join(uploadsDir, finalFileName);
    await writeFile(filePath, processedBuffer);

    // Create database entry with processed file info
    const mediaData = {
      siteId: '', // We'll need to get this from the valve
      elementId: valveId,
      elementType: elementType || 'valve',
      storagePath: `/uploads/media/${finalFileName}`,
      fileName: file.name,
      mimeType: finalMimeType,
    };

    // Get siteId from valve
    const { getValveById } = await import('@/lib/db/synoptics-queries');
    const valve = await getValveById(valveId);
    if (!valve) {
      return NextResponse.json({ error: 'Valve not found' }, { status: 404 });
    }
    mediaData.siteId = valve.siteId;

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
