'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import type { SupportedLocale } from '@lib/config/language-config';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Plus, Trash2 } from 'lucide-react';

import React from 'react';

// --- BEGIN COMMENT ---
// 编辑器现在直接处理翻译对象，不再需要独立的配置类型
// --- END COMMENT ---

interface AboutEditorProps {
  translations: Record<SupportedLocale, any>;
  currentLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  onTranslationsChange: (newTranslations: Record<SupportedLocale, any>) => void;
  onLocaleChange: (newLocale: SupportedLocale) => void;
}

export function AboutEditor({
  translations,
  currentLocale,
  supportedLocales,
  onTranslationsChange,
  onLocaleChange,
}: AboutEditorProps) {
  const { isDark } = useTheme();
  const currentTranslation = translations[currentLocale] || {};

  // --- BEGIN COMMENT ---
  // 统一的字段更新处理器，支持点状路径
  // --- END COMMENT ---
  const handleFieldChange = (field: string, value: any) => {
    const newTranslations = JSON.parse(JSON.stringify(translations)); // Deep copy
    const fieldParts = field.split('.');
    let current = newTranslations[currentLocale];

    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }

    current[fieldParts[fieldParts.length - 1]] = value;
    onTranslationsChange(newTranslations);
  };

  const handleValueCardChange = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const newItems = [...(currentTranslation.values?.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    handleFieldChange('values.items', newItems);
  };

  const addValueCard = () => {
    const newItems = [
      ...(currentTranslation.values?.items || []),
      { title: '', description: '' },
    ];
    handleFieldChange('values.items', newItems);
  };

  const removeValueCard = (index: number) => {
    const newItems = (currentTranslation.values?.items || []).filter(
      (_: any, i: number) => i !== index
    );
    handleFieldChange('values.items', newItems);
  };

  return (
    <div className="space-y-6">
      {/* --- BEGIN COMMENT ---
      语言切换器
      --- END COMMENT --- */}
      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          编辑语言
        </label>
        <Select
          value={currentLocale}
          onValueChange={value => onLocaleChange(value as SupportedLocale)}
        >
          <SelectTrigger
            className={cn(
              isDark
                ? 'border-stone-600 bg-stone-700'
                : 'border-stone-300 bg-white'
            )}
          >
            <SelectValue placeholder="选择语言" />
          </SelectTrigger>
          <SelectContent>
            {supportedLocales.map(locale => (
              <SelectItem key={locale} value={locale}>
                {locale}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* --- BEGIN COMMENT ---
      页面标题设置
      --- END COMMENT --- */}
      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          页面标题 (title)
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

      {/* --- BEGIN COMMENT ---
      副标题设置
      --- END COMMENT --- */}
      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          副标题 (subtitle)
        </label>
        <input
          type="text"
          value={currentTranslation.subtitle || ''}
          onChange={e => handleFieldChange('subtitle', e.target.value)}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm',
            isDark
              ? 'border-stone-600 bg-stone-700 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
      </div>

      {/* --- BEGIN COMMENT ---
      使命描述
      --- END COMMENT --- */}
      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          使命描述 (mission.description)
        </label>
        <textarea
          value={currentTranslation.mission?.description || ''}
          onChange={e =>
            handleFieldChange('mission.description', e.target.value)
          }
          rows={4}
          className={cn(
            'w-full resize-none rounded-lg border px-3 py-2 text-sm',
            isDark
              ? 'border-stone-600 bg-stone-700 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
      </div>

      {/* --- BEGIN COMMENT ---
      价值观卡片管理
      --- END COMMENT --- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label
            className={cn(
              'block text-sm font-medium',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            价值观卡片 (values.items)
          </label>
          <button
            onClick={addValueCard}
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
          {(currentTranslation.values?.items || []).map(
            (card: any, index: number) => (
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
                    卡片 #{index + 1}
                  </p>
                  <button
                    onClick={() => removeValueCard(index)}
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
                    placeholder="标题 (title)"
                    value={card.title}
                    onChange={e =>
                      handleValueCardChange(index, 'title', e.target.value)
                    }
                    className={cn(
                      'w-full rounded-md border px-3 py-1.5 text-sm',
                      isDark
                        ? 'border-stone-500 bg-stone-600 text-stone-100'
                        : 'border-stone-300 bg-white text-stone-900'
                    )}
                  />
                  <textarea
                    placeholder="描述 (description)"
                    value={card.description}
                    onChange={e =>
                      handleValueCardChange(
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

      {/* --- BEGIN COMMENT ---
      按钮文字
      --- END COMMENT --- */}
      <div>
        <label
          className={cn(
            'mb-2 block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          按钮文字 (buttonText)
        </label>
        <input
          type="text"
          value={currentTranslation.buttonText || ''}
          onChange={e => handleFieldChange('buttonText', e.target.value)}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm',
            isDark
              ? 'border-stone-600 bg-stone-700 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
      </div>

      {/* --- BEGIN COMMENT ---
      版权信息
      --- END COMMENT --- */}
      <div className="space-y-3 rounded-lg border p-4">
        <label
          className={cn(
            'block text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          版权信息 (copyright)
        </label>

        <input
          type="text"
          placeholder="前缀 (prefix)"
          value={currentTranslation.copyright?.prefix || ''}
          onChange={e => handleFieldChange('copyright.prefix', e.target.value)}
          className={cn(
            'w-full rounded-md border px-3 py-1.5 text-sm',
            isDark
              ? 'border-stone-500 bg-stone-600 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
        <input
          type="text"
          placeholder="链接文字 (linkText)"
          value={currentTranslation.copyright?.linkText || ''}
          onChange={e =>
            handleFieldChange('copyright.linkText', e.target.value)
          }
          className={cn(
            'w-full rounded-md border px-3 py-1.5 text-sm',
            isDark
              ? 'border-stone-500 bg-stone-600 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
        <input
          type="text"
          placeholder="后缀 (suffix)"
          value={currentTranslation.copyright?.suffix || ''}
          onChange={e => handleFieldChange('copyright.suffix', e.target.value)}
          className={cn(
            'w-full rounded-md border px-3 py-1.5 text-sm',
            isDark
              ? 'border-stone-500 bg-stone-600 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          )}
        />
      </div>
    </div>
  );
}
