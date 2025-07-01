'use client';

import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { useTheme } from '@lib/hooks/use-theme';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';
import {
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface ExecutionItemProps {
  execution: any;
  onClick: () => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
}

/**
 * 单个执行记录项组件
 *
 * 显示执行记录的基本信息和状态
 */
export function ExecutionItem({
  execution,
  onClick,
  isMultiSelectMode,
  isSelected,
  isLoading,
}: ExecutionItemProps) {
  const { isDark } = useTheme();
  const { colors } = useThemeColors();
  const t = useTranslations('pages.workflow.status');
  const { formatDate } = useDateFormatter();

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'completed':
        return (
          <CheckCircle
            className={cn(
              'h-3.5 w-3.5',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
        );
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'running':
        return (
          <Clock
            className={cn(
              'h-3.5 w-3.5 animate-pulse',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
        );
      default:
        return (
          <Clock
            className={cn(
              'h-3.5 w-3.5',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
        );
    }
  };

  const getStatusText = () => {
    switch (execution.status) {
      case 'completed':
        return t('completed');
      case 'failed':
        return t('failed');
      case 'running':
        return t('running');
      default:
        return t('unknown');
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-md border p-3 transition-all duration-200',
        'hover:scale-[1.01] hover:shadow-md',
        // 选中状态样式
        isMultiSelectMode &&
          isSelected &&
          (isDark
            ? 'border-stone-500 bg-stone-600/50'
            : 'border-stone-400 bg-stone-300/50'),
        // 默认样式
        (!isMultiSelectMode || !isSelected) &&
          (isDark
            ? 'border-stone-700/50 bg-stone-700/30 hover:border-stone-600/50 hover:bg-stone-700/50'
            : 'border-stone-300/50 bg-stone-50/50 hover:border-stone-400/50 hover:bg-stone-200/50')
      )}
    >
      <div className="flex items-center justify-between">
        {/* 多选模式下的复选框 */}
        {isMultiSelectMode && (
          <div
            className={cn(
              'mr-3 flex h-4 w-4 items-center justify-center rounded border',
              isSelected
                ? isDark
                  ? 'border-stone-500 bg-stone-500'
                  : 'border-stone-600 bg-stone-600'
                : isDark
                  ? 'border-stone-600'
                  : 'border-stone-300'
            )}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* 标题和状态 */}
          <div className="mb-1.5 flex items-center gap-2">
            {getStatusIcon()}
            <h3
              className={cn(
                'truncate font-serif text-sm font-medium',
                colors.mainText.tailwind
              )}
            >
              {execution.title}
            </h3>
          </div>

          {/* 时间和耗时 */}
          <div className="flex items-center gap-3 font-serif text-xs">
            <span className={cn(isDark ? 'text-stone-500' : 'text-stone-500')}>
              {formatDate(execution.created_at, DateFormatPresets.dateTime)}
            </span>

            {execution.elapsed_time && (
              <span
                className={cn(isDark ? 'text-stone-500' : 'text-stone-500')}
              >
                {execution.elapsed_time}s
              </span>
            )}
          </div>

          {/* 错误信息 */}
          {execution.status === 'failed' && execution.error_message && (
            <div className="mt-1.5 truncate font-serif text-xs text-red-500">
              {execution.error_message}
            </div>
          )}
        </div>

        {/* 状态标签 */}
        <div className="ml-3 flex items-center gap-2">
          <span
            className={cn(
              'rounded-sm px-2 py-0.5 font-serif text-xs',
              execution.status === 'completed' &&
                (isDark
                  ? 'bg-stone-700/50 text-stone-300'
                  : 'bg-stone-200/50 text-stone-700'),
              execution.status === 'failed' &&
                (isDark
                  ? 'bg-red-900/30 text-red-400'
                  : 'bg-red-100/50 text-red-700'),
              execution.status === 'running' &&
                (isDark
                  ? 'bg-stone-600/50 text-stone-300'
                  : 'bg-stone-300/50 text-stone-700')
            )}
          >
            {getStatusText()}
          </span>

          {/* 只在非多选模式下显示箭头或loading */}
          {!isMultiSelectMode &&
            (isLoading ? (
              <Loader2
                className={cn(
                  'h-3.5 w-3.5 animate-spin',
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )}
              />
            ) : (
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5',
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
