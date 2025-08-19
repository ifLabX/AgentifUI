'use client';

import { useAvatarUpload } from '@lib/hooks/use-avatar-upload';
import { useProfile } from '@lib/hooks/use-profile';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Camera, Check, Trash2, X } from 'lucide-react';

import React, { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

import { AvatarCropper } from './avatar-cropper';
import { AvatarPreview } from './avatar-preview';
import { AvatarUploadArea } from './avatar-upload-area';

// Avatar modal component interface definition
interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarUpdate?: (avatarUrl: string | null) => void;
}

/**
 * Modern avatar modal component
 *
 * Features:
 * - Modern rectangular modal design
 * - Support drag and click upload
 * - Real-time progress display and status feedback
 * - Image preview function
 * - Avatar delete function
 * - Responsive design
 * - Project theme style
 * - Optimized performance and smoothness
 */
export function AvatarModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  onAvatarUpdate,
}: AvatarModalProps) {
  const { profile } = useProfile();
  const t = useTranslations('pages.settings.avatarModal');
  const avatarUpload = useAvatarUpload();

  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Simplify state management: mainly use the state of useAvatarUpload, only retain UI-related states
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset state
  const resetState = useCallback(() => {
    avatarUpload.resetState();
    setPreviewUrl(null);
    setShowDeleteConfirm(false);
    setShowCropper(false);
    setSelectedFile(null);
  }, [avatarUpload]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!avatarUpload.state.isUploading && !avatarUpload.state.isDeleting) {
      resetState();
      onClose();
    }
  }, [
    avatarUpload.state.isUploading,
    avatarUpload.state.isDeleting,
    resetState,
    onClose,
  ]);

  // File validation
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
          error: t('errors.unsupportedType'),
        };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          error: t('errors.fileTooLarge'),
        };
      }

      return { valid: true };
    },
    [t]
  );

  // Handle file selection - enter crop mode
  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        console.error('File validation failed:', validation.error);
        return;
      }

      // Set selected file and enter crop mode
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setShowCropper(true);
    },
    [validateFile]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      e.target.value = '';
    },
    [handleFileSelect]
  );

  // Handle drag event
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Confirm crop and upload
  const handleCropConfirm = useCallback(
    async (croppedFile: File) => {
      if (!profile?.id) return;

      try {
        // Upload cropped image
        const result = await avatarUpload.uploadAvatar(croppedFile, profile.id);

        // Notify parent component to update
        onAvatarUpdate?.(result.url);

        // Close after 1.5 seconds
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [profile?.id, avatarUpload, onAvatarUpdate, handleClose]
  );

  // Cancel crop, return to upload interface
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Handle delete avatar (real implementation)
  const handleDeleteAvatar = useCallback(async () => {
    if (!profile?.id || !currentAvatarUrl) return;

    try {
      // Use the extractFilePathFromUrl function in useAvatarUpload
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

      const filePath = extractFilePathFromUrl(currentAvatarUrl);
      if (filePath) {
        // Call the real delete API, pass userId
        await avatarUpload.deleteAvatar(filePath, profile.id);
      }

      // Notify parent component to update
      onAvatarUpdate?.(null);

      // Close confirm dialog
      setShowDeleteConfirm(false);

      // Close after 1 second
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [
    profile?.id,
    currentAvatarUrl,
    onAvatarUpdate,
    handleClose,
    avatarUpload,
  ]);

  // Current displayed avatar URL
  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  // Get current upload/delete status
  const isProcessing =
    avatarUpload.state.isUploading || avatarUpload.state.isDeleting;
  const currentProgress = avatarUpload.state.progress;
  const currentError = avatarUpload.state.error;

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -5 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
          onClick={e => e.stopPropagation()}
          className={cn(
            'w-full max-w-md rounded-xl shadow-xl',
            'border border-stone-200 bg-white/98 dark:border-stone-800 dark:bg-stone-900/98',
            'overflow-hidden'
          )}
        >
          {/* Modal header */}
          <div
            className={cn(
              'flex items-center justify-between border-b px-5 py-4',
              'border-stone-200 bg-stone-50/50 dark:border-stone-800 dark:bg-stone-800/30'
            )}
          >
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                  'bg-stone-100 dark:bg-stone-700'
                )}
              >
                <Camera
                  className={cn(
                    'h-5 w-5',
                    'text-stone-600 dark:text-stone-400'
                  )}
                />
              </div>
              <div>
                <h2
                  className={cn(
                    'font-serif text-lg font-semibold',
                    'text-stone-900 dark:text-stone-100'
                  )}
                >
                  {t('title')}
                </h2>
                <p
                  className={cn(
                    'font-serif text-sm',
                    'text-stone-600 dark:text-stone-400'
                  )}
                >
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className={cn(
                'rounded-lg p-2 transition-colors duration-150',
                'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal content */}
          <div className="space-y-5 p-5">
            {/* Crop interface */}
            {showCropper && previewUrl && (
              <AvatarCropper
                imageUrl={previewUrl}
                onConfirm={handleCropConfirm}
                onCancel={handleCropCancel}
                isUploading={isProcessing}
              />
            )}

            {/* Original upload interface - only displayed in non-crop mode */}
            {!showCropper && (
              <>
                {/* Current avatar display */}
                <AvatarPreview
                  avatarUrl={displayAvatarUrl}
                  userName={userName}
                  isUploading={isProcessing}
                  progress={currentProgress}
                />

                {/* Status message */}
                <AnimatePresence>
                  {currentError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex items-center rounded-lg p-3',
                        'border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                      )}
                    >
                      <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="font-serif text-sm">{currentError}</span>
                    </motion.div>
                  )}

                  {avatarUpload.state.status === 'success' && !currentError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex items-center rounded-lg p-3',
                        'border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                      )}
                    >
                      <Check className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="font-serif text-sm">
                        {t('status.success')}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload area */}
                <AvatarUploadArea
                  onFileSelect={handleFileSelect}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  isDragOver={isDragOver}
                  isUploading={isProcessing}
                  hasCurrentAvatar={!!currentAvatarUrl}
                  progress={currentProgress}
                />

                {/* Operation button */}
                <div className="flex gap-3">
                  {currentAvatarUrl && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isProcessing}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-serif text-sm transition-colors duration-150',
                        'border disabled:cursor-not-allowed disabled:opacity-50',
                        'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('buttons.deleteAvatar')}
                    </button>
                  )}

                  <button
                    onClick={handleClose}
                    disabled={isProcessing}
                    className={cn(
                      'flex-1 rounded-lg px-4 py-2.5 font-serif text-sm transition-colors duration-150',
                      'border border-stone-200 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    {isProcessing
                      ? t('buttons.uploading')
                      : t('buttons.complete')}
                  </button>
                </div>
              </>
            )}

            {/* Delete confirm dialog */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={e => e.stopPropagation()}
                    className={cn(
                      'mx-4 w-full max-w-sm rounded-lg p-5 shadow-xl',
                      'border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    )}
                  >
                    <div className="space-y-4">
                      <div className="text-center">
                        <div
                          className={cn(
                            'inline-flex h-10 w-10 items-center justify-center rounded-full',
                            'bg-red-100 dark:bg-red-900/20'
                          )}
                        >
                          <Trash2
                            className={cn(
                              'h-5 w-5',
                              'text-red-600 dark:text-red-400'
                            )}
                          />
                        </div>
                        <h3
                          className={cn(
                            'mt-3 font-serif text-base font-medium',
                            'text-stone-900 dark:text-stone-100'
                          )}
                        >
                          {t('deleteConfirm.title')}
                        </h3>
                        <p
                          className={cn(
                            'mt-2 font-serif text-sm',
                            'text-stone-600 dark:text-stone-400'
                          )}
                        >
                          {t('deleteConfirm.message')}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className={cn(
                            'flex-1 rounded-lg px-4 py-2 font-serif text-sm transition-colors duration-150',
                            'border border-stone-200 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700'
                          )}
                        >
                          {t('buttons.cancel')}
                        </button>
                        <button
                          onClick={handleDeleteAvatar}
                          disabled={isProcessing}
                          className={cn(
                            'flex-1 rounded-lg px-4 py-2 font-serif text-sm transition-colors duration-150',
                            'border disabled:cursor-not-allowed disabled:opacity-50',
                            'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                          )}
                        >
                          {isProcessing
                            ? t('buttons.deleting')
                            : t('buttons.confirmDelete')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
