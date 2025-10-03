'use client';

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
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-gray-100">
            {t('header.title')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 font-serif text-sm text-stone-600 dark:text-stone-400">
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
            <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400">
              {t('header.totalLabel', { count: totalApps })}
            </span>
          )}
      </div>
    </div>
  );
}
