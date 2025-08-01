'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import type { SupportedLocale } from '@lib/config/language-config';
import { getLanguageInfo } from '@lib/config/language-config';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Plus, Trash2 } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface FeatureItem {
  title: string;
  description: string;
}

interface HomeTranslation {
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
  getStarted?: string;
  learnMore?: string;
  copyright?: {
    prefix?: string;
    linkText?: string;
    suffix?: string;
  };
}

interface HomeEditorProps {
  translations: Record<SupportedLocale, HomeTranslation>;
  currentLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  onTranslationsChange: (
    newTranslations: Record<SupportedLocale, HomeTranslation>
  ) => void;
  onLocaleChange: (newLocale: SupportedLocale) => void;
}

export function HomeEditor({
  translations,
  currentLocale,
  supportedLocales,
  onTranslationsChange,
  onLocaleChange,
}: HomeEditorProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.content.editor');
  const currentTranslation = translations[currentLocale] || {};

  const handleFieldChange = (field: string, value: string | FeatureItem[]) => {
    const newTranslations = JSON.parse(JSON.stringify(translations)) as Record<
      SupportedLocale,
      HomeTranslation
    >;
    const fieldParts = field.split('.');
    let current = newTranslations[currentLocale] as any;

    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }

    current[fieldParts[fieldParts.length - 1]] = value;
    onTranslationsChange(newTranslations);
  };

  const handleFeatureCardChange = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const newItems = [...(currentTranslation.features || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    handleFieldChange('features', newItems);
  };

  const addFeatureCard = () => {
    const newItems = [
      ...(currentTranslation.features || []),
      { title: '', description: '' },
    ];
    handleFieldChange('features', newItems);
  };

  const removeFeatureCard = (index: number) => {
    const newItems = (currentTranslation.features || []).filter(
      (_: FeatureItem, i: number) => i !== index
    );
    handleFieldChange('features', newItems);
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {t('common.editLanguage')}
        </label>
        <Select
          value={currentLocale}
          onValueChange={value => onLocaleChange(value as SupportedLocale)}
        >
          <SelectTrigger
            className={cn(
              'w-full transition-all duration-200 focus:ring-2 focus:ring-offset-2',
              isDark
                ? 'border-stone-600 bg-stone-800 text-stone-100 hover:border-stone-500 hover:bg-stone-700 focus:ring-stone-400'
                : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50 focus:ring-stone-500'
            )}
          >
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60">
                  {getLanguageInfo(currentLocale).code}
                </span>
                <span className="font-medium">
                  {getLanguageInfo(currentLocale).nativeName}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            className={cn(
              'border shadow-lg',
              isDark
                ? 'border-stone-600 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            {supportedLocales.map(locale => {
              const langInfo = getLanguageInfo(locale);
              return (
                <SelectItem
                  key={locale}
                  value={locale}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isDark
                      ? 'hover:bg-stone-700 focus:bg-stone-700'
                      : 'hover:bg-stone-100 focus:bg-stone-100'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{langInfo.nativeName}</span>
                    <span className="ml-2 text-xs opacity-60">
                      {langInfo.code}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {t('home.pageTitle')}
        </label>
        <input
          type="text"
          value={currentTranslation.title || ''}
          onChange={e => handleFieldChange('title', e.target.value)}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm',
            isDark
              ? 'border-stone-600 bg-stone-700 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
      </div>

      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {t('home.subtitle')}
        </label>
        <textarea
          value={currentTranslation.subtitle || ''}
          onChange={e => handleFieldChange('subtitle', e.target.value)}
          rows={3}
          className={cn(
            'w-full resize-none rounded-lg border px-3 py-2 text-sm',
            isDark
              ? 'border-stone-600 bg-stone-700 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label
            className={cn(
              'block text-sm font-medium',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            {t('home.features')}
          </label>
          <button
            onClick={addFeatureCard}
            className={cn(
              'rounded p-1 transition-colors',
              isDark
                ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {(currentTranslation.features || []).map(
            (card: FeatureItem, index: number) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-4',
                  isDark ? 'border-stone-600' : 'border-stone-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-stone-300' : 'text-stone-700'
                    )}
                  >
                    {t('common.cardNumber', { number: index + 1 })}
                  </p>
                  <button
                    onClick={() => removeFeatureCard(index)}
                    className={cn(
                      'rounded p-1 text-red-500 transition-colors',
                      isDark ? 'hover:bg-red-900/50' : 'hover:bg-red-100'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder={t('home.featureTitle')}
                    value={card.title}
                    onChange={e =>
                      handleFeatureCardChange(index, 'title', e.target.value)
                    }
                    className={cn(
                      'w-full rounded-md border px-3 py-1.5 text-sm',
                      isDark
                        ? 'border-stone-500 bg-stone-600 text-stone-100'
                        : 'border-stone-300 bg-white text-stone-900'
                    )}
                  />
                  <textarea
                    placeholder={t('home.featureDescription')}
                    value={card.description}
                    onChange={e =>
                      handleFeatureCardChange(
                        index,
                        'description',
                        e.target.value
                      )
                    }
                    rows={3}
                    className={cn(
                      'w-full resize-none rounded-md border px-3 py-1.5 text-sm',
                      isDark
                        ? 'border-stone-500 bg-stone-600 text-stone-100'
                        : 'border-stone-300 bg-white text-stone-900'
                    )}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            className={cn(
              'mb-2 block text-sm font-medium',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            {t('home.getStarted')}
          </label>
          <input
            type="text"
            value={currentTranslation.getStarted || ''}
            onChange={e => handleFieldChange('getStarted', e.target.value)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100'
                : 'border-stone-300 bg-white text-stone-900'
            )}
          />
        </div>
        <div>
          <label
            className={cn(
              'mb-2 block text-sm font-medium',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            {t('home.learnMore')}
          </label>
          <input
            type="text"
            value={currentTranslation.learnMore || ''}
            onChange={e => handleFieldChange('learnMore', e.target.value)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100'
                : 'border-stone-300 bg-white text-stone-900'
            )}
          />
        </div>
      </div>

      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {t('home.copyright')}
        </label>
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t('home.copyrightPrefix')}
            value={currentTranslation.copyright?.prefix || ''}
            onChange={e =>
              handleFieldChange('copyright.prefix', e.target.value)
            }
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100'
                : 'border-stone-300 bg-white text-stone-900'
            )}
          />
          <input
            type="text"
            placeholder={t('home.copyrightLinkText')}
            value={currentTranslation.copyright?.linkText || ''}
            onChange={e =>
              handleFieldChange('copyright.linkText', e.target.value)
            }
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100'
                : 'border-stone-300 bg-white text-stone-900'
            )}
          />
          <input
            type="text"
            placeholder={t('home.copyrightSuffix')}
            value={currentTranslation.copyright?.suffix || ''}
            onChange={e =>
              handleFieldChange('copyright.suffix', e.target.value)
            }
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100'
                : 'border-stone-300 bg-white text-stone-900'
            )}
          />
        </div>
      </div>
    </div>
  );
}
