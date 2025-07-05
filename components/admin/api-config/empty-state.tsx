'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Settings } from 'lucide-react';

import { useTranslations } from 'next-intl';

export const EmptyState = () => {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.apiConfig.emptyState');

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center">
        <Settings className="mx-auto mb-4 h-16 w-16 text-stone-400" />
        <h3
          className={cn(
            'mb-2 font-serif text-lg font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {t('title')}
        </h3>
        <p
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          {t('description')}
        </p>
      </div>
    </div>
  );
};
