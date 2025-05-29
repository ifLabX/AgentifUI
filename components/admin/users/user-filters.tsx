"use client"

import React from 'react'
import { Search, Filter, RotateCcw, Users, UserCheck, UserX, Clock, Shield, Crown, UserIcon } from 'lucide-react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import type { UserFilters } from '@lib/db/users'

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: Partial<UserFilters>) => void
  onReset: () => void
}

export const UserFiltersComponent: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const { isDark } = useTheme()

  // --- BEGIN COMMENT ---
  // 角色选项
  // --- END COMMENT ---
  const roleOptions = [
    { value: '', label: '所有角色', icon: <Users className="h-4 w-4" /> },
    { value: 'admin', label: '管理员', icon: <Shield className="h-4 w-4" /> },
    { value: 'manager', label: '经理', icon: <Crown className="h-4 w-4" /> },
    { value: 'user', label: '普通用户', icon: <UserIcon className="h-4 w-4" /> }
  ]

  // --- BEGIN COMMENT ---
  // 状态选项
  // --- END COMMENT ---
  const statusOptions = [
    { value: '', label: '所有状态', icon: <Users className="h-4 w-4" /> },
    { value: 'active', label: '活跃', icon: <UserCheck className="h-4 w-4" /> },
    { value: 'suspended', label: '已暂停', icon: <UserX className="h-4 w-4" /> },
    { value: 'pending', label: '待激活', icon: <Clock className="h-4 w-4" /> }
  ]

  // --- BEGIN COMMENT ---
  // 认证来源选项
  // --- END COMMENT ---
  const authSourceOptions = [
    { value: '', label: '所有来源' },
    { value: 'password', label: '密码登录' },
    { value: 'google', label: 'Google' },
    { value: 'github', label: 'GitHub' },
    { value: 'sso', label: 'SSO' }
  ]

  // --- BEGIN COMMENT ---
  // 排序选项
  // --- END COMMENT ---
  const sortOptions = [
    { value: 'created_at', label: '注册时间' },
    { value: 'last_sign_in_at', label: '最后登录' },
    { value: 'email', label: '邮箱' },
    { value: 'full_name', label: '姓名' }
  ]

  // --- BEGIN COMMENT ---
  // 处理搜索输入
  // --- END COMMENT ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value })
  }

  // --- BEGIN COMMENT ---
  // 检查是否有活跃的筛选条件
  // --- END COMMENT ---
  const hasActiveFilters = filters.role || filters.status || filters.auth_source || filters.search

  return (
    <div className={cn(
      "p-4 rounded-xl border mb-6",
      isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
    )}>
      {/* --- BEGIN COMMENT ---
      筛选器标题
      --- END COMMENT --- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className={cn(
            "font-semibold font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            筛选和搜索
          </h3>
          {hasActiveFilters && (
            <span className={cn(
              "px-2 py-1 text-xs rounded-full font-serif",
              isDark 
                ? "bg-blue-500/20 text-blue-400" 
                : "bg-blue-100 text-blue-600"
            )}>
              有筛选条件
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-serif",
              isDark
                ? "text-stone-400 hover:text-stone-300 hover:bg-stone-700"
                : "text-stone-600 hover:text-stone-700 hover:bg-stone-100"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* --- BEGIN COMMENT ---
        搜索框
        --- END COMMENT --- */}
        <div className="relative xl:col-span-2">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />
          <input
            type="text"
            placeholder="搜索用户（邮箱、姓名、用户名）"
            value={filters.search || ''}
            onChange={handleSearchChange}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg border transition-colors font-serif",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-stone-500"
                : "bg-white border-stone-300 text-stone-900 placeholder-stone-500 focus:border-stone-400"
            )}
          />
        </div>

        {/* --- BEGIN COMMENT ---
        角色筛选
        --- END COMMENT --- */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-1 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            角色
          </label>
          <select
            value={filters.role || ''}
            onChange={(e) => onFiltersChange({ role: e.target.value as any || undefined })}
            className={cn(
              "w-full px-3 py-2 rounded-lg border transition-colors font-serif",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500"
                : "bg-white border-stone-300 text-stone-900 focus:border-stone-400"
            )}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* --- BEGIN COMMENT ---
        状态筛选
        --- END COMMENT --- */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-1 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            状态
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ status: e.target.value as any || undefined })}
            className={cn(
              "w-full px-3 py-2 rounded-lg border transition-colors font-serif",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500"
                : "bg-white border-stone-300 text-stone-900 focus:border-stone-400"
            )}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* --- BEGIN COMMENT ---
        认证来源筛选
        --- END COMMENT --- */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-1 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            认证来源
          </label>
          <select
            value={filters.auth_source || ''}
            onChange={(e) => onFiltersChange({ auth_source: e.target.value || undefined })}
            className={cn(
              "w-full px-3 py-2 rounded-lg border transition-colors font-serif",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500"
                : "bg-white border-stone-300 text-stone-900 focus:border-stone-400"
            )}
          >
            {authSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* --- BEGIN COMMENT ---
        排序选择
        --- END COMMENT --- */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-1 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            排序方式
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy || 'created_at'}
              onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border transition-colors font-serif",
                isDark
                  ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500"
                  : "bg-white border-stone-300 text-stone-900 focus:border-stone-400"
              )}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => onFiltersChange({ sortOrder: e.target.value as any })}
              className={cn(
                "w-20 px-2 py-2 rounded-lg border transition-colors font-serif",
                isDark
                  ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500"
                  : "bg-white border-stone-300 text-stone-900 focus:border-stone-400"
              )}
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
} 