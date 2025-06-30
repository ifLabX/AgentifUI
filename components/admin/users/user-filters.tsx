'use client';

import type { UserFilters } from '@lib/db/users';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Filter,
  RotateCcw,
  Search,
  Settings,
  Shield,
  UserCheck,
  UserIcon,
  UserX,
  Users,
} from 'lucide-react';

import React, { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: Partial<UserFilters>) => void;
  onReset: () => void;
}

export const UserFiltersComponent: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // --- BEGIN COMMENT ---
  // 角色选项
  // --- END COMMENT ---
  const roleOptions = [
    { value: '', label: '所有角色', icon: <Users className="h-4 w-4" /> },
    { value: 'admin', label: '管理员', icon: <Shield className="h-4 w-4" /> },
    { value: 'manager', label: '经理', icon: <Crown className="h-4 w-4" /> },
    {
      value: 'user',
      label: '普通用户',
      icon: <UserIcon className="h-4 w-4" />,
    },
  ];

  // --- BEGIN COMMENT ---
  // 状态选项
  // --- END COMMENT ---
  const statusOptions = [
    { value: '', label: '所有状态', icon: <Users className="h-4 w-4" /> },
    { value: 'active', label: '活跃', icon: <UserCheck className="h-4 w-4" /> },
    {
      value: 'suspended',
      label: '已暂停',
      icon: <UserX className="h-4 w-4" />,
    },
    { value: 'pending', label: '待激活', icon: <Clock className="h-4 w-4" /> },
  ];

  // --- BEGIN COMMENT ---
  // 认证来源选项（直接对应Supabase的provider值）
  // --- END COMMENT ---
  const authSourceOptions = [
    { value: '', label: '全部认证来源' },
    { value: 'email', label: '📧 邮箱' },
    { value: 'github', label: '🐙 GitHub' },
    { value: 'phone', label: '📱 手机号' },
    { value: 'google', label: '🔍 Google' },
  ];

  // --- BEGIN COMMENT ---
  // 排序选项
  // --- END COMMENT ---
  const sortOptions = [
    { value: 'created_at', label: '注册时间' },
    { value: 'last_sign_in_at', label: '最后登录' },
    { value: 'email', label: '邮箱' },
    { value: 'full_name', label: '姓名' },
  ];

  // --- BEGIN COMMENT ---
  // 处理搜索输入
  // --- END COMMENT ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value });
  };

  // 检查是否有任何筛选条件被应用（移除组织部门检查）
  const hasActiveFilters =
    filters.role || filters.status || filters.auth_source || filters.search;
  const hasSearchFilter = filters.search;

  return (
    <div
      className={cn(
        'mb-4 rounded-xl border backdrop-blur-sm',
        isDark
          ? 'border-stone-700/50 bg-stone-900/80'
          : 'border-stone-200/50 bg-white/90'
      )}
    >
      {/* --- BEGIN COMMENT ---
      搜索栏 - 始终显示
      --- END COMMENT --- */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* --- 搜索框 --- */}
          <div className="relative flex-1">
            <Search
              className={cn(
                'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
            <input
              type="text"
              placeholder="搜索用户邮箱、姓名或用户名..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className={cn(
                'placeholder-opacity-60 w-full rounded-lg border py-2.5 pr-4 pl-10 font-serif text-sm',
                'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                isDark
                  ? 'border-stone-600 bg-stone-800/50 text-stone-100 placeholder-stone-500 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                  : 'border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-500 focus:ring-stone-400/30 focus:ring-offset-white',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* --- 展开/收起按钮 --- */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isDark
                ? 'border-stone-600 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50 hover:text-stone-100'
                : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-800'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">高级筛选</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {(hasActiveFilters || hasSearchFilter) && (
              <div
                className={cn(
                  'ml-1 h-2 w-2 rounded-full',
                  isDark ? 'bg-emerald-400' : 'bg-emerald-500'
                )}
              />
            )}
          </button>

          {/* --- 重置按钮 --- */}
          {(hasActiveFilters || hasSearchFilter) && (
            <button
              onClick={onReset}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isDark
                  ? 'border-stone-600 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50 hover:text-stone-100'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-800'
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">重置</span>
            </button>
          )}
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      可折叠的高级筛选区域
      --- END COMMENT --- */}
      {isExpanded && (
        <div
          className={cn(
            'border-t px-4 pb-4',
            isDark ? 'border-stone-700/50' : 'border-stone-200/50'
          )}
        >
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* --- 角色筛选 --- */}
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-xs font-semibold tracking-wider uppercase',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                角色权限
              </label>
              <div className="relative">
                <select
                  value={filters.role || ''}
                  onChange={e =>
                    onFiltersChange({
                      role: (e.target.value as any) || undefined,
                    })
                  }
                  className={cn(
                    'w-full cursor-pointer appearance-none rounded-lg border px-3 py-2 font-serif text-sm',
                    'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                    isDark
                      ? 'border-stone-600 bg-stone-800/50 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                      : 'border-stone-300 bg-stone-50/50 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white',
                    'transition-all duration-200'
                  )}
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={cn(
                    'pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 transform',
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}
                />
              </div>
            </div>

            {/* --- 状态筛选 --- */}
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-xs font-semibold tracking-wider uppercase',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                账户状态
              </label>
              <div className="relative">
                <select
                  value={filters.status || ''}
                  onChange={e =>
                    onFiltersChange({
                      status: (e.target.value as any) || undefined,
                    })
                  }
                  className={cn(
                    'w-full cursor-pointer appearance-none rounded-lg border px-3 py-2 font-serif text-sm',
                    'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                    isDark
                      ? 'border-stone-600 bg-stone-800/50 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                      : 'border-stone-300 bg-stone-50/50 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white',
                    'transition-all duration-200'
                  )}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={cn(
                    'pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 transform',
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}
                />
              </div>
            </div>

            {/* --- 认证来源筛选 --- */}
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-xs font-semibold tracking-wider uppercase',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                认证来源
              </label>
              <div className="relative">
                <select
                  value={filters.auth_source || ''}
                  onChange={e =>
                    onFiltersChange({
                      auth_source: e.target.value || undefined,
                    })
                  }
                  className={cn(
                    'w-full cursor-pointer appearance-none rounded-lg border px-3 py-2 font-serif text-sm',
                    'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                    isDark
                      ? 'border-stone-600 bg-stone-800/50 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                      : 'border-stone-300 bg-stone-50/50 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white',
                    'transition-all duration-200'
                  )}
                >
                  {authSourceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={cn(
                    'pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 transform',
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}
                />
              </div>
            </div>

            {/* --- 排序选择 --- */}
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-xs font-semibold tracking-wider uppercase',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                排序方式
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={filters.sortBy || 'created_at'}
                    onChange={e =>
                      onFiltersChange({ sortBy: e.target.value as any })
                    }
                    className={cn(
                      'w-full cursor-pointer appearance-none rounded-lg border px-3 py-1.5 font-serif text-sm',
                      'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                      isDark
                        ? 'border-stone-600 bg-stone-800/50 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                        : 'border-stone-300 bg-stone-50/50 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white',
                      'transition-all duration-200'
                    )}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={cn(
                      'pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 transform',
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )}
                  />
                </div>
                <div className="relative">
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={e =>
                      onFiltersChange({ sortOrder: e.target.value as any })
                    }
                    className={cn(
                      'w-full cursor-pointer appearance-none rounded-lg border px-3 py-1.5 font-serif text-sm',
                      'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                      isDark
                        ? 'border-stone-600 bg-stone-800/50 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                        : 'border-stone-300 bg-stone-50/50 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white',
                      'transition-all duration-200'
                    )}
                  >
                    <option value="desc">最新在前</option>
                    <option value="asc">最旧在前</option>
                  </select>
                  <ChevronDown
                    className={cn(
                      'pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 transform',
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
