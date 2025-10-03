'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { X } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface TagsSelectorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagsSelector = ({ tags, onTagsChange }: TagsSelectorProps) => {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.apiConfig.fields');

  const handleTagToggle = (tag: string) => {
    const isSelected = tags.includes(tag);
    if (isSelected) {
      onTagsChange(tags.filter(t => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  };

  const handleCustomTagAdd = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };

  const handleTagRemove = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label
        className={cn(
          'mb-2 block font-serif text-sm font-medium',
          isDark ? 'text-stone-300' : 'text-stone-700'
        )}
      >
        {t('tagsLabel')}
      </label>
      <div className="space-y-3">
        <div className="space-y-3">
          <div>
            <div
              className={cn(
                'mb-2 font-serif text-xs font-medium',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {t('tagCategories.modelType')}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                t('predefinedTags.conversationModel'),
                t('predefinedTags.reasoningModel'),
                t('predefinedTags.documentModel'),
                t('predefinedTags.multimodal'),
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'cursor-pointer rounded px-2 py-1.5 font-serif text-xs font-medium transition-colors',
                    tags.includes(tag)
                      ? isDark
                        ? 'border border-stone-500 bg-stone-600 text-stone-200'
                        : 'border border-stone-300 bg-stone-200 text-stone-800'
                      : isDark
                        ? 'border border-stone-600 bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                        : 'border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              className={cn(
                'mb-2 font-serif text-xs font-medium',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {t('tagCategories.useCase')}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                t('predefinedTags.textGeneration'),
                t('predefinedTags.codeGeneration'),
                t('predefinedTags.dataAnalysis'),
                t('predefinedTags.translation'),
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'cursor-pointer rounded px-2 py-1.5 font-serif text-xs font-medium transition-colors',
                    tags.includes(tag)
                      ? isDark
                        ? 'border border-stone-500 bg-stone-600 text-stone-200'
                        : 'border border-stone-300 bg-stone-200 text-stone-800'
                      : isDark
                        ? 'border border-stone-600 bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                        : 'border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              className={cn(
                'mb-2 font-serif text-xs font-medium',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {t('tagCategories.features')}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                t('predefinedTags.highAccuracy'),
                t('predefinedTags.fastResponse'),
                t('predefinedTags.localDeployment'),
                t('predefinedTags.enterpriseGrade'),
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'cursor-pointer rounded px-2 py-1.5 font-serif text-xs font-medium transition-colors',
                    tags.includes(tag)
                      ? isDark
                        ? 'border border-stone-500 bg-stone-600 text-stone-200'
                        : 'border border-stone-300 bg-stone-200 text-stone-800'
                      : isDark
                        ? 'border border-stone-600 bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                        : 'border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('customTagPlaceholder')}
            className={cn(
              'flex-1 rounded border px-2 py-1.5 font-serif text-xs',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
            )}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                const tag = input.value.trim();
                handleCustomTagAdd(tag);
                input.value = '';
              }
            }}
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-serif text-xs font-medium',
                  isDark
                    ? 'border border-stone-600 bg-stone-700 text-stone-300'
                    : 'border border-stone-300 bg-stone-100 text-stone-700'
                )}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(index)}
                  className={cn(
                    'rounded-full p-0.5 transition-colors hover:bg-red-500 hover:text-white',
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            ))}
          </div>
        )}

        <p
          className={cn(
            'font-serif text-xs',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          {t('tagHelpText')}
        </p>
      </div>
    </div>
  );
};
