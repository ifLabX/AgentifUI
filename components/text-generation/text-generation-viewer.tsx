'use client';

import type { AppExecution } from '@lib/types/database';
import { cn } from '@lib/utils';
import {
  CheckCircle,
  Copy,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Square,
  XCircle,
} from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface TextGenerationViewerProps {
  isExecuting: boolean;
  isStreaming: boolean;
  progress: number;
  generatedText: string;
  currentExecution: AppExecution | null;
  onStop?: () => void;
  onRetry?: () => void;
  onReset?: () => void;
}

/**
 * Text generation viewer component
 *
 * Features:
 * - Real-time display of streaming text generation
 * - Progress bar display generation progress
 * - Text operation (copy, download)
 * - Execution control (stop, retry, reset)
 * - Unified status panel
 */
export function TextGenerationViewer({
  isExecuting,
  isStreaming,
  progress,
  generatedText,
  currentExecution,
  onStop,
  onRetry,
  onReset,
}: TextGenerationViewerProps) {
  const [copied, setCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('pages.textGeneration');

  // --- Auto scroll to the bottom ---
  useEffect(() => {
    if (textAreaRef.current && isStreaming) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [generatedText, isStreaming]);

  // --- Copy text ---
  const handleCopyText = async () => {
    if (!generatedText) return;

    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // --- Download text ---
  const handleDownloadText = () => {
    if (!generatedText) return;

    const blob = new Blob([generatedText], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-text-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Get status information ---
  const getStatusInfo = () => {
    if (isExecuting || isStreaming) {
      return {
        icon: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
        text: t('status.generating'),
        color: 'text-blue-600',
      };
    }

    if (currentExecution?.status === 'completed') {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        text: t('status.completed'),
        color: 'text-green-600',
      };
    }

    if (currentExecution?.status === 'failed') {
      return {
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        text: t('status.failed'),
        color: 'text-red-600',
      };
    }

    if (currentExecution?.status === 'stopped') {
      return {
        icon: <Square className="h-5 w-5 text-orange-500" />,
        text: t('status.stopped'),
        color: 'text-orange-600',
      };
    }

    return {
      icon: <FileText className="h-5 w-5 text-stone-400" />,
      text: t('status.waiting'),
      color: 'text-stone-500',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex h-full flex-col">
      {/* --- Control panel --- */}
      <div
        className={cn(
          'flex-shrink-0 border-b p-4',
          'border-stone-200 bg-stone-50/50',
          'dark:border-stone-700 dark:bg-stone-900/50'
        )}
      >
        <div className="flex items-center justify-between">
          {/* Status information */}
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <div
                className={cn(
                  'font-serif font-medium',
                  'text-stone-800 dark:text-stone-200'
                )}
              >
                {statusInfo.text}
              </div>
              {(isExecuting || isStreaming) && (
                <div
                  className={cn(
                    'font-serif text-sm',
                    'text-stone-600 dark:text-stone-400'
                  )}
                >
                  {t('progress', { percent: Math.round(progress) })}
                </div>
              )}
            </div>
          </div>

          {/* Operation buttons */}
          <div className="flex items-center gap-2">
            {/* Text operation buttons */}
            {generatedText && (
              <>
                <button
                  onClick={handleCopyText}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    'text-stone-600 hover:bg-stone-200 hover:text-stone-800',
                    'dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-stone-200'
                  )}
                  title={copied ? t('buttons.copied') : t('buttons.copy')}
                >
                  <Copy className="h-4 w-4" />
                </button>

                <button
                  onClick={handleDownloadText}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    'text-stone-600 hover:bg-stone-200 hover:text-stone-800',
                    'dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-stone-200'
                  )}
                  title={t('buttons.download')}
                >
                  <Download className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Execution control buttons */}
            {isExecuting && onStop && (
              <button
                onClick={onStop}
                className={cn(
                  'rounded-lg px-3 py-2 font-serif transition-colors',
                  'bg-red-500 text-white hover:bg-red-600'
                )}
              >
                <Square className="mr-1 h-4 w-4" />
                {t('buttons.stop')}
              </button>
            )}

            {!isExecuting &&
              currentExecution?.status === 'failed' &&
              onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    'rounded-lg px-3 py-2 font-serif transition-colors',
                    'bg-blue-500 text-white hover:bg-blue-600'
                  )}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  {t('buttons.retry')}
                </button>
              )}

            {!isExecuting && onReset && (
              <button
                onClick={onReset}
                className={cn(
                  'rounded-lg px-3 py-2 font-serif transition-colors',
                  'bg-stone-200 text-stone-800 hover:bg-stone-300',
                  'dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
                )}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                {t('buttons.reset')}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {(isExecuting || isStreaming) && (
          <div className="mt-3">
            <div
              className={cn(
                'h-2 w-full overflow-hidden rounded-full',
                'bg-stone-200 dark:bg-stone-700'
              )}
            >
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- Text display area --- */}
      <div className="flex-1 overflow-hidden">
        {!generatedText && !isExecuting ? (
          // Empty state
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <div
                className={cn(
                  'mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed',
                  'border-stone-300 dark:border-stone-600'
                )}
              >
                <FileText
                  className={cn(
                    'h-6 w-6',
                    'text-stone-500 dark:text-stone-400'
                  )}
                />
              </div>
              <div className="space-y-2">
                <h3
                  className={cn(
                    'font-serif text-lg font-semibold',
                    'text-stone-800 dark:text-stone-200'
                  )}
                >
                  {t('emptyState.title')}
                </h3>
                <p
                  className={cn(
                    'max-w-md font-serif text-sm',
                    'text-stone-600 dark:text-stone-400'
                  )}
                >
                  {t('emptyState.description')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Text display
          <div className="h-full p-6">
            <textarea
              ref={textAreaRef}
              value={generatedText}
              readOnly
              className={cn(
                'h-full w-full resize-none border-0 bg-transparent focus:outline-none',
                'font-serif text-base leading-relaxed',
                'text-stone-800 dark:text-stone-200'
              )}
              placeholder={
                isExecuting
                  ? t('placeholder.generating')
                  : t('placeholder.result')
              }
            />

            {/* Streaming generation indicator */}
            {isStreaming && (
              <div
                className={cn(
                  'absolute right-6 bottom-6 flex items-center gap-2 rounded-lg px-3 py-2',
                  'border backdrop-blur-sm',
                  'border-stone-300 bg-white/80 text-stone-700',
                  'dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-300'
                )}
              >
                <div className="flex space-x-1">
                  <div
                    className={cn(
                      'h-2 w-2 animate-pulse rounded-full',
                      'bg-blue-500'
                    )}
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className={cn(
                      'h-2 w-2 animate-pulse rounded-full',
                      'bg-blue-500'
                    )}
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className={cn(
                      'h-2 w-2 animate-pulse rounded-full',
                      'bg-blue-500'
                    )}
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="font-serif text-sm">
                  {t('streamingIndicator')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Statistics --- */}
      {generatedText && (
        <div
          className={cn(
            'flex-shrink-0 border-t px-6 py-3',
            'border-stone-200 bg-stone-50/50',
            'dark:border-stone-700 dark:bg-stone-900/50'
          )}
        >
          <div className="flex items-center justify-between text-sm">
            <div
              className={cn('font-serif', 'text-stone-600 dark:text-stone-400')}
            >
              {t('stats.characters', { count: generatedText.length })},{' '}
              {t('stats.words', {
                count: generatedText
                  .split(/\s+/)
                  .filter(word => word.length > 0).length,
              })}
            </div>

            {currentExecution?.total_tokens && (
              <div
                className={cn(
                  'font-serif',
                  'text-stone-600 dark:text-stone-400'
                )}
              >
                {t('stats.tokensUsed', {
                  count: currentExecution.total_tokens,
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
