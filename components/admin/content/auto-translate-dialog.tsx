'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import type { SupportedLocale } from '@lib/config/language-config';
import { getLanguageInfo } from '@lib/config/language-config';
import { cn } from '@lib/utils';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

interface AutoTranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLocale: SupportedLocale;
  sourceContent: any;
  section: string;
  supportedLocales: SupportedLocale[];
  onTranslationComplete: () => void;
}

export function AutoTranslateDialog({
  open,
  onOpenChange,
  sourceLocale,
  sourceContent,
  section,
  supportedLocales,
  onTranslationComplete,
}: AutoTranslateDialogProps) {
  const t = useTranslations('pages.admin.content.editor.autoTranslate');

  const [selectedLocales, setSelectedLocales] = useState<Set<SupportedLocale>>(
    new Set()
  );
  const [isTranslating, setIsTranslating] = useState(false);

  // Get available target languages (exclude source locale)
  const targetLanguages = supportedLocales.filter(
    locale => locale !== sourceLocale
  );

  const handleToggleLocale = (locale: SupportedLocale) => {
    const newSelected = new Set(selectedLocales);
    if (newSelected.has(locale)) {
      newSelected.delete(locale);
    } else {
      newSelected.add(locale);
    }
    setSelectedLocales(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedLocales(new Set(targetLanguages));
  };

  const handleDeselectAll = () => {
    setSelectedLocales(new Set());
  };

  const handleTranslate = async () => {
    if (selectedLocales.size === 0) {
      toast.error(t('noLanguagesSelected'));
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/admin/auto-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceLocale,
          targetLocales: Array.from(selectedLocales),
          content: sourceContent,
          section,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Translation failed');
      }

      // Show success or partial success message
      if (result.totalErrors === 0) {
        toast.success(
          t('successMessage', { count: result.totalSuccess })
        );
      } else {
        toast.warning(
          t('partialSuccessMessage', {
            success: result.totalSuccess,
            total: result.totalProcessed,
            failed: result.totalErrors,
          })
        );
      }

      // Close dialog and notify parent
      onOpenChange(false);
      onTranslationComplete();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('errorMessage', { error: errorMessage }));
    } finally {
      setIsTranslating(false);
    }
  };

  // Reset selection when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isTranslating) {
      setSelectedLocales(new Set());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md',
          'bg-white dark:bg-stone-900',
          'border-stone-200 dark:border-stone-700'
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              'text-xl font-semibold',
              'text-stone-900 dark:text-stone-100'
            )}
          >
            {t('dialogTitle')}
          </DialogTitle>
          <DialogDescription
            className={cn('text-sm', 'text-stone-600 dark:text-stone-400')}
          >
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Language Display */}
          <div>
            <label
              className={cn(
                'mb-2 block text-sm font-medium',
                'text-stone-700 dark:text-stone-300'
              )}
            >
              {t('sourceLanguage')}
            </label>
            <div
              className={cn(
                'rounded-lg border px-3 py-2',
                'border-stone-300 bg-stone-50 dark:border-stone-600 dark:bg-stone-800'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60">
                  {getLanguageInfo(sourceLocale).code}
                </span>
                <span className="font-medium">
                  {getLanguageInfo(sourceLocale).nativeName}
                </span>
              </div>
            </div>
          </div>

          {/* Target Languages Selection */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                className={cn(
                  'text-sm font-medium',
                  'text-stone-700 dark:text-stone-300'
                )}
              >
                {t('selectTargetLanguages')}
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={handleSelectAll}
                  disabled={isTranslating}
                  className={cn(
                    'transition-colors',
                    'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
                    isTranslating && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {t('selectAll')}
                </button>
                <span className="text-stone-400">|</span>
                <button
                  onClick={handleDeselectAll}
                  disabled={isTranslating}
                  className={cn(
                    'transition-colors',
                    'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
                    isTranslating && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {t('deselectAll')}
                </button>
              </div>
            </div>

            <div
              className={cn(
                'max-h-60 space-y-2 overflow-y-auto rounded-lg border p-3',
                'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800'
              )}
            >
              {targetLanguages.map(locale => {
                const langInfo = getLanguageInfo(locale);
                const isSelected = selectedLocales.has(locale);

                return (
                  <label
                    key={locale}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors',
                      isSelected
                        ? 'bg-stone-100 dark:bg-stone-700'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800',
                      isTranslating && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleLocale(locale)}
                        disabled={isTranslating}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-stone-400 transition-colors checked:border-stone-900 checked:bg-stone-900 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:cursor-not-allowed dark:border-stone-500 dark:checked:border-stone-100 dark:checked:bg-stone-100"
                      />
                      <Check
                        className={cn(
                          'pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100 dark:text-stone-900'
                        )}
                      />
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <span
                        className={cn(
                          'font-medium',
                          'text-stone-900 dark:text-stone-100'
                        )}
                      >
                        {langInfo.nativeName}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          'text-stone-500 dark:text-stone-400'
                        )}
                      >
                        {langInfo.code}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Warning Message */}
          <div
            className={cn(
              'flex gap-2 rounded-lg border p-3',
              'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20'
            )}
          >
            <AlertCircle
              className={cn(
                'h-4 w-4 flex-shrink-0',
                'text-orange-600 dark:text-orange-400'
              )}
            />
            <p
              className={cn(
                'text-xs',
                'text-orange-800 dark:text-orange-300'
              )}
            >
              {t('warningMessage')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => handleOpenChange(false)}
            disabled={isTranslating}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
              'dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700',
              isTranslating && 'cursor-not-allowed opacity-50'
            )}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleTranslate}
            disabled={selectedLocales.size === 0 || isTranslating}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors',
              selectedLocales.size > 0 && !isTranslating
                ? 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white'
                : 'cursor-not-allowed bg-stone-300 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
            )}
          >
            {isTranslating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isTranslating ? t('translating') : t('translateAndSave')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
