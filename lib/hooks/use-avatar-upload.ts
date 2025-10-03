'use client';

import { createClient } from '@lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

/**
 * State type for avatar upload.
 */
export interface AvatarUploadState {
  isUploading: boolean;
  isDeleting: boolean;
  progress: number;
  error: string | null;
  status: 'idle' | 'uploading' | 'success' | 'error' | 'deleting';
}

/**
 * Result type for avatar upload.
 */
export interface AvatarUploadResult {
  url: string;
  path: string;
}

/**
 * Helper function to extract file path from avatar URL.
 */
const extractFilePathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf('avatars');
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Hook for avatar upload, delete, and URL generation.
 */
export function useAvatarUpload() {
  const [state, setState] = useState<AvatarUploadState>({
    isUploading: false,
    isDeleting: false,
    progress: 0,
    error: null,
    status: 'idle',
  });

  const supabase = createClient();
  const t = useTranslations('pages.settings.avatarUpload');

  /**
   * Validate file type and size.
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: t('errors.unsupportedFileType', {
            types: allowedTypes.join(', '),
          }),
        };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          error: t('errors.fileTooLarge', {
            maxSize: Math.round(maxSize / 1024 / 1024),
          }),
        };
      }

      return { valid: true };
    },
    [t]
  );

  /**
   * Generate a safe file path for the avatar.
   * Format: user-{userId}/{timestamp}-{uuid}.{ext}
   */
  const generateFilePath = useCallback(
    (userId: string, fileName: string): string => {
      const uuid = uuidv4();
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      const safeFileName = `${timestamp}-${uuid}.${extension}`;
      return `user-${userId}/${safeFileName}`;
    },
    []
  );

  /**
   * Upload avatar file and update user profile.
   * Also deletes the old avatar file if present.
   */
  const uploadAvatar = useCallback(
    async (file: File, userId: string): Promise<AvatarUploadResult> => {
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setState(prev => ({
        ...prev,
        isUploading: true,
        status: 'uploading',
        progress: 0,
        error: null,
      }));

      try {
        // 1. Get current avatar URL for cleanup
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        // 2. Generate new file path
        const filePath = generateFilePath(userId, file.name);

        // 3. Upload new avatar to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            t('errors.uploadFailed', { message: uploadError.message })
          );
        }

        // 4. Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error(t('errors.getUrlFailed'));
        }

        // 5. Update avatar_url in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          throw new Error(
            t('errors.updateDatabaseFailed', { message: updateError.message })
          );
        }

        // 6. Delete old avatar file if exists (silent)
        if (currentProfile?.avatar_url) {
          const oldFilePath = extractFilePathFromUrl(currentProfile.avatar_url);
          if (oldFilePath) {
            supabase.storage
              .from('avatars')
              .remove([oldFilePath])
              .catch(error => {
                console.warn(
                  'Failed to delete old avatar file (ignored):',
                  error
                );
              });
          }
        }

        setState(prev => ({
          ...prev,
          isUploading: false,
          status: 'success',
          progress: 100,
        }));

        return {
          url: urlData.publicUrl,
          path: filePath,
        };
      } catch (error) {
        setState(prev => ({
          ...prev,
          isUploading: false,
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : t('errors.uploadFailedGeneric'),
        }));
        throw error;
      }
    },
    [validateFile, generateFilePath, supabase, t]
  );

  /**
   * Delete avatar file and clear avatar_url in database.
   */
  const deleteAvatar = useCallback(
    async (filePath: string, userId: string): Promise<void> => {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        status: 'deleting',
        error: null,
      }));

      try {
        // Delete file from storage
        const { error } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        if (error) {
          throw new Error(t('errors.deleteFailed', { message: error.message }));
        }

        // Update database, set avatar_url to null
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          throw new Error(
            t('errors.updateDatabaseFailed', { message: updateError.message })
          );
        }

        setState(prev => ({
          ...prev,
          isDeleting: false,
          status: 'success',
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isDeleting: false,
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : t('errors.deleteFailedGeneric'),
        }));
        throw error;
      }
    },
    [supabase, t]
  );

  /**
   * Reset upload/delete state.
   */
  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      isDeleting: false,
      progress: 0,
      error: null,
      status: 'idle',
    });
  }, []);

  return {
    state,
    uploadAvatar,
    deleteAvatar,
    validateFile,
    resetState,
  };
}
