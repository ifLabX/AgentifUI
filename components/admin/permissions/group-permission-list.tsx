'use client';

import { useTheme } from '@lib/hooks/use-theme';
import {
  type AppWithPermissions,
  usePermissionManagementStore,
} from '@lib/stores/permission-management-store';
import { cn } from '@lib/utils';
import { Building2, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GroupPermissionListProps {
  app: AppWithPermissions;
}

export function GroupPermissionList({ app }: GroupPermissionListProps) {
  const { isDark } = useTheme();
  const { groups, setGroupPermission, loading } =
    usePermissionManagementStore();

  const handleTogglePermission = async (groupId: string, enabled: boolean) => {
    const success = await setGroupPermission(app.id, groupId, enabled, null);
    if (success) {
      const groupName = groups.find(g => g.id === groupId)?.name || '群组';
      toast.success(
        `已${enabled ? '启用' : '禁用'}${groupName}对此应用的访问权限`
      );
    }
  };

  if (groups.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border p-6 text-center',
          isDark
            ? 'border-stone-700 bg-stone-800'
            : 'border-stone-200 bg-stone-50'
        )}
      >
        <Building2
          className={cn(
            'mx-auto mb-3 h-10 w-10',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        />
        <h3
          className={cn(
            'mb-1 font-serif text-base font-semibold',
            isDark ? 'text-stone-200' : 'text-stone-800'
          )}
        >
          暂无群组
        </h3>
        <p
          className={cn(
            'font-serif text-xs',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          请先创建群组才能设置应用权限
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map(group => {
        const groupPermission = app.groupPermissions.find(
          p => p.group_id === group.id
        );
        const isEnabled = groupPermission?.is_enabled || false;

        return (
          <div
            key={group.id}
            className={cn(
              'rounded-lg border p-3 transition-all duration-200',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <div className="flex items-center justify-between">
              {/* 群组信息 */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    isDark ? 'bg-stone-700' : 'bg-stone-100'
                  )}
                >
                  <Building2
                    className={cn(
                      'h-4 w-4',
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    )}
                  />
                </div>
                <div>
                  <h5
                    className={cn(
                      'font-serif text-sm font-semibold',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {group.name}
                  </h5>
                  <p
                    className={cn(
                      'font-serif text-xs',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    {group.member_count || 0} 成员
                    {group.description && ` • ${group.description}`}
                  </p>
                </div>
              </div>

              {/* 开关控制 */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-serif text-xs font-medium',
                    isEnabled
                      ? 'text-green-600'
                      : isDark
                        ? 'text-stone-400'
                        : 'text-stone-600'
                  )}
                >
                  {isEnabled ? '已启用' : '已禁用'}
                </span>

                <button
                  onClick={() => handleTogglePermission(group.id, !isEnabled)}
                  disabled={loading.updating}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isEnabled
                      ? 'bg-green-600'
                      : isDark
                        ? 'bg-stone-700'
                        : 'bg-stone-300'
                  )}
                  title={isEnabled ? '禁用访问' : '启用访问'}
                >
                  <span
                    className={cn(
                      'inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200',
                      isEnabled ? 'translate-x-5' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
