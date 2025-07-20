'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  CheckCircle,
  Clock,
  Eye,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  XCircle,
} from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface UnifiedStatusPanelProps {
  isExecuting: boolean;
  progress: number;
  error: string | null;
  canRetry: boolean;
  currentExecution: any;
  onStop: () => void;
  onRetry: () => void;
  onReset: () => void;
  onShowResult: () => void;
  showResultButton?: boolean; // Whether to display the view result button, default is true
}

/**
 * Unified workflow status panel
 *
 * Merges the functionality of ExecutionControlPanel and WorkflowStatus:
 * - Displays execution status and progress
 * - Provides operation buttons (stop, retry, reset, view result)
 * - Displays execution time and progress bar
 * - Unified visual design
 */
export function UnifiedStatusPanel({
  isExecuting,
  progress,
  error,
  canRetry,
  currentExecution,
  onStop,
  onRetry,
  onReset,
  onShowResult,
  showResultButton = true,
}: UnifiedStatusPanelProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.workflow.status');
  const tButtons = useTranslations('pages.workflow.buttons');

  const getOverallStatus = () => {
    if (isExecuting) return 'running';
    if (currentExecution?.status === 'completed') return 'completed';
    if (currentExecution?.status === 'failed') return 'failed';
    if (currentExecution?.status === 'stopped') return 'stopped';
    return 'idle';
  };

  const getStatusInfo = () => {
    const status = getOverallStatus();

    switch (status) {
      case 'running':
        return {
          icon: <Clock className="h-5 w-5 animate-pulse" />,
          text: t('running'),
          color: 'text-yellow-500',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          text: t('completed'),
          color: isDark ? 'text-stone-300' : 'text-stone-600',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5" />,
          text: t('failed'),
          color: 'text-red-500',
        };
      case 'stopped':
        return {
          icon: <Square className="h-5 w-5" />,
          text: t('stopped'),
          color: 'text-stone-500',
        };
      default:
        return {
          icon: <Play className="h-5 w-5" />,
          text: t('pending'),
          color: 'text-stone-400',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const overallStatus = getOverallStatus();

  return (
    <div
      className={cn(
        'flex-shrink-0 px-6 pt-2 pb-3'
        // Remove the split line and background, integrate into the page
      )}
    >
      <div className="space-y-3">
        {/* Main status row - only displayed when there is a status */}
        {(isExecuting || currentExecution || error) && (
          <div className="flex items-center justify-between">
            {/* Left: status information */}
            <div className="flex items-center gap-3">
              <div className={cn('flex items-center gap-2', statusInfo.color)}>
                {statusInfo.icon}
                <span className="font-serif text-base font-medium">
                  {statusInfo.text}
                </span>
              </div>
            </div>

            {/* Right: main operation buttons */}
            <div className="flex items-center gap-2">
              {/* View result button */}
              {showResultButton &&
                overallStatus === 'completed' &&
                currentExecution?.outputs && (
                  <button
                    onClick={onShowResult}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-1.5 font-serif text-sm transition-colors',
                      isDark
                        ? 'border border-stone-600 bg-stone-700 text-stone-200 hover:bg-stone-600'
                        : 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                    )}
                  >
                    <Eye className="h-4 w-4" />
                    {tButtons('viewResult')}
                  </button>
                )}

              {/* Stop button */}
              {isExecuting && (
                <button
                  onClick={onStop}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-serif text-sm transition-colors',
                    'flex items-center gap-1.5',
                    isDark
                      ? 'border border-red-600/50 bg-red-600/20 text-red-300 hover:bg-red-600/30'
                      : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  )}
                >
                  <Square className="h-3.5 w-3.5" />
                  {tButtons('stop')}
                </button>
              )}

              {/* Retry button */}
              {error && canRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-serif text-sm transition-colors',
                    'flex items-center gap-1.5',
                    isDark
                      ? 'border border-yellow-600/50 bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30'
                      : 'border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {tButtons('retry')}
                </button>
              )}

              {/* Reset button */}
              {(currentExecution || error) && !isExecuting && (
                <button
                  onClick={onReset}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-serif text-sm transition-colors',
                    'flex items-center gap-1.5',
                    isDark
                      ? 'border border-stone-600/50 bg-stone-600/20 text-stone-300 hover:bg-stone-600/30'
                      : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {tButtons('reset')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Detailed information row */}
        {(currentExecution?.elapsed_time || error) && (
          <div className="flex items-center gap-6">
            {/* Execution time */}
            {currentExecution?.elapsed_time && (
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-serif text-sm',
                  isDark
                    ? 'bg-stone-700 text-stone-300'
                    : 'bg-stone-100 text-stone-700'
                )}
              >
                <Clock className="h-4 w-4" />
                <span>
                  {t('totalTime', { time: currentExecution.elapsed_time })}
                </span>
              </div>
            )}

            {/* Error information */}
            {error && (
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-serif text-sm',
                  isDark
                    ? 'bg-red-900/30 text-red-400'
                    : 'bg-red-50 text-red-700'
                )}
              >
                <XCircle className="h-4 w-4" />
                <span className="max-w-64 truncate">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
