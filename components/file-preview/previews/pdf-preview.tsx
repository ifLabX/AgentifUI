'use client';

import { useTheme } from '@lib/hooks';
import { cn } from '@lib/utils';
import { DownloadIcon, ExternalLinkIcon } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface PDFPreviewProps {
  content: Blob;
  filename: string;
  onDownload: () => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  content,
  filename,
  onDownload,
}) => {
  const { isDark } = useTheme();
  const t = useTranslations('filePreview.pdfPreview');
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(content);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [content]);

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenInNewTab}
            className={cn(
              'inline-flex items-center space-x-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              isDark
                ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
            )}
            title={t('openButton')}
          >
            <ExternalLinkIcon className="h-3 w-3" />
            <span>{t('openButton')}</span>
          </button>
          <button
            onClick={onDownload}
            className={cn(
              'inline-flex items-center space-x-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              isDark
                ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
            )}
            title={t('downloadButton')}
          >
            <DownloadIcon className="h-3 w-3" />
            <span>{t('downloadButton')}</span>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-md border',
          isDark ? 'border-stone-700' : 'border-stone-200'
        )}
      >
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="h-96 w-full"
            title={`PDF preview: ${filename}`}
            style={{ border: 'none' }}
          />
        ) : (
          <div
            className={cn(
              'flex h-96 items-center justify-center',
              isDark
                ? 'bg-stone-800 text-stone-400'
                : 'bg-stone-50 text-stone-600'
            )}
          >
            Loading PDF...
          </div>
        )}
      </div>

      {/* File info */}
      <div
        className={cn('text-xs', isDark ? 'text-stone-400' : 'text-stone-500')}
      >
        {filename} • PDF Document •{' '}
        {t('fileSize', { size: (content.size / 1024 / 1024).toFixed(2) })}
      </div>
    </div>
  );
};
