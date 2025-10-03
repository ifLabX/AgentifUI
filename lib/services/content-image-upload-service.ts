import { createClient } from '@lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result type for content image upload
 */
export interface ContentImageUploadResult {
  url: string;
  path: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Allowed image MIME types for content images
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * MIME type to file extension mapping
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Storage bucket name for content images
 */
const BUCKET_NAME = 'content-images';

/**
 * Validate image file type and size
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error: `Unsupported file type. Supported formats: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path for content image
 *
 * Format: user-{userId}/{timestamp}-{uuid}.{ext}
 *
 * @param userId - User ID
 * @param fileName - Original file name (used for fallback only)
 * @param fileType - MIME type of the file
 * @returns Generated file path
 */
export function generateContentImagePath(
  userId: string,
  fileName: string,
  fileType: string
): string {
  const uuid = uuidv4();
  const timestamp = Date.now();
  const extension =
    MIME_TO_EXTENSION[fileType] || fileName.split('.').pop() || 'jpg';
  const safeFileName = `${timestamp}-${uuid}.${extension}`;
  return `user-${userId}/${safeFileName}`;
}

/**
 * Extract file path from Supabase Storage URL
 *
 * @param url - Full Supabase Storage URL
 * @returns File path or null if invalid
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Upload content image to Supabase Storage
 *
 * @param file - Image file to upload
 * @param userId - User ID for file path generation
 * @returns Upload result with public URL and file path
 * @throws Error if upload fails or validation fails
 */
export async function uploadContentImage(
  file: File,
  userId: string
): Promise<ContentImageUploadResult> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = createClient();

  // Generate file path
  const filePath = generateContentImagePath(userId, file.name, file.type);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

/**
 * Delete content image from Supabase Storage
 *
 * @param filePath - File path in storage (e.g., user-{userId}/filename.jpg)
 * @throws Error if deletion fails
 */
export async function deleteContentImage(filePath: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * List all content images for a specific user
 *
 * @param userId - User ID
 * @returns Array of file paths
 * @throws Error if listing fails
 */
export async function listUserContentImages(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`user-${userId}`, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`Failed to list images: ${error.message}`);
  }

  return data.map(file => `user-${userId}/${file.name}`);
}
