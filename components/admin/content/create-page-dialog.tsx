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
import { Languages, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const supportedLocales: SupportedLocale[] = [
  'en-US',
  'zh-CN',
  'es-ES',
  'zh-TW',
  'ja-JP',
  'de-DE',
  'fr-FR',
  'ru-RU',
  'it-IT',
  'pt-PT',
];

export function CreatePageDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePageDialogProps) {
  const [slug, setSlug] = useState('');
  const [titles, setTitles] = useState<Record<string, string>>({
    'en-US': '',
    'zh-CN': '',
    'es-ES': '',
    'zh-TW': '',
    'ja-JP': '',
    'de-DE': '',
    'fr-FR': '',
    'ru-RU': '',
    'it-IT': '',
    'pt-PT': '',
  });
  const [isPublished, setIsPublished] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sourceLocale, setSourceLocale] = useState<SupportedLocale>('en-US');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleAutoTranslate = async () => {
    const sourceTitle = titles[sourceLocale]?.trim();

    if (!sourceTitle) {
      toast.error(`Please enter a title in ${getLanguageInfo(sourceLocale).nativeName} first`);
      return;
    }

    setIsTranslating(true);

    try {
      // Get target locales (all except source)
      const targetLocales = supportedLocales.filter(
        locale => locale !== sourceLocale
      );

      const response = await fetch('/api/admin/translate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLocale,
          targetLocales,
          content: { title: sourceTitle },
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();

      if (result.success) {
        // Update titles with translated values
        const newTitles = { ...titles };
        let successCount = 0;

        for (const [locale, translationResult] of Object.entries(result.results)) {
          const result = translationResult as any;
          if (result.success && result.translatedContent?.title) {
            newTitles[locale] = result.translatedContent.title;
            successCount++;
          }
        }

        setTitles(newTitles);
        toast.success(`Successfully translated to ${successCount} languages`);
      } else {
        toast.error('Translation failed');
      }
    } catch (error) {
      console.error('Auto-translate error:', error);
      toast.error('Failed to translate titles');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCreate = async () => {
    // Validate slug
    if (!slug.trim()) {
      toast.error('Please enter a route path');
      return;
    }

    if (!slug.startsWith('/')) {
      toast.error('Route path must start with /');
      return;
    }

    if (!/^\/[a-zA-Z0-9/_-]+$/.test(slug)) {
      toast.error('Route path contains invalid characters. Use only letters, numbers, /, _, and -');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/dynamic-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: slug.trim(),
          titles,
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create page');
        return;
      }

      toast.success(`Page "${slug}" created successfully!`);
      setSlug('');
      setTitles({
        'en-US': '',
        'zh-CN': '',
        'es-ES': '',
        'zh-TW': '',
        'ja-JP': '',
        'de-DE': '',
        'fr-FR': '',
        'ru-RU': '',
        'it-IT': '',
        'pt-PT': '',
      });
      setIsPublished(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create page:', error);
      toast.error('Failed to create page');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Page
          </DialogTitle>
          <DialogDescription>
            Create a new dynamic page route. The page will be accessible at the
            specified path.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto py-4">
          {/* Route Path Input */}
          <div className="space-y-2">
            <label
              htmlFor="slug"
              className={cn(
                'text-sm font-medium',
                'text-stone-700 dark:text-stone-300'
              )}
            >
              Route Path <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="/contact"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm font-mono',
                'border-stone-300 bg-white text-stone-900',
                'dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100',
                'focus:ring-2 focus:ring-stone-500 focus:outline-none'
              )}
              disabled={isCreating}
            />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Examples: /contact, /services, /services/consulting
            </p>
          </div>

          {/* Page Titles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                className={cn(
                  'text-sm font-medium',
                  'text-stone-700 dark:text-stone-300'
                )}
              >
                Page Titles (for tabs)
              </label>
            </div>

            {/* Source Language Selector and Auto-Translate Button */}
            <div className="flex items-center gap-2">
              <Select
                value={sourceLocale}
                onValueChange={value => setSourceLocale(value as SupportedLocale)}
                disabled={isCreating || isTranslating}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLocales.map(locale => {
                    const langInfo = getLanguageInfo(locale);
                    return (
                      <SelectItem key={locale} value={locale}>
                        {langInfo.nativeName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoTranslate}
                disabled={isCreating || isTranslating || !titles[sourceLocale]?.trim()}
                className="flex-1"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="mr-2 h-4 w-4" />
                    Auto-Translate
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(titles).map(([locale, title]) => {
                const isSourceLocale = locale === sourceLocale;
                return (
                  <div key={locale} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-16 text-xs',
                        isSourceLocale
                          ? 'font-semibold text-blue-600 dark:text-blue-400'
                          : 'text-stone-500 dark:text-stone-400'
                      )}
                    >
                      {locale}
                      {isSourceLocale && ' ★'}
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={e =>
                        setTitles({ ...titles, [locale]: e.target.value })
                      }
                      placeholder={
                        locale === 'en-US'
                          ? 'Help'
                          : locale === 'zh-CN'
                            ? '帮助'
                            : ''
                      }
                      className={cn(
                        'flex-1 rounded border px-2 py-1.5 text-sm',
                        'focus:ring-2 focus:ring-stone-500 focus:outline-none',
                        isSourceLocale
                          ? 'border-blue-400 bg-blue-50 text-stone-900 dark:border-blue-600 dark:bg-blue-950 dark:text-stone-100'
                          : 'border-stone-300 bg-white text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'
                      )}
                      disabled={isCreating || isTranslating}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className={cn(
                'h-4 w-4 rounded border-stone-300',
                'text-stone-900 focus:ring-2 focus:ring-stone-500',
                'dark:border-stone-600 dark:bg-stone-800'
              )}
              disabled={isCreating}
            />
            <label
              htmlFor="isPublished"
              className={cn(
                'text-sm font-medium',
                'text-stone-700 dark:text-stone-300'
              )}
            >
              Publish immediately
            </label>
          </div>

          {/* Info Note */}
          <div
            className={cn(
              'rounded-lg border p-3',
              'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
            )}
          >
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> After creating the page, you can edit its
              content using the visual editor in the content tabs above.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
