'use client';

import { cn } from '@lib/utils';
import { CopyIcon, DownloadIcon } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface TextPreviewProps {
  content: Blob;
  filename: string;
  contentType: string;
  onDownload: () => void;
}

export const TextPreview: React.FC<TextPreviewProps> = ({
  content,
  filename,
  contentType,
  onDownload,
}) => {
  const t = useTranslations('filePreview.textPreview');
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const loadText = async () => {
      try {
        const textContent = await content.text();
        setText(textContent);
      } catch {
        setText('Error loading content');
      } finally {
        setIsLoading(false);
      }
    };

    loadText();
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className={cn('h-4 rounded', 'bg-stone-200 dark:bg-stone-700')} />
        <div
          className={cn('h-4 w-3/4 rounded', 'bg-stone-200 dark:bg-stone-700')}
        />
        <div
          className={cn('h-4 w-1/2 rounded', 'bg-stone-200 dark:bg-stone-700')}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center space-x-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              'bg-stone-200 text-stone-800 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
            )}
            title={t('copyButton')}
          >
            <CopyIcon className="h-3 w-3" />
            <span>{copySuccess ? t('copiedButton') : t('copyButton')}</span>
          </button>
          <button
            onClick={onDownload}
            className={cn(
              'inline-flex items-center space-x-1 rounded px-2 py-1 text-xs font-medium transition-colors',
              'bg-stone-200 text-stone-800 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
            )}
            title={t('downloadButton')}
          >
            <DownloadIcon className="h-3 w-3" />
            <span>{t('downloadButton')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'min-h-[60vh] flex-1 overflow-auto rounded-md border p-4',
          'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
        )}
      >
        <pre
          className={cn(
            'font-mono text-sm break-words whitespace-pre-wrap',
            'text-stone-800 dark:text-stone-200'
          )}
        >
          {text}
        </pre>
      </div>

      {/* File info */}
      <div
        className={cn(
          'flex-shrink-0 text-xs',
          'text-stone-500 dark:text-stone-400'
        )}
      >
        {filename} • {contentType} •{' '}
        {t('charactersCount', { count: text.length.toLocaleString() })}
      </div>
    </div>
  );
};
