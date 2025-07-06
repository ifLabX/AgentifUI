'use client';

import { useTheme } from '@lib/hooks/use-theme';
import {
  type AppWithPermissions,
  usePermissionManagementStore,
} from '@lib/stores/permission-management-store';
import type { AppVisibility } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Globe, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';

interface VisibilitySelectorProps {
  app: AppWithPermissions;
}

export function VisibilitySelector({ app }: VisibilitySelectorProps) {
  const { isDark } = useTheme();
  const { updateAppVisibility, loading } = usePermissionManagementStore();
  const t = useTranslations(
    'pages.admin.permissions.permissionPanel.visibilitySettings'
  );
  const tMessages = useTranslations('pages.admin.permissions.messages');

  const visibilityOptions: Array<{
    value: AppVisibility;
    label: string;
    description: string;
    icon: typeof Globe;
    color: string;
  }> = [
    {
      value: 'public',
      label: t('options.public.label'),
      description: t('options.public.description'),
      icon: Globe,
      color: 'text-green-500',
    },
    {
      value: 'group_only',
      label: t('options.groupOnly.label'),
      description: t('options.groupOnly.description'),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      value: 'private',
      label: t('options.private.label'),
      description: t('options.private.description'),
      icon: Lock,
      color: 'text-purple-500',
    },
  ];

  const handleVisibilityChange = async (visibility: AppVisibility) => {
    if (visibility === app.visibility) return;

    const success = await updateAppVisibility(app.id, visibility);
    if (success) {
      const option = visibilityOptions.find(o => o.value === visibility);
      toast.success(
        tMessages('visibilityUpdateSuccess', {
          visibility: option?.label || visibility,
        })
      );
    }
  };

  return (
    <div className="space-y-3">
      {visibilityOptions.map(option => {
        const Icon = option.icon;
        const isSelected = app.visibility === option.value;

        return (
          <button
            key={option.value}
            onClick={() => handleVisibilityChange(option.value)}
            disabled={loading.updating}
            className={cn(
              'w-full rounded-lg border p-4 text-left transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
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
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  isDark ? 'bg-stone-700' : 'bg-stone-100'
                )}
              >
                <Icon className={cn('h-4 w-4', option.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={cn(
                      'font-serif text-sm font-semibold',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {option.label}
                  </h4>
                  {isSelected && (
                    <div
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        isDark
                          ? 'bg-stone-600 text-stone-300'
                          : 'bg-stone-200 text-stone-700'
                      )}
                    >
                      {t('currentSetting')}
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'mt-1 font-serif text-xs',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
