'use client';

import { useTheme } from '@lib/hooks';
import type { MessageAttachment } from '@lib/stores/chat-store';
import { useFilePreviewStore } from '@lib/stores/ui/file-preview-store';
import { cn, formatBytes } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircleIcon,
  DownloadIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react';

import React, { useEffect } from 'react';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { FilePreviewBackdrop } from './file-preview-backdrop';
import { AudioPreview } from './previews/audio-preview';
import { ImagePreview } from './previews/image-preview';
import { MarkdownPreview } from './previews/markdown-preview';
import { PDFPreview } from './previews/pdf-preview';
import { TextPreview } from './previews/text-preview';
import { VideoPreview } from './previews/video-preview';

/**
 * Loading skeleton component
 */
const LoadingSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const t = useTranslations('filePreview');
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center space-x-2">
        <RefreshCwIcon
          className={cn(
            'h-4 w-4 animate-spin',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        />
        <span
          className={cn(
            'text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          {t('loading')}
        </span>
      </div>
      <div
        className={cn(
          'space-y-3 rounded-md p-4',
          isDark ? 'bg-stone-800' : 'bg-stone-100'
        )}
      >
        <div
          className={cn(
            'h-4 rounded',
            isDark ? 'bg-stone-700' : 'bg-stone-200'
          )}
        />
        <div
          className={cn(
            'h-4 w-3/4 rounded',
            isDark ? 'bg-stone-700' : 'bg-stone-200'
          )}
        />
        <div
          className={cn(
            'h-4 w-1/2 rounded',
            isDark ? 'bg-stone-700' : 'bg-stone-200'
          )}
        />
      </div>
    </div>
  );
};

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{
  error: string;
  onRetry: () => void;
  onClearError: () => void;
  isDark: boolean;
}> = ({ error, onRetry, onClearError, isDark }) => {
  const t = useTranslations('filePreview');
  return (
    <div
      className={cn(
        'space-y-4 rounded-md border p-4',
        isDark
          ? 'border-red-800 bg-red-900/20 text-red-200'
          : 'border-red-300 bg-red-50 text-red-800'
      )}
    >
      <div className="flex items-start space-x-2">
        <AlertCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium">{t('failed')}</h3>
          <p className="mt-1 text-sm opacity-90">{error}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onRetry}
          className={cn(
            'inline-flex items-center space-x-1 rounded px-3 py-1.5 text-sm font-medium transition-colors',
            isDark
              ? 'bg-red-800 text-red-100 hover:bg-red-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          )}
        >
          <RefreshCwIcon className="h-3 w-3" />
          <span>{t('retryButton')}</span>
        </button>
        <button
          onClick={onClearError}
          className={cn(
            'inline-flex items-center rounded px-3 py-1.5 text-sm font-medium transition-colors',
            isDark
              ? 'text-red-200 hover:bg-red-800/50'
              : 'text-red-700 hover:bg-red-100'
          )}
        >
          {t('dismissButton')}
        </button>
      </div>
    </div>
  );
};

/**
 * Fallback component for unsupported file types
 */
const FileInfoFallback: React.FC<{
  file: MessageAttachment;
  onDownload: () => void;
  isDark: boolean;
}> = ({ file, onDownload, isDark }) => {
  const t = useTranslations('filePreview');
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('fileInfo.title')}</h3>
      <div
        className={cn(
          'space-y-3 rounded-md border p-4',
          isDark
            ? 'border-stone-700 bg-stone-800'
            : 'border-stone-200 bg-stone-50'
        )}
      >
        <div className="space-y-1 text-sm">
          <p>
            <strong>{t('fileInfo.name')}</strong> {file.name}
          </p>
          <p>
            <strong>{t('fileInfo.type')}</strong> {file.type}
          </p>
          <p>
            <strong>{t('fileInfo.size')}</strong> {formatBytes(file.size)}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onDownload}
          className={cn(
            'inline-flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            isDark
              ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
              : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
          )}
        >
          <DownloadIcon className="h-4 w-4" />
          <span>{t('downloadButton')}</span>
        </button>
      </div>
      <p
        className={cn('text-xs', isDark ? 'text-stone-400' : 'text-stone-500')}
      >
        {t('previewNotSupported')}
      </p>
    </div>
  );
};

/**
 * Enhanced file content viewer with document preview capabilities
 */
const FileContentViewer: React.FC<{
  file: MessageAttachment | null;
  isDark: boolean;
}> = ({ file, isDark }) => {
  const {
    previewContent,
    contentHeaders,
    isLoading,
    error,
    downloadFile,
    openPreview,
    clearError,
  } = useFilePreviewStore();

  const t = useTranslations('filePreview');

  if (!file) {
    return (
      <div
        className={cn(
          'py-8 text-center',
          isDark ? 'text-stone-400' : 'text-stone-600'
        )}
      >
        {t('noFileSelected')}
      </div>
    );
  }

  // Handle retry
  const handleRetry = () => {
    if (file.app_id) {
      openPreview(file, file.app_id);
    }
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton isDark={isDark} />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={handleRetry}
        onClearError={clearError}
        isDark={isDark}
      />
    );
  }

  // Show fallback if no content available
  if (!previewContent || !contentHeaders) {
    return (
      <FileInfoFallback file={file} onDownload={downloadFile} isDark={isDark} />
    );
  }

  // Route to appropriate preview component based on content type
  const contentType = contentHeaders.contentType.toLowerCase();

  // Text files (including code files)
  if (contentType.startsWith('text/') && !contentType.includes('markdown')) {
    return (
      <TextPreview
        content={previewContent}
        filename={file.name}
        contentType={contentType}
        onDownload={downloadFile}
      />
    );
  }

  // Markdown files
  if (
    contentType.includes('markdown') ||
    file.name.toLowerCase().endsWith('.md')
  ) {
    return (
      <MarkdownPreview
        content={previewContent}
        filename={file.name}
        onDownload={downloadFile}
      />
    );
  }

  // PDF files
  if (contentType === 'application/pdf') {
    return (
      <PDFPreview
        content={previewContent}
        filename={file.name}
        onDownload={downloadFile}
      />
    );
  }

  // Image files (JPG, PNG, GIF, WebP, etc.)
  if (contentType.startsWith('image/')) {
    return (
      <ImagePreview
        content={previewContent}
        filename={file.name}
        onDownload={downloadFile}
      />
    );
  }

  // Audio files (MP3, WAV, etc.)
  if (contentType.startsWith('audio/')) {
    return (
      <AudioPreview
        content={previewContent}
        filename={file.name}
        onDownload={downloadFile}
      />
    );
  }

  // Video files (MP4, WebM, etc.)
  if (contentType.startsWith('video/')) {
    return (
      <VideoPreview
        content={previewContent}
        filename={file.name}
        onDownload={downloadFile}
      />
    );
  }

  // Fallback for unsupported types
  return (
    <FileInfoFallback file={file} onDownload={downloadFile} isDark={isDark} />
  );
};

export const FilePreviewCanvas = () => {
  const { isPreviewOpen, currentPreviewFile, closePreview } =
    useFilePreviewStore();
  const { isDark } = useTheme();
  const pathname = usePathname();
  const t = useTranslations('filePreview');

  // Auto-close preview when route changes (best practice for modal state management)
  useEffect(() => {
    if (isPreviewOpen) {
      closePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const panelVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 },
  };

  // Speed up animation: reduce duration
  const transitionConfig = {
    type: 'tween',
    duration: 0.2, // Reduce from 0.3 to 0.2
    ease: 'easeInOut',
  };

  return (
    <>
      <FilePreviewBackdrop />

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            className={cn(
              'fixed top-0 right-0 z-50 h-full',
              'flex flex-col',
              'w-[85%] md:w-[60%] lg:w-[50%] xl:w-[40%]',
              isDark
                ? 'border-l border-stone-700 bg-stone-800 text-stone-100'
                : 'border-l border-stone-200 bg-white text-stone-900'
            )}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={transitionConfig}
          >
            <div
              className={cn(
                'flex flex-shrink-0 items-center justify-between border-b p-4',
                isDark ? 'border-stone-700' : 'border-stone-200'
              )}
            >
              <h2
                className="truncate text-xl font-semibold"
                title={currentPreviewFile?.name || 'File information'}
              >
                {currentPreviewFile?.name || 'File information'}
              </h2>
              <button
                onClick={closePreview}
                className={cn(
                  'rounded-full p-1',
                  isDark
                    ? 'text-stone-300 hover:bg-stone-700 hover:text-stone-200'
                    : 'text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                )}
                aria-label={t('closeButton')}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
              <FileContentViewer
                file={currentPreviewFile}
                isDark={isDark ?? false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
