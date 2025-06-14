"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { 
  Settings,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  Key,
  Building2,
  Menu,
  Bell
} from 'lucide-react'

interface AdminCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  stats?: string
}

function AdminCard({ title, description, icon: Icon, href, stats }: AdminCardProps) {
  const { isDark } = useTheme()
  
  return (
    <Link
      href={href}
      className={cn(
        "group block p-6 rounded-xl border transition-all duration-200 hover:shadow-lg",
        isDark 
          ? "bg-stone-800 border-stone-700 hover:border-stone-600 hover:bg-stone-750" 
          : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-stone-200/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-stone-700" : "bg-stone-100"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                isDark ? "text-stone-300" : "text-stone-600"
              )} />
            </div>
            <h3 className={cn(
              "text-lg font-semibold",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              {title}
            </h3>
          </div>
          
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            {description}
          </p>
          
          {stats && (
            <div className={cn(
              "text-xs font-medium",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {stats}
            </div>
          )}
        </div>
        
        <ArrowRight className={cn(
          "h-5 w-5 transition-transform group-hover:translate-x-1",
          isDark ? "text-stone-400" : "text-stone-400"
        )} />
      </div>
    </Link>
  )
}

export default function AdminPage() {
  const { isDark } = useTheme()
  const [apiConfigStatus, setApiConfigStatus] = useState<string>('检查中...')

  // --- BEGIN COMMENT ---
  // 检查API配置状态
  // --- END COMMENT ---
  useEffect(() => {
    const checkApiConfigStatus = async () => {
      try {
        // 检查是否有配置的服务实例
        const response = await fetch('/api/admin/status')
        if (response.ok) {
          const data = await response.json()
          setApiConfigStatus(data.hasActiveInstances ? '已配置' : '待配置')
        } else {
          setApiConfigStatus('待配置')
        }
      } catch (error) {
        console.error('检查API配置状态失败:', error)
        setApiConfigStatus('待配置')
      }
    }

    checkApiConfigStatus()
  }, [])

  // --- BEGIN COMMENT ---
  // 管理功能卡片配置
  // --- END COMMENT ---
  const adminCards: AdminCardProps[] = [
    {
      title: 'API 配置',
      description: '管理应用实例、配置参数和API密钥',
      icon: Key,
      href: '/admin/api-config',
      stats: `当前状态: ${apiConfigStatus}`
    },
    {
      title: '关于与通知',
      description: '管理About页面内容和系统通知推送',
      icon: Bell,
      href: '/admin/content',
      stats: '功能可用'
    },
    {
      title: '用户管理',
      description: '管理用户账户、权限和访问控制',
      icon: Users,
      href: '/admin/users',
      stats: '功能可用'
    },
    {
      title: '组织管理',
      description: '管理组织结构、部门和成员关系',
      icon: Building2,
      href: '/admin/organizations',
      stats: '功能可用'
    },
    {
      title: '数据统计',
      description: '查看使用情况、性能指标和分析报告',
      icon: BarChart3,
      href: '/admin/analytics',
      stats: '即将推出'
    },
    {
      title: '安全设置',
      description: '配置安全策略、审计日志和访问控制',
      icon: Shield,
      href: '/admin/security',
      stats: '即将推出'
    }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* --- BEGIN COMMENT ---
        页面标题和描述
        --- END COMMENT --- */}
        <div className="mb-8">
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            管理后台概览
          </h1>
          <p className={cn(
            "text-lg",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            欢迎使用 AgentifUI 管理后台，在这里您可以管理系统的各项配置和设置。
          </p>
        </div>

        {/* --- BEGIN COMMENT ---
        快速状态概览
        --- END COMMENT --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={cn(
            "p-4 rounded-lg border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  系统状态
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-green-400" : "text-green-600"
                )}>
                  正常运行
                </p>
              </div>
              <div className={cn(
                "w-3 h-3 rounded-full",
                "bg-green-500"
              )} />
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-lg border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  API 连接
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-stone-300" : "text-stone-700"
                )}>
                  已连接
                </p>
              </div>
              <div className={cn(
                "w-3 h-3 rounded-full",
                "bg-stone-500"
              )} />
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-lg border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  版本信息
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  v1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
        管理功能卡片网格
        --- END COMMENT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {adminCards.map((card) => (
            <AdminCard
              key={card.href}
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={card.href}
              stats={card.stats}
            />
          ))}
        </div>

        {/* --- BEGIN COMMENT ---
        快速操作区域
        --- END COMMENT --- */}
        <div className={cn(
          "mt-8 pt-8 border-t",
          isDark ? "border-stone-700" : "border-stone-200"
        )}>
          <h2 className={cn(
            "text-xl font-semibold mb-4",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            快速操作
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/api-config"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isDark 
                  ? "bg-stone-700 text-stone-100 hover:bg-stone-600" 
                  : "bg-stone-800 text-white hover:bg-stone-700"
              )}
            >
              配置 API
            </Link>
            <Link
              href="/chat"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                isDark 
                  ? "border-stone-600 text-stone-300 hover:bg-stone-800" 
                  : "border-stone-300 text-stone-700 hover:bg-stone-50"
              )}
            >
              返回对话
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 