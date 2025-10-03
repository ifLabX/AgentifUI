'use client';

import { cn, formatBytes } from '@lib/utils';
import { DownloadIcon, VideoIcon } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface VideoPreviewProps {
  content: Blob;
  filename: string;
  onDownload: () => Promise<void>;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  content,
  filename,
  onDownload,
}) => {
  const t = useTranslations('filePreview');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{
    width?: number;
    height?: number;
    duration?: number;
  }>({});

  // Create video URL from blob
  useEffect(() => {
    const url = URL.createObjectURL(content);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [content]);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoInfo({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        duration: videoRef.current.duration,
      });
    }
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatResolution = (width?: number, height?: number) => {
    if (!width || !height) return 'Unknown';
    return `${width} × ${height}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('video.title')}</h3>
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

      {/* Video Player Container */}
      <div
        className={cn(
          'overflow-hidden rounded-lg border',
          'border-stone-200 dark:border-stone-700'
        )}
      >
        {isLoading && (
          <div
            className={cn(
              'flex h-64 items-center justify-center',
              'bg-stone-100 dark:bg-stone-800'
            )}
          >
            <div className="flex items-center space-x-2">
              <VideoIcon
                className={cn('h-6 w-6', 'text-stone-500 dark:text-stone-400')}
              />
              <span
                className={cn('text-sm', 'text-stone-500 dark:text-stone-400')}
              >
                {t('loading')}
              </span>
            </div>
          </div>
        )}

        {hasError && (
          <div
            className={cn(
              'flex h-64 flex-col items-center justify-center space-y-2',
              'bg-stone-100 dark:bg-stone-800'
            )}
          >
            <VideoIcon
              className={cn('h-12 w-12', 'text-stone-400 dark:text-stone-500')}
            />
            <p className={cn('text-sm', 'text-stone-500 dark:text-stone-400')}>
              {t('video.loadError')}
            </p>
          </div>
        )}

        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onLoadedMetadata={handleVideoLoadedMetadata}
            onError={handleVideoError}
            className={cn(
              'max-h-96 w-full object-contain',
              'bg-stone-50 dark:bg-stone-900',
              isLoading || hasError ? 'hidden' : 'block'
            )}
            preload="metadata"
          >
            {t('video.notSupported')}
          </video>
        )}
      </div>

      {/* Video Information */}
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
            <strong>{t('fileInfo.type')}</strong> {content.type || 'video/*'}
          </p>
          <p>
            <strong>{t('fileInfo.size')}</strong> {formatBytes(content.size)}
          </p>
          {videoInfo.duration && (
            <p>
              <strong>{t('video.duration')}</strong>{' '}
              {formatTime(videoInfo.duration)}
            </p>
          )}
          {videoInfo.width && videoInfo.height && (
            <p>
              <strong>{t('video.resolution')}</strong>{' '}
              {formatResolution(videoInfo.width, videoInfo.height)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
