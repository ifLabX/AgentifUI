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
      "p-6 rounded-lg border mb-6 transition-colors",
      isDark ? "bg-stone-800/50 border-stone-700" : "bg-white border-stone-200"
    )}>
      {/* --- BEGIN COMMENT ---
      筛选器标题行 - 优化对齐和间距
      --- END COMMENT --- */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isDark ? "bg-stone-700" : "bg-stone-100"
          )}>
            <Filter className={cn(
              "h-5 w-5",
              isDark ? "text-stone-300" : "text-stone-600"
            )} />
          </div>
          <div>
            <h3 className={cn(
              "text-lg font-semibold font-serif",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              筛选和搜索
            </h3>
            <p className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              使用下方条件筛选用户列表
            </p>
          </div>
          {hasActiveFilters && (
            <span className={cn(
              "ml-4 px-3 py-1 text-xs rounded-full font-serif border",
              isDark 
                ? "bg-stone-600/50 text-stone-300 border-stone-600" 
                : "bg-stone-100 text-stone-700 border-stone-300"
            )}>
              已应用筛选
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 font-serif border",
              isDark
                ? "text-stone-300 hover:text-stone-100 hover:bg-stone-700 border-stone-600 hover:border-stone-500"
                : "text-stone-600 hover:text-stone-800 hover:bg-stone-50 border-stone-300 hover:border-stone-400"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            重置筛选
          </button>
        )}
      </div>

      {/* --- BEGIN COMMENT ---
      筛选表单 - 优化网格布局和对齐
      --- END COMMENT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* --- BEGIN COMMENT ---
        搜索框 - 在大屏幕上占两列宽度
        --- END COMMENT --- */}
        <div className="xl:col-span-2">
          <label className={cn(
            "block text-sm font-medium mb-3 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            搜索用户
          </label>
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
            <input
              type="text"
              placeholder="搜索用户邮箱、姓名或用户名..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className={cn(
                "w-full pl-11 pr-4 py-3 rounded-lg border transition-all duration-200 font-serif",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDark
                  ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500/20 focus:ring-offset-stone-800"
                  : "bg-white border-stone-300 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-400/20 focus:ring-offset-white"
              )}
            />
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
        角色筛选
        --- END COMMENT --- */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-3 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            角色权限
          </label>
          <select
            value={filters.role || ''}
            onChange={(e) => onFiltersChange({ role: e.target.value as any || undefined })}
            className={cn(
              "w-full px-3 py-3 rounded-lg border transition-all duration-200 font-serif",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500 focus:ring-stone-500/20 focus:ring-offset-stone-800"
                : "bg-white border-stone-300 text-stone-900 focus:border-stone-400 focus:ring-stone-400/20 focus:ring-offset-white"
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
            "block text-sm font-medium mb-3 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            账户状态
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ status: e.target.value as any || undefined })}
            className={cn(
              "w-full px-3 py-3 rounded-lg border transition-all duration-200 font-serif",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500 focus:ring-stone-500/20 focus:ring-offset-stone-800"
                : "bg-white border-stone-300 text-stone-900 focus:border-stone-400 focus:ring-stone-400/20 focus:ring-offset-white"
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
            "block text-sm font-medium mb-3 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            认证来源
          </label>
          <select
            value={filters.auth_source || ''}
            onChange={(e) => onFiltersChange({ auth_source: e.target.value || undefined })}
            className={cn(
              "w-full px-3 py-3 rounded-lg border transition-all duration-200 font-serif",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              isDark
                ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500 focus:ring-stone-500/20 focus:ring-offset-stone-800"
                : "bg-white border-stone-300 text-stone-900 focus:border-stone-400 focus:ring-stone-400/20 focus:ring-offset-white"
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
        排序选择 - 分为两个并排的下拉框
        --- END COMMENT --- */}
        <div className="lg:col-span-2 xl:col-span-1">
          <label className={cn(
            "block text-sm font-medium mb-3 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            排序方式
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.sortBy || 'created_at'}
              onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
              className={cn(
                "px-3 py-3 rounded-lg border transition-all duration-200 font-serif",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDark
                  ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500 focus:ring-stone-500/20 focus:ring-offset-stone-800"
                  : "bg-white border-stone-300 text-stone-900 focus:border-stone-400 focus:ring-stone-400/20 focus:ring-offset-white"
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
                "px-3 py-3 rounded-lg border transition-all duration-200 font-serif",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDark
                  ? "bg-stone-700 border-stone-600 text-stone-100 focus:border-stone-500 focus:ring-stone-500/20 focus:ring-offset-stone-800"
                  : "bg-white border-stone-300 text-stone-900 focus:border-stone-400 focus:ring-stone-400/20 focus:ring-offset-white"
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