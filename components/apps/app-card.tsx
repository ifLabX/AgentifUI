'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useFavoriteAppsStore } from '@lib/stores/favorite-apps-store';
import { getDifyAppTypeInfo } from '@lib/types/dify-app-types';
import { cn } from '@lib/utils';
import { ArrowRight, Blocks, Cpu, Heart } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

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

interface AppCardProps {
  app: AppInstance;
  viewMode: 'grid' | 'list';
  onClick: (app: AppInstance) => void;
}

export function AppCard({ app, viewMode, onClick }: AppCardProps) {
  const { colors, isDark } = useThemeColors();
  const { addFavoriteApp, removeFavoriteApp, isFavorite } =
    useFavoriteAppsStore();
  const t = useTranslations('pages.apps.market');
  const tDifyTypes = useTranslations('difyAppTypes');

  const difyAppType = app.config?.app_metadata?.dify_apptype || app.difyAppType;
  const difyTypeInfo = difyAppType
    ? getDifyAppTypeInfo(difyAppType, tDifyTypes)
    : null;

  const isAppFavorite = isFavorite(app.instanceId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isAppFavorite) {
      removeFavoriteApp(app.instanceId);
    } else {
      await addFavoriteApp({
        instanceId: app.instanceId,
        displayName: app.displayName,
        description: app.description,
        iconUrl: app.iconUrl,
        appType: app.appType,
        dify_apptype: difyAppType as
          | 'agent'
          | 'chatbot'
          | 'text-generation'
          | 'chatflow'
          | 'workflow'
          | undefined,
      });
    }
  };

  const getAppIcon = (app: AppInstance) => {
    if (app.iconUrl) {
      return (
        <img
          src={app.iconUrl}
          alt={app.displayName}
          className="h-8 w-8 rounded-full object-cover"
        />
      );
    }
    const getIconColors = () => {
      if (difyTypeInfo) {
        switch (difyAppType) {
          case 'chatbot':
            return isDark
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-blue-400 to-blue-500';
          case 'agent':
            return isDark
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : 'bg-gradient-to-br from-purple-400 to-purple-500';
          case 'workflow':
            return isDark
              ? 'bg-gradient-to-br from-green-500 to-green-600'
              : 'bg-gradient-to-br from-green-400 to-green-500';
          case 'text-generation':
            return isDark
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gradient-to-br from-orange-400 to-orange-500';
          case 'chatflow':
            return isDark
              ? 'bg-gradient-to-br from-teal-500 to-teal-600'
              : 'bg-gradient-to-br from-teal-400 to-teal-500';
          default:
            return isDark
              ? 'bg-gradient-to-br from-stone-600 to-stone-700'
              : 'bg-gradient-to-br from-stone-400 to-stone-500';
        }
      }

      return app.appType === 'model'
        ? isDark
          ? 'bg-gradient-to-br from-stone-600 to-stone-700'
          : 'bg-gradient-to-br from-stone-400 to-stone-500'
        : isDark
          ? 'bg-gradient-to-br from-stone-500 to-stone-600'
          : 'bg-gradient-to-br from-stone-300 to-stone-400';
    };

    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm',
          getIconColors()
        )}
      >
        {difyTypeInfo ? (
          <span className="text-sm">{difyTypeInfo.icon}</span>
        ) : app.appType === 'model' ? (
          <Cpu className="h-4 w-4" />
        ) : (
          <Blocks className="h-4 w-4" />
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => onClick(app)}
      className={cn(
        'group relative cursor-pointer transition-all duration-200',
        'rounded-lg border bg-white',
        'hover:-translate-y-0.5 hover:shadow-md',
        isDark
          ? [
              'border-stone-700 bg-stone-900',
              'hover:border-stone-600 hover:shadow-stone-950/30',
            ]
          : [
              'border-stone-200 bg-white',
              'hover:border-stone-300 hover:shadow-stone-200/30',
            ],
        viewMode === 'list' && 'flex items-center gap-3 p-3'
      )}
    >
      {viewMode === 'grid' ? (
        <div className="flex h-full flex-col p-4">
          <button
            onClick={handleToggleFavorite}
            className={cn(
              'absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full',
              'opacity-0 transition-all duration-200 group-hover:opacity-100',
              'hover:scale-110',
              isAppFavorite
                ? [
                    'bg-red-100 text-red-500 opacity-100',
                    isDark && 'bg-red-900/30 text-red-400',
                  ]
                : [
                    'bg-stone-100 text-stone-400 hover:bg-stone-200',
                    isDark && 'bg-stone-800 text-stone-500 hover:bg-stone-700',
                  ]
            )}
          >
            <Heart
              className={cn(
                'h-3 w-3 transition-transform',
                isAppFavorite && 'scale-110 fill-current'
              )}
            />
          </button>

          <div className="mb-2 flex items-center gap-3">
            {getAppIcon(app)}
            <h3
              className={cn(
                'line-clamp-1 flex-1 font-serif text-sm font-semibold',
                colors.mainText.tailwind
              )}
            >
              {app.displayName}
            </h3>
          </div>

          <div className="mb-3 flex-1">
            <p
              className={cn(
                'line-clamp-2 font-serif text-xs leading-relaxed',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {app.description || t('appCard.noDescription')}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between text-xs">
            <span
              className={cn(
                'font-serif',
                isDark ? 'text-stone-500' : 'text-stone-500'
              )}
            >
              {difyTypeInfo?.label || t('appCard.defaultType')}
            </span>

            <ArrowRight
              className={cn(
                'h-3 w-3',
                isDark ? 'text-stone-500' : 'text-stone-500'
              )}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-shrink-0">{getAppIcon(app)}</div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3
                className={cn(
                  'font-serif text-sm font-semibold',
                  colors.mainText.tailwind
                )}
              >
                {app.displayName}
              </h3>

              {difyTypeInfo && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-serif text-xs',
                    isDark
                      ? 'bg-stone-800 text-stone-300'
                      : 'bg-stone-100 text-stone-600'
                  )}
                >
                  {difyTypeInfo.label}
                </span>
              )}
            </div>

            <p
              className={cn(
                'line-clamp-1 font-serif text-xs',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {app.description || t('appCard.noDescription')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full',
                'transition-all duration-200',
                isAppFavorite
                  ? [
                      'bg-red-100 text-red-500',
                      isDark && 'bg-red-900/30 text-red-400',
                    ]
                  : [
                      'bg-stone-100 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-stone-200',
                      isDark &&
                        'bg-stone-800 text-stone-500 hover:bg-stone-700',
                    ]
              )}
            >
              <Heart
                className={cn(
                  'h-3 w-3 transition-transform',
                  isAppFavorite && 'fill-current'
                )}
              />
            </button>

            <ArrowRight
              className={cn(
                'h-4 w-4',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
