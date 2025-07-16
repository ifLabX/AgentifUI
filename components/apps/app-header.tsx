'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';
import { Package } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface AppHeaderProps {
  totalApps: number;
  filteredApps: number;
  selectedCategory: string;
}

export function AppHeader({
  totalApps,
  filteredApps,
  selectedCategory,
}: AppHeaderProps) {
  const { colors, isDark } = useThemeColors();
  const t = useTranslations('pages.apps.market');

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-gradient-to-br from-blue-500 to-purple-600'
          )}
        >
          <Package className="h-4 w-4 text-white" />
        </div>

        <div>
          <h1
            className={cn(
              'font-serif text-2xl font-bold',
              colors.mainText.tailwind
            )}
          >
            {t('header.title')}
          </h1>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center gap-4 font-serif text-sm',
          isDark ? 'text-stone-400' : 'text-stone-600'
        )}
      >
        <span>
          {selectedCategory === t('categoryKeys.all')
            ? t('header.totalApps', { count: totalApps })
            : t('header.categoryApps', {
                category: selectedCategory,
                count: filteredApps,
              })}
        </span>
        {selectedCategory !== t('categoryKeys.all') &&
          filteredApps !== totalApps && (
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs',
                isDark
                  ? 'bg-stone-800 text-stone-400'
                  : 'bg-stone-100 text-stone-600'
              )}
            >
              {t('header.totalLabel', { count: totalApps })}
            </span>
          )}
      </div>
    </div>
  );
}
