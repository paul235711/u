import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

/**
 * Media management utilities for scalable file handling
 */

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  averageSize: number;
  fileTypes: Record<string, number>;
  oldestFile: Date | null;
  newestFile: Date | null;
}

/**
 * Get statistics about uploaded media files
 */
export async function getMediaStats(): Promise<MediaStats> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'media');

  try {
    const files = await readdir(uploadsDir);
    const stats: MediaStats = {
      totalFiles: files.length,
      totalSize: 0,
      averageSize: 0,
      fileTypes: {},
      oldestFile: null,
      newestFile: null,
    };

    for (const file of files) {
      const filePath = join(uploadsDir, file);
      const fileStat = await stat(filePath);

      stats.totalSize += fileStat.size;

      // Track file types
      const ext = file.split('.').pop()?.toLowerCase() || 'unknown';
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

      // Track dates
      const mtime = fileStat.mtime;
      if (!stats.oldestFile || mtime < stats.oldestFile) {
        stats.oldestFile = mtime;
      }
      if (!stats.newestFile || mtime > stats.newestFile) {
        stats.newestFile = mtime;
      }
    }

    stats.averageSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;

    return stats;
  } catch (error) {
    console.error('Error getting media stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      averageSize: 0,
      fileTypes: {},
      oldestFile: null,
      newestFile: null,
    };
  }
}

/**
 * Clean up orphaned media files (files not referenced in database)
 */
export async function cleanupOrphanedFiles(): Promise<{ deleted: number; errors: number }> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'media');

  try {
    const files = await readdir(uploadsDir);
    let deleted = 0;
    let errors = 0;

    // This would need database access to check which files are referenced
    // For now, just log what would be cleaned up
    console.log(`Found ${files.length} media files for cleanup analysis`);

    // TODO: Implement database query to get referenced files
    // const referencedFiles = await getReferencedMediaFiles();
    // const orphanedFiles = files.filter(file => !referencedFiles.includes(file));

    return { deleted, errors };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return { deleted: 0, errors: 1 };
  }
}

/**
 * Ensure upload directory exists and has proper permissions
 */
export async function ensureUploadDirectory(): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'media');

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('Upload directory ready:', uploadsDir);
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw error;
  }
}

/**
 * Validate file before processing
 */
export function validateFileConstraints(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES_PER_ELEMENT = 10; // Reasonable limit

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
    'image/tiff', 'image/bmp', 'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type' };
  }

  return { valid: true };
}
