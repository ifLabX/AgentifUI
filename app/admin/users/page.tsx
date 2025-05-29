"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Users, UserPlus, Shield, Settings } from 'lucide-react'

export default function UsersPage() {
  const { isDark } = useTheme()

  return (
    <div className="p-6">
      {/* --- BEGIN COMMENT ---
      页面标题区域
      --- END COMMENT --- */}
      <div className="mb-8">
        <h1 className={cn(
          "text-2xl font-bold mb-2",
          isDark ? "text-stone-100" : "text-stone-900"
        )}>
          用户管理
        </h1>
        <p className={cn(
          "text-sm",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          管理系统用户账户、权限和访问控制
        </p>
      </div>

      {/* --- BEGIN COMMENT ---
      功能卡片网格
      --- END COMMENT --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={cn(
          "p-6 rounded-xl border transition-all duration-200 hover:shadow-lg",
          isDark 
            ? "bg-stone-800 border-stone-700 hover:border-stone-600" 
            : "bg-white border-stone-200 hover:border-stone-300"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-stone-700" : "bg-stone-100"
            )}>
              <Users className="h-5 w-5" />
            </div>
            <h3 className={cn(
              "font-semibold",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              用户列表
            </h3>
          </div>
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            查看和管理所有注册用户
          </p>
          <button className={cn(
            "w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            isDark 
              ? "bg-stone-700 text-stone-200 hover:bg-stone-600" 
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          )}>
            查看用户
          </button>
        </div>

        <div className={cn(
          "p-6 rounded-xl border transition-all duration-200 hover:shadow-lg",
          isDark 
            ? "bg-stone-800 border-stone-700 hover:border-stone-600" 
            : "bg-white border-stone-200 hover:border-stone-300"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-stone-700" : "bg-stone-100"
            )}>
              <UserPlus className="h-5 w-5" />
            </div>
            <h3 className={cn(
              "font-semibold",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              添加用户
            </h3>
          </div>
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            创建新的用户账户
          </p>
          <button className={cn(
            "w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            isDark 
              ? "bg-stone-700 text-stone-200 hover:bg-stone-600" 
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          )}>
            添加用户
          </button>
        </div>

        <div className={cn(
          "p-6 rounded-xl border transition-all duration-200 hover:shadow-lg",
          isDark 
            ? "bg-stone-800 border-stone-700 hover:border-stone-600" 
            : "bg-white border-stone-200 hover:border-stone-300"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-stone-700" : "bg-stone-100"
            )}>
              <Shield className="h-5 w-5" />
            </div>
            <h3 className={cn(
              "font-semibold",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              权限管理
            </h3>
          </div>
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            配置用户角色和权限
          </p>
          <button className={cn(
            "w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors",
            isDark 
              ? "bg-stone-700 text-stone-200 hover:bg-stone-600" 
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          )}>
            管理权限
          </button>
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      开发中提示
      --- END COMMENT --- */}
      <div className={cn(
        "mt-8 p-4 rounded-lg border-2 border-dashed",
        isDark 
          ? "border-stone-700 bg-stone-800/50" 
          : "border-stone-300 bg-stone-50"
      )}>
        <p className={cn(
          "text-center text-sm",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          🚧 此功能正在开发中，敬请期待
        </p>
      </div>
    </div>
  )
} 