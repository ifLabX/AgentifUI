'use client';

import { useContentImageUpload } from '@lib/hooks/use-content-image-upload';
import { ALLOWED_IMAGE_TYPES } from '@lib/services/content-image-upload-service';
import { cn, formatBytes } from '@lib/utils';
import { CheckCircle2, Image as ImageIcon, Upload, X } from 'lucide-react';

import React, { useCallback, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

export interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (url: string, path: string) => void;
  userId: string;
}

/**
 * Image upload dialog for content editor
 *
 * Features:
 * - File picker with drag-and-drop support
 * - Upload progress indicator
 * - Image preview
 * - Validation and error handling
 */
export function ImageUploadDialog({
  isOpen,
  onClose,
  onUploadSuccess,
  userId,
}: ImageUploadDialogProps) {
  const t = useTranslations('pages.admin.content.imageUpload');
  const { state, uploadImage, validateFile, resetState } =
    useContentImageUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      // Clear previous validation error
      setValidationError(null);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        return;
      }

      setSelectedFile(file);

      // Generate preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [validateFile]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle drag and drop events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    resetState();
    onClose();
  }, [onClose, resetState]);

  /**
   * Handle upload button click
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadImage(selectedFile, userId);
      onUploadSuccess(result.url, result.path);

      // Wait 1.2 seconds to show success state before closing
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (error) {
      // Error is already in state
      console.error('Upload failed:', error);
    }
  }, [selectedFile, uploadImage, userId, onUploadSuccess, handleClose]);

  /**
   * Handle click on file picker area
   */
  const handlePickerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle keyboard interaction on file picker area
   */
  const handlePickerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePickerClick();
      }
    },
    [handlePickerClick]
  );

  /**
   * Handle remove selected file
   */
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
      onClick={e => {
        if (e.target === e.currentTarget && !state.isUploading) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-upload-dialog-title"
        className={cn(
          'mx-auto w-full max-w-lg rounded-xl bg-white shadow-2xl',
          'border border-stone-200 dark:border-stone-700 dark:bg-stone-900',
          'animate-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              )}
            >
              <Upload className="h-5 w-5" />
            </div>
            <h2
              id="image-upload-dialog-title"
              className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
            >
              {t('title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={state.isUploading}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              'text-stone-400 hover:bg-stone-100 hover:text-stone-600',
              'dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File picker / Drop zone */}
          {!selectedFile && (
            <>
              <div
                onClick={handlePickerClick}
                onKeyDown={handlePickerKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                aria-label={t('dropzone.title')}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all',
                  isDragging
                    ? 'border-stone-400 bg-stone-50 dark:border-stone-500 dark:bg-stone-800'
                    : 'border-stone-300 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800/50 dark:hover:border-stone-500 dark:hover:bg-stone-800'
                )}
              >
                <ImageIcon className="mx-auto mb-4 h-12 w-12 text-stone-400 dark:text-stone-500" />
                <p className="mb-2 font-serif text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('dropzone.title')}
                </p>
                <p className="mb-4 font-serif text-xs text-stone-500 dark:text-stone-400">
                  {t('dropzone.subtitle')}
                </p>
                <p className="font-serif text-xs text-stone-400 dark:text-stone-500">
                  {t('dropzone.formats')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',') as string}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Validation error message */}
              {validationError && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
                  <p className="font-serif text-sm text-red-700 dark:text-red-300">
                    {validationError}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {selectedFile && previewUrl && (
            <div className="space-y-4">
              <div className="relative h-64 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800">
                <Image
                  src={previewUrl}
                  alt={`Preview of ${selectedFile.name}`}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-stone-100 px-4 py-3 dark:bg-stone-800">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                  <div>
                    <p className="font-serif text-sm font-medium text-stone-900 dark:text-stone-100">
                      {selectedFile.name}
                    </p>
                    <p className="font-serif text-xs text-stone-500 dark:text-stone-400">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
                {!state.isUploading && (
                  <button
                    onClick={handleRemoveFile}
                    className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Upload progress */}
              {state.isUploading && (
                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                    <div
                      className="h-full bg-stone-600 transition-all duration-300 dark:bg-stone-400"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                  <p className="text-center font-serif text-sm text-stone-600 dark:text-stone-400">
                    {t('uploading')} {state.progress}%
                  </p>
                </div>
              )}

              {/* Success message */}
              {state.status === 'success' && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="font-serif text-sm text-green-700 dark:text-green-300">
                    {t('success')}
                  </p>
                </div>
              )}

              {/* Error message */}
              {state.status === 'error' && state.error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
                  <p className="font-serif text-sm text-red-700 dark:text-red-300">
                    {state.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stone-200 px-6 py-4 dark:border-stone-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={state.isUploading}
            className={cn(
              'rounded-lg border px-4 py-2 font-serif text-sm transition-colors',
              'border-stone-300 text-stone-700 hover:bg-stone-100',
              'dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || state.isUploading}
            className={cn(
              'rounded-lg px-4 py-2 font-serif text-sm font-medium transition-colors',
              'bg-stone-700 text-white hover:bg-stone-800',
              'dark:bg-stone-600 dark:hover:bg-stone-700',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {state.isUploading ? t('uploading') : t('upload')}
          </button>
        </div>
      </div>
    </div>
  );
}
