'use client';

import { cn } from '@lib/utils';
import { Loader2, Upload } from 'lucide-react';

import React, { useRef } from 'react';

import { useTranslations } from 'next-intl';

// Avatar upload area component interface
interface AvatarUploadAreaProps {
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragOver: boolean;
  isUploading: boolean;
  hasCurrentAvatar: boolean;
  progress: number;
  isDark?: boolean;
  colors: any;
}

export function AvatarUploadArea({
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
  isUploading,
  hasCurrentAvatar,
  progress,
  isDark = false,
  colors,
}: AvatarUploadAreaProps) {
  const t = useTranslations('pages.settings.avatarModal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={handleClick}
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-150',
        isDragOver
          ? isDark
            ? 'border-stone-400 bg-stone-800/50'
            : 'border-stone-400 bg-stone-50'
          : colors.borderColor.tailwind,
        isUploading && 'cursor-not-allowed opacity-75',
        colors.cardBackground.tailwind
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      <div className="space-y-3">
        {/* Upload icon */}
        <div
          className={cn(
            'inline-flex h-12 w-12 items-center justify-center rounded-full',
            isDark ? 'bg-stone-700' : 'bg-stone-100'
          )}
        >
          {isUploading ? (
            <Loader2
              className={cn(
                'h-6 w-6 animate-spin',
                colors.secondaryTextColor.tailwind
              )}
            />
          ) : (
            <Upload
              className={cn('h-6 w-6', colors.secondaryTextColor.tailwind)}
            />
          )}
        </div>

        {/* Upload text */}
        <div className="space-y-1">
          <p
            className={cn(
              'font-serif text-sm font-medium',
              colors.textColor.tailwind
            )}
          >
            {isUploading
              ? t('uploadArea.uploading')
              : hasCurrentAvatar
                ? t('uploadArea.changeAvatar')
                : t('uploadArea.uploadAvatar')}
          </p>
          <p
            className={cn(
              'font-serif text-xs',
              colors.secondaryTextColor.tailwind
            )}
          >
            {isUploading
              ? t('uploadArea.uploadProgress', { progress })
              : t('uploadArea.dragHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
