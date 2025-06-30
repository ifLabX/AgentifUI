'use client';

import { useTheme } from '@lib/hooks/use-theme';
import {
  type AppWithPermissions,
  usePermissionManagementStore,
} from '@lib/stores/permission-management-store';
import type { AppVisibility } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Globe, Lock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VisibilitySelectorProps {
  app: AppWithPermissions;
}

export function VisibilitySelector({ app }: VisibilitySelectorProps) {
  const { isDark } = useTheme();
  const { updateAppVisibility, loading } = usePermissionManagementStore();

  const visibilityOptions: Array<{
    value: AppVisibility;
    label: string;
    description: string;
    icon: typeof Globe;
    color: string;
  }> = [
    {
      value: 'public',
      label: '公开应用',
      description: '所有用户都可以访问此应用',
      icon: Globe,
      color: 'text-green-500',
    },
    {
      value: 'group_only',
      label: '群组应用',
      description: '仅授权群组的成员可以访问',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      value: 'private',
      label: '私有应用',
      description: '仅管理员可以访问此应用',
      icon: Lock,
      color: 'text-purple-500',
    },
  ];

  const handleVisibilityChange = async (visibility: AppVisibility) => {
    if (visibility === app.visibility) return;

    const success = await updateAppVisibility(app.id, visibility);
    if (success) {
      toast.success(
        `应用可见性已更新为"${visibilityOptions.find(o => o.value === visibility)?.label}"`
      );
    }
  };

  return (
    <div className="space-y-2">
      {visibilityOptions.map(option => {
        const Icon = option.icon;
        const isSelected = app.visibility === option.value;
        const isUpdating = loading.updating;

        return (
          <button
            key={option.value}
            onClick={() => handleVisibilityChange(option.value)}
            disabled={isUpdating}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isSelected
                ? isDark
                  ? 'border-stone-500 bg-stone-700 shadow-md'
                  : 'border-stone-400 bg-stone-100 shadow-md'
                : isDark
                  ? 'hover:bg-stone-750 border-stone-700 bg-stone-800 hover:border-stone-600'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  isSelected
                    ? isDark
                      ? 'bg-stone-600'
                      : 'bg-stone-200'
                    : isDark
                      ? 'bg-stone-700'
                      : 'bg-stone-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isSelected
                      ? option.color
                      : isDark
                        ? 'text-stone-400'
                        : 'text-stone-600'
                  )}
                />
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h5
                    className={cn(
                      'font-serif text-sm font-semibold',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {option.label}
                  </h5>
                  {isSelected && (
                    <div
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        isDark
                          ? 'bg-stone-600 text-stone-200'
                          : 'bg-stone-200 text-stone-700'
                      )}
                    >
                      当前设置
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'font-serif text-xs',
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
