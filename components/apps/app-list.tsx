'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
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
  const { colors, isDark } = useThemeColors();
  const t = useTranslations('pages.apps');

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className={cn(
            'mb-3 flex h-12 w-12 items-center justify-center rounded-lg',
            isDark ? 'bg-stone-800' : 'bg-stone-100'
          )}
        >
          <Blocks
            className={cn(
              'h-6 w-6',
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}
          />
        </div>
        <h3
          className={cn(
            'mb-1 font-serif text-base font-semibold',
            colors.mainText.tailwind
          )}
        >
          {t('errors.appNotFound')}
        </h3>
        <p
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
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
