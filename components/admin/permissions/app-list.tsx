'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { usePermissionManagementStore } from '@lib/stores/permission-management-store';
import type { AppVisibility } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Blocks, Globe, Lock, Users } from 'lucide-react';

import { useTranslations } from 'next-intl';

export function AppList() {
  const { isDark } = useTheme();
  const { getFilteredApps, selectedApp, selectApp, loading } =
    usePermissionManagementStore();
  const t = useTranslations('pages.admin.permissions.appList');

  const apps = getFilteredApps();

  const getVisibilityIcon = (visibility: AppVisibility) => {
    switch (visibility) {
      case 'public':
        return Globe;
      case 'group_only':
        return Users;
      case 'private':
        return Lock;
      default:
        return Blocks;
    }
  };

  const getVisibilityColor = (visibility: AppVisibility) => {
    switch (visibility) {
      case 'public':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'group_only':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'private':
        return isDark ? 'text-purple-400' : 'text-purple-600';
      default:
        return isDark ? 'text-stone-400' : 'text-stone-600';
    }
  };

  const getVisibilityLabel = (visibility: AppVisibility) => {
    switch (visibility) {
      case 'public':
        return t('visibility.public');
      case 'group_only':
        return t('visibility.groupOnly');
      case 'private':
        return t('visibility.private');
      default:
        return t('unknown');
    }
  };

  if (loading.apps) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div
            className={cn(
              'mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent',
              isDark ? 'border-stone-600' : 'border-stone-300'
            )}
          />
          <p
            className={cn(
              'font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Blocks
            className={cn(
              'mx-auto mb-3 h-12 w-12',
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}
          />
          <h3
            className={cn(
              'mb-1 font-serif text-base font-semibold',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            {t('noApps')}
          </h3>
          <p
            className={cn(
              'font-serif text-xs',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {t('noAppsDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2 p-4">
        {apps.map(app => {
          const isSelected = selectedApp?.id === app.id;
          const VisibilityIcon = getVisibilityIcon(app.visibility);

          return (
            <button
              key={app.id}
              onClick={() => selectApp(app)}
              className={cn(
                'group w-full rounded-lg border p-4 text-left transition-all duration-200',
                isSelected
                  ? isDark
                    ? 'border-stone-500 bg-stone-700 shadow-md'
                    : 'border-stone-300 bg-stone-50 shadow-md'
                  : isDark
                    ? 'border-stone-700 bg-stone-800 hover:border-stone-600 hover:bg-stone-700'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
              )}
            >
              <div className="flex items-start gap-3">
                {/* 应用图标 */}
                <div
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                    isSelected
                      ? isDark
                        ? 'bg-stone-600'
                        : 'bg-stone-200'
                      : isDark
                        ? 'bg-stone-700 group-hover:bg-stone-600'
                        : 'bg-stone-100 group-hover:bg-stone-200'
                  )}
                >
                  <Blocks
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isSelected
                        ? isDark
                          ? 'text-stone-200'
                          : 'text-stone-700'
                        : isDark
                          ? 'text-stone-400 group-hover:text-stone-300'
                          : 'text-stone-600 group-hover:text-stone-700'
                    )}
                  />
                </div>

                {/* 应用信息 */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h3
                      className={cn(
                        'truncate font-serif font-semibold',
                        isDark ? 'text-stone-100' : 'text-stone-900'
                      )}
                    >
                      {app.display_name || app.instance_id}
                    </h3>

                    {/* 可见性标签 */}
                    <div
                      className={cn(
                        'ml-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                        app.visibility === 'public'
                          ? isDark
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-green-100 text-green-700'
                          : app.visibility === 'group_only'
                            ? isDark
                              ? 'bg-blue-900/30 text-blue-400'
                              : 'bg-blue-100 text-blue-700'
                            : isDark
                              ? 'bg-purple-900/30 text-purple-400'
                              : 'bg-purple-100 text-purple-700'
                      )}
                    >
                      <VisibilityIcon className="h-3 w-3" />
                      <span>{getVisibilityLabel(app.visibility)}</span>
                    </div>
                  </div>

                  {app.description && (
                    <p
                      className={cn(
                        'line-clamp-2 font-serif text-sm leading-relaxed',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    >
                      {app.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
