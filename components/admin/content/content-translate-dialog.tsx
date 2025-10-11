'use client';

import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import type { SupportedLocale } from '@lib/config/language-config';
import { getLanguageInfo } from '@lib/config/language-config';
import { cn } from '@lib/utils';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

interface ContentTranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLocale: SupportedLocale;
  currentContent: any;
  section: string;
  supportedLocales: SupportedLocale[];
  onTranslationComplete?: (results: any) => void;
}

interface TranslationProgress {
  current: number;
  total: number;
  status: Record<
    SupportedLocale,
    'pending' | 'translating' | 'success' | 'error'
  >;
  errors: Record<SupportedLocale, string>;
}

export function ContentTranslateDialog({
  open,
  onOpenChange,
  sourceLocale,
  currentContent,
  section,
  supportedLocales,
  onTranslationComplete,
}: ContentTranslateDialogProps) {
  const t = useTranslations('pages.admin.content.editor.contentTranslate');
  const tCommon = useTranslations('common.ui');

  const [selectedSourceLocale, setSelectedSourceLocale] =
    useState<SupportedLocale>(sourceLocale);
  const [selectedTargetLocales, setSelectedTargetLocales] = useState<
    Set<SupportedLocale>
  >(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationComplete, setTranslationComplete] = useState(false);
  const [translationResults, setTranslationResults] = useState<any>(null);

  // Filter out source locale from available targets
  const availableTargets = supportedLocales.filter(
    locale => locale !== selectedSourceLocale
  );

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedSourceLocale(sourceLocale);
      setSelectedTargetLocales(new Set());
      setIsTranslating(false);
      setTranslationComplete(false);
      setTranslationResults(null);
    }
  }, [open, sourceLocale]);

  // Handle target language toggle
  const toggleTargetLocale = (locale: SupportedLocale) => {
    const newSelected = new Set(selectedTargetLocales);
    if (newSelected.has(locale)) {
      newSelected.delete(locale);
    } else {
      newSelected.add(locale);
    }
    setSelectedTargetLocales(newSelected);
  };

  // Handle select all
  const selectAll = () => {
    setSelectedTargetLocales(new Set(availableTargets));
  };

  // Handle deselect all
  const deselectAll = () => {
    setSelectedTargetLocales(new Set());
  };

  // Handle translation
  const handleTranslate = async () => {
    if (selectedTargetLocales.size === 0) {
      return;
    }

    console.log('Starting translation...', {
      sourceLocale: selectedSourceLocale,
      targetLocales: Array.from(selectedTargetLocales),
      section,
    });

    setIsTranslating(true);
    setTranslationComplete(false);

    try {
      const requestBody = {
        sourceLocale: selectedSourceLocale,
        targetLocales: Array.from(selectedTargetLocales),
        content: currentContent,
        section: section,
      };

      console.log('Translation request body:', requestBody);

      const response = await fetch('/api/admin/content-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Translation response status:', response.status);

      const result = await response.json();
      console.log('Translation result:', result);

      setTranslationResults(result);
      setTranslationComplete(true);

      if (result.success) {
        onTranslationComplete?.(result);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setTranslationComplete(true);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle close
  const handleClose = () => {
    onOpenChange(false);
  };

  // Render content based on state
  const renderDialogContent = () => {
    // Show results if translation is complete
    if (translationComplete && translationResults) {
      return renderResultsView();
    }

    // Show translation progress if translating
    if (isTranslating) {
      return renderTranslatingView();
    }

    // Show selection form by default
    return renderSelectionView();
  };

  // Render selection view
  const renderSelectionView = () => (
    <>
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Source Language Selector */}
        <div className="space-y-2">
          <Label>{t('sourceLanguage')}</Label>
          <Select
            value={selectedSourceLocale}
            onValueChange={value =>
              setSelectedSourceLocale(value as SupportedLocale)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLocales.map(locale => {
                const langInfo = getLanguageInfo(locale);
                return (
                  <SelectItem key={locale} value={locale}>
                    {langInfo.nativeName} ({locale})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Target Language Checkboxes */}
        <div className="space-y-2">
          <Label>{t('selectTargetLanguages')}</Label>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-4">
            {availableTargets.map(locale => {
              const langInfo = getLanguageInfo(locale);
              const isSelected = selectedTargetLocales.has(locale);
              return (
                <label
                  key={locale}
                  className="flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTargetLocale(locale)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {langInfo.nativeName} ({locale})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Helper Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            {t('selectAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            {t('deselectAll')}
          </Button>
        </div>

        {/* Warning Message */}
        <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t('warningMessage')}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleTranslate}
          disabled={selectedTargetLocales.size === 0}
        >
          {t('startTranslation')}
        </Button>
      </DialogFooter>
    </>
  );

  // Render translating view
  const renderTranslatingView = () => (
    <>
      <DialogHeader>
        <DialogTitle>{t('progress.title')}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">{t('translating')}</p>
        </div>

        <div className="text-center text-sm text-gray-500">
          {t('progress.current', {
            current: 0,
            total: selectedTargetLocales.size,
          })}
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: '0%' }}
          />
        </div>
      </div>
    </>
  );

  // Render results view
  const renderResultsView = () => {
    const { success, totalSuccess, totalErrors, errors, results } =
      translationResults;

    const successfulTranslations = Object.entries(results || {})
      .filter(([_, result]: [string, any]) => result.success)
      .map(([locale]) => locale);

    const failedTranslations = Object.entries(results || {})
      .filter(([_, result]: [string, any]) => !result.success)
      .map(([locale, result]: [string, any]) => ({
        locale,
        error: result.error,
      }));

    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {success
              ? t('success.title')
              : totalSuccess > 0
                ? t('partialSuccess.title')
                : t('error.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success section */}
          {successfulTranslations.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {t('success.message', { count: successfulTranslations.length })}
                </span>
              </div>
              <ul className="space-y-1 pl-6 text-sm text-gray-600">
                {successfulTranslations.map(locale => {
                  const langInfo = getLanguageInfo(locale as SupportedLocale);
                  return (
                    <li key={locale}>
                      • {langInfo.nativeName} ({locale})
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Error section */}
          {failedTranslations.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {t('partialSuccess.failedMessage', {
                    count: failedTranslations.length,
                  })}
                </span>
              </div>
              <ul className="space-y-1 pl-6 text-sm text-gray-600">
                {failedTranslations.map(({ locale, error }) => {
                  const langInfo = getLanguageInfo(locale as SupportedLocale);
                  return (
                    <li key={locale}>
                      • {langInfo.nativeName} ({locale}) - {error}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Saved message */}
          {successfulTranslations.length > 0 && (
            <p className="text-sm text-gray-600">
              {success ? t('success.saved') : t('partialSuccess.saved')}
            </p>
          )}
        </div>

        <DialogFooter>
          {!success && failedTranslations.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setTranslationComplete(false);
                setTranslationResults(null);
                // Keep failed languages selected for retry
                const failedLocales = failedTranslations.map(f =>
                  f.locale as SupportedLocale
                );
                setSelectedTargetLocales(new Set(failedLocales));
              }}
            >
              {t('partialSuccess.retryButton')}
            </Button>
          )}
          <Button onClick={handleClose}>
            {success ? t('success.closeButton') : t('partialSuccess.closeButton')}
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
