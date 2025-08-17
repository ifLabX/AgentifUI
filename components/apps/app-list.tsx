'use client';

import { cn } from '@lib/utils';
import { Blocks } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { AppCard } from './app-card';

interface AppInstance {
  instanceId: string;
  displayName: string;
  description?: string;
  appType: 'model' | 'marketplace';
  iconUrl?: string;
  category?: string;
  tags?: string[];
  difyAppType?: string;
  isPopular?: boolean;
  lastUsed?: string;
  config?: {
    app_metadata?: {
      dify_apptype?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

interface AppListProps {
  apps: AppInstance[];
  viewMode: 'grid' | 'list';
  onAppClick: (app: AppInstance) => void;
}

export function AppList({ apps, viewMode, onAppClick }: AppListProps) {
  const t = useTranslations('pages.apps');

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
          <Blocks className="h-6 w-6 text-stone-500 dark:text-stone-400" />
        </div>
        <h3 className="mb-1 font-serif text-base font-semibold text-stone-900 dark:text-gray-100">
          {t('errors.appNotFound')}
        </h3>
        <p className="font-serif text-sm text-stone-600 dark:text-stone-400">
          {t('market.tryAdjustSearch')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'space-y-3'
      )}
    >
      {apps.map(app => (
        <AppCard
          key={app.instanceId}
          app={app}
          viewMode={viewMode}
          onClick={onAppClick}
        />
      ))}
    </div>
  );
}
