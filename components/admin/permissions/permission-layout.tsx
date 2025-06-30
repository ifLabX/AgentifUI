'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

import { AppList } from './app-list';
import { PermissionPanel } from './permission-panel';
import { SearchAndFilter } from './search-and-filter';

export function PermissionLayout() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <SearchAndFilter />

      {/* 主要布局 */}
      <div className="grid grid-cols-1 gap-6 lg:h-[calc(100vh-20rem)] lg:grid-cols-12">
        {/* 左侧：应用列表 */}
        <div className="lg:col-span-5">
          <div
            className={cn(
              'flex h-full flex-col rounded-lg border',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <div
              className={cn(
                'border-b p-4',
                isDark ? 'border-stone-700' : 'border-stone-200'
              )}
            >
              <h2
                className={cn(
                  'font-serif text-lg font-semibold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                应用列表
              </h2>
              <p
                className={cn(
                  'mt-1 font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                选择应用来配置权限
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <AppList />
            </div>
          </div>
        </div>

        {/* 右侧：权限配置面板 */}
        <div className="lg:col-span-7">
          <div
            className={cn(
              'flex h-full flex-col rounded-lg border',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <div
              className={cn(
                'border-b p-4',
                isDark ? 'border-stone-700' : 'border-stone-200'
              )}
            >
              <h2
                className={cn(
                  'font-serif text-lg font-semibold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                权限配置
              </h2>
              <p
                className={cn(
                  'mt-1 font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                管理应用可见性和群组权限
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <PermissionPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
