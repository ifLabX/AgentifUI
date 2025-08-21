'use client';

import { cn } from '@lib/utils';
import { CheckSquare, Square, Trash2, X } from 'lucide-react';

import * as React from 'react';

import { useTranslations } from 'next-intl';

// History conversation selection operation bar component
// Provides full selection, cancel selection, and batch deletion functions
interface HistorySelectionBarProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
  onCancelSelection: () => void;
  isDeleting?: boolean;
}

export function HistorySelectionBar({
  isSelectionMode,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onCancelSelection,
  isDeleting = false,
}: HistorySelectionBarProps) {
  const t = useTranslations('history');

  // If not in selection mode and no items are selected, do not display the operation bar
  if (!isSelectionMode && selectedCount === 0) {
    return null;
  }

  const allSelected = selectedCount === totalCount && totalCount > 0;
  const hasSelection = selectedCount > 0;

  return (
    <div
      className={cn(
        'sticky top-0 z-10 transition-all duration-300 ease-in-out',
        'mb-4 rounded-xl backdrop-blur-sm',
        'bg-gradient-to-r',
        'border border-stone-200/80 from-stone-50/95 via-white/90 to-stone-50/95 shadow-lg shadow-stone-900/10 dark:border-stone-600/50 dark:from-stone-800/95 dark:via-stone-800/90 dark:to-stone-800/95 dark:shadow-stone-900/20'
      )}
    >
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* --- Left: selection status and full selection button --- */}
          <div className="flex items-center space-x-4">
            {/* Full selection/cancel full selection button */}
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className={cn(
                'flex items-center space-x-2 rounded-md px-3 py-1.5',
                'transition-all duration-200 ease-in-out',
                'font-serif text-sm font-medium',
                'hover:scale-105 hover:shadow-md',
                'border border-stone-300 text-stone-600 hover:bg-stone-200 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'
              )}
              disabled={totalCount === 0}
            >
              {allSelected ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              <span>{allSelected ? t('deselectAll') : t('selectAll')}</span>
            </button>

            {/* Selection status display */}
            {hasSelection && (
              <div
                className={cn(
                  'font-serif text-xs',
                  'text-stone-500 dark:text-stone-400'
                )}
              >
                {t('selected', { count: selectedCount, total: totalCount })}
              </div>
            )}
          </div>

          {/* --- Right: operation button --- */}
          <div className="flex items-center space-x-2">
            {/* Batch delete button */}
            {hasSelection && (
              <button
                onClick={onBatchDelete}
                disabled={isDeleting}
                className={cn(
                  'flex items-center space-x-2 rounded-md px-3 py-1.5',
                  'transition-all duration-200 ease-in-out',
                  'font-serif text-sm font-medium',
                  'hover:scale-105 hover:shadow-lg',
                  isDeleting && 'cursor-not-allowed opacity-50',
                  'border border-red-300 bg-red-50 text-red-700 shadow-md shadow-red-900/10 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300 dark:shadow-red-900/20 dark:hover:bg-red-900/60'
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {isDeleting
                    ? t('deleting')
                    : t('deleteCount', { count: selectedCount })}
                </span>
              </button>
            )}

            {/* Cancel selection button */}
            <button
              onClick={onCancelSelection}
              className={cn(
                'flex items-center space-x-1 rounded-md px-3 py-1.5',
                'transition-all duration-200 ease-in-out',
                'font-serif text-sm font-medium',
                'hover:scale-105 hover:shadow-md',
                'border border-stone-300 text-stone-500 hover:bg-stone-200 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700'
              )}
            >
              <X className="h-3.5 w-3.5" />
              <span>{t('cancel')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
