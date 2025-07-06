'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Loader2, RotateCcw, Save } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface SaveActionsProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SaveActions({
  hasChanges,
  isSaving,
  onSave,
  onReset,
}: SaveActionsProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.content.saveActions');

  return (
    <div
      className={cn(
        'flex items-center justify-between border-t bg-gradient-to-r p-4',
        isDark
          ? 'to-stone-750 border-stone-600 from-stone-800'
          : 'border-stone-200 from-stone-50 to-white'
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {hasChanges && (
          <>
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span
              className={cn(
                'text-sm',
                isDark ? 'text-stone-300' : 'text-stone-600'
              )}
            >
              {t('hasChanges')}
            </span>
          </>
        )}
        {isSaving && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span
              className={cn(
                'text-sm',
                isDark ? 'text-stone-300' : 'text-stone-600'
              )}
            >
              {t('saving')}
            </span>
          </>
        )}
        {!hasChanges && !isSaving && (
          <span
            className={cn(
              'text-sm',
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}
          >
            {t('allSaved')}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={!hasChanges || isSaving}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            hasChanges && !isSaving
              ? isDark
                ? 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              : 'cursor-not-allowed opacity-50',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          <RotateCcw className="h-4 w-4" />
          {t('reset')}
        </button>

        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-colors',
            hasChanges && !isSaving
              ? isDark
                ? 'bg-stone-100 text-stone-900 hover:bg-white'
                : 'bg-stone-900 text-white hover:bg-stone-800'
              : 'cursor-not-allowed opacity-50',
            isDark && (!hasChanges || isSaving)
              ? 'bg-stone-600 text-stone-400'
              : '',
            !isDark && (!hasChanges || isSaving)
              ? 'bg-stone-300 text-stone-500'
              : ''
          )}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? t('saving_') : t('save')}
        </button>
      </div>
    </div>
  );
}
