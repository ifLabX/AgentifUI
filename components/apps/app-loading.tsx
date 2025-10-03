'use client';

import { cn } from '@lib/utils';

import { useTranslations } from 'next-intl';

export function AppLoading() {
  const t = useTranslations('loading');

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-stone-600"></div>
          <span className="ml-3 font-serif text-stone-600 dark:text-stone-400">
            {t('appList')}
          </span>
        </div>
      </div>
    </div>
  );
}
