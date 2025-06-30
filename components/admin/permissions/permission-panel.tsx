'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { usePermissionManagementStore } from '@lib/stores/permission-management-store';
import type { AppVisibility } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Blocks, Globe, Lock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { GroupPermissionList } from './group-permission-list';
import { VisibilitySelector } from './visibility-selector';

export function PermissionPanel() {
  const { isDark } = useTheme();
  const { selectedApp } = usePermissionManagementStore();

  if (!selectedApp) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <Blocks
            className={cn(
              'mx-auto mb-4 h-16 w-16',
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}
          />
          <h3
            className={cn(
              'mb-2 font-serif text-lg font-semibold',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            选择应用
          </h3>
          <p
            className={cn(
              'font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            从左侧应用列表中选择一个应用来配置权限
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
        {/* 应用信息 */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isDark ? 'bg-stone-700' : 'bg-stone-100'
              )}
            >
              <Blocks
                className={cn(
                  'h-6 w-6',
                  isDark ? 'text-stone-300' : 'text-stone-600'
                )}
              />
            </div>
            <div>
              <h3
                className={cn(
                  'font-serif text-xl font-semibold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                {selectedApp.display_name || selectedApp.instance_id}
              </h3>
              {selectedApp.description && (
                <p
                  className={cn(
                    'font-serif text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {selectedApp.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 可见性设置 */}
        <div>
          <h4
            className={cn(
              'mb-3 font-serif text-lg font-semibold',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            可见性设置
          </h4>
          <VisibilitySelector app={selectedApp} />
        </div>

        {/* 群组权限设置 */}
        {selectedApp.visibility === 'group_only' && (
          <div>
            <h4
              className={cn(
                'mb-3 font-serif text-lg font-semibold',
                isDark ? 'text-stone-200' : 'text-stone-800'
              )}
            >
              群组权限
            </h4>
            <p
              className={cn(
                'mb-4 font-serif text-sm',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              选择哪些群组可以访问此应用
            </p>
            <GroupPermissionList app={selectedApp} />
          </div>
        )}

        {/* 权限说明 */}
        <div
          className={cn(
            'rounded-lg border p-4',
            isDark
              ? 'border-stone-700 bg-stone-800'
              : 'border-stone-200 bg-stone-50'
          )}
        >
          <h5
            className={cn(
              'mb-2 font-serif text-sm font-semibold',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            权限说明
          </h5>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-green-500" />
              <span
                className={cn(
                  'font-serif',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                <strong>公开应用</strong>：所有用户都可以访问
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-blue-500" />
              <span
                className={cn(
                  'font-serif',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                <strong>群组应用</strong>：仅授权群组的成员可以访问
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-purple-500" />
              <span
                className={cn(
                  'font-serif',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                <strong>私有应用</strong>：仅管理员可以访问
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
