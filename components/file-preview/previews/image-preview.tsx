'use client';

import { cn } from '@lib/utils';
import { DownloadIcon, ImageIcon } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface ImagePreviewProps {
  content: Blob;
  filename: string;
  onDownload: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  content,
  filename,
  onDownload,
}) => {
  const t = useTranslations('filePreview.imagePreview');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(content);
    setImageUrl(url);
    setIsLoading(false);

    // Cleanup function to revoke object URL
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [content]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex items-center space-x-2">
          <ImageIcon
            className={cn('h-5 w-5', 'text-stone-600 dark:text-stone-400')}
          />
          <h3 className="text-lg font-semibold">{t('title')}</h3>
        </div>
        <div
          className={cn(
            'aspect-video w-full rounded-md',
            'bg-stone-200 dark:bg-stone-700'
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ImageIcon
            className={cn('h-5 w-5', 'text-stone-600 dark:text-stone-400')}
          />
          <h3 className="text-lg font-semibold">{t('title')}</h3>
        </div>
        <button
          onClick={onDownload}
          className={cn(
            'inline-flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            'bg-stone-200 text-stone-800 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
          )}
        >
          <DownloadIcon className="h-4 w-4" />
          <span>{t('downloadButton')}</span>
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-md border',
          'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
        )}
      >
        {hasError ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center space-y-2 py-8',
              'text-stone-600 dark:text-stone-400'
            )}
          >
            <ImageIcon className="h-12 w-12 opacity-50" />
            <p className="text-sm">{t('loadError')}</p>
            <button
              onClick={onDownload}
              className={cn(
                'text-sm underline hover:no-underline',
                'text-stone-700 dark:text-stone-300'
              )}
            >
              {t('downloadToView')}
            </button>
          </div>
        ) : (
          <div className="p-4">
            <img
              src={imageUrl}
              alt={filename}
              className="max-h-96 max-w-full rounded object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          'rounded-md border p-3 text-sm',
          'border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
        )}
      >
        <div className="space-y-1">
          <p>
            <strong>{t('filename')}:</strong> {filename}
          </p>
          <p>
            <strong>{t('fileSize')}:</strong> {(content.size / 1024).toFixed(1)}{' '}
            KB
          </p>
          <p>
            <strong>{t('fileType')}:</strong> {content.type}
          </p>
        </div>
      </div>
    </div>
  );
};
