'use client';

import { cn, formatBytes } from '@lib/utils';
import { DownloadIcon, MusicIcon } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface AudioPreviewProps {
  content: Blob;
  filename: string;
  onDownload: () => Promise<void>;
}

export const AudioPreview: React.FC<AudioPreviewProps> = ({
  content,
  filename,
  onDownload,
}) => {
  const t = useTranslations('filePreview');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);

  // Create audio URL from blob
  useEffect(() => {
    const url = URL.createObjectURL(content);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [content]);

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
    setIsLoading(false);
    setHasError(false);
  };

  const handleAudioError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('audio.title')}</h3>
        <button
          onClick={onDownload}
          className={cn(
            'inline-flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'bg-stone-200 text-stone-800 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
          )}
        >
          <DownloadIcon className="h-4 w-4" />
          <span>{t('downloadButton')}</span>
        </button>
      </div>

      {/* Audio Player Container */}
      <div
        className={cn(
          'rounded-lg border p-6',
          'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
        )}
      >
        {/* Filename Display */}
        <div className="mb-4 flex items-center space-x-3">
          <MusicIcon
            className={cn(
              'h-8 w-8',
              'text-stone-500 dark:text-stone-400'
            )}
          />
          <div>
            <p
              className={cn(
                'truncate font-medium',
                'text-stone-800 dark:text-stone-200'
              )}
              title={filename}
            >
              {filename}
            </p>
            {duration > 0 && (
              <p
                className={cn(
                  'text-sm',
                  'text-stone-500 dark:text-stone-400'
                )}
              >
                {formatTime(duration)}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <span
                className={cn(
                  'text-sm',
                  'text-stone-500 dark:text-stone-400'
                )}
              >
                {t('loading')}
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="flex items-center justify-center py-8">
            <p
              className={cn(
                'text-sm',
                'text-red-600 dark:text-red-400'
              )}
            >
              {t('audio.loadError')}
            </p>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            onLoadedMetadata={handleAudioLoadedMetadata}
            onError={handleAudioError}
            className={cn('w-full', isLoading || hasError ? 'hidden' : 'block')}
            preload="metadata"
          >
            {t('audio.notSupported')}
          </audio>
        )}
      </div>

      {/* File Information */}
      <div
        className={cn(
          'rounded-md border p-4 text-sm',
          'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
        )}
      >
        <div className="space-y-1">
          <p>
            <strong>{t('fileInfo.name')}</strong> {filename}
          </p>
          <p>
            <strong>{t('fileInfo.type')}</strong> {content.type || 'audio/*'}
          </p>
          <p>
            <strong>{t('fileInfo.size')}</strong> {formatBytes(content.size)}
          </p>
          {duration > 0 && (
            <p>
              <strong>{t('audio.duration')}</strong> {formatTime(duration)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
