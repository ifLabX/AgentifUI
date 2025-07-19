'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { CheckCircle, Circle, Clock, Loader2, XCircle } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface NodeProgressProps {
  node: {
    id: string;
    title: string;
    status: string;
    startTime: number | null;
    endTime: number | null;
  };
  index: number;
  isLast: boolean;
}

/**
 * Single node progress component
 *
 * Display the execution status, elapsed time, etc. of the node
 * Support fade-in animation effect
 */
export function NodeProgress({ node, index, isLast }: NodeProgressProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.workflow.nodeStatus');

  const getStatusIcon = () => {
    switch (node.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-stone-400" />;
    }
  };

  const getStatusColor = () => {
    switch (node.status) {
      case 'running':
        return isDark
          ? 'border-yellow-500 bg-yellow-900/20'
          : 'border-yellow-500 bg-yellow-50';
      case 'completed':
        return isDark
          ? 'border-green-500 bg-green-900/20'
          : 'border-green-500 bg-green-50';
      case 'failed':
        return isDark
          ? 'border-red-500 bg-red-900/20'
          : 'border-red-500 bg-red-50';
      default:
        return isDark
          ? 'border-stone-600 bg-stone-700'
          : 'border-stone-200 bg-stone-50';
    }
  };

  const getElapsedTime = () => {
    if (!node.startTime) return null;
    const endTime = node.endTime || Date.now();
    const elapsed = Math.round(((endTime - node.startTime) / 1000) * 10) / 10;
    return `${elapsed}s`;
  };

  return (
    <div
      className={cn(
        'animate-in fade-in-0 slide-in-from-right-2 duration-300',
        `animation-delay-${index * 100}`
      )}
    >
      <div className="flex items-start gap-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm">
        {/* Connection line and status icon */}
        <div className="flex flex-col items-center">
          {/* Status icon */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2',
              getStatusColor()
            )}
          >
            {getStatusIcon()}
          </div>

          {/* Connection line */}
          {!isLast && (
            <div
              className={cn(
                'mt-2 h-8 w-0.5',
                isDark ? 'bg-stone-600' : 'bg-stone-200'
              )}
            />
          )}
        </div>

        {/* Node information */}
        <div className="flex-1 pb-6">
          <div className="mb-1 flex items-center justify-between">
            <h4
              className={cn(
                'font-serif font-medium',
                isDark ? 'text-stone-200' : 'text-stone-800'
              )}
            >
              {node.title}
            </h4>

            {getElapsedTime() && (
              <span
                className={cn(
                  'rounded px-2 py-1 font-serif text-xs',
                  isDark
                    ? 'bg-stone-700 text-stone-300'
                    : 'bg-stone-100 text-stone-600'
                )}
              >
                {getElapsedTime()}
              </span>
            )}
          </div>

          <p
            className={cn(
              'font-serif text-sm',
              node.status === 'running'
                ? isDark
                  ? 'text-yellow-400'
                  : 'text-yellow-600'
                : node.status === 'completed'
                  ? isDark
                    ? 'text-green-400'
                    : 'text-green-600'
                  : node.status === 'failed'
                    ? isDark
                      ? 'text-red-400'
                      : 'text-red-600'
                    : isDark
                      ? 'text-stone-400'
                      : 'text-stone-500'
            )}
          >
            {node.status === 'running' && t('executing')}
            {node.status === 'completed' && t('nodeCompleted')}
            {node.status === 'failed' && t('nodeFailed')}
            {node.status === 'pending' && t('nodePending')}
          </p>
        </div>
      </div>
    </div>
  );
}
