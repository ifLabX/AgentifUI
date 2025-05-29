"use client"

import React, { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@lib/hooks/use-theme'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { cn } from '@lib/utils'
import { 
  Settings, 
  Menu,
  Home,
  ChevronRight,
  Pin,
  PinOff,
  Shield,
  Users,
  BarChart3,
  PanelLeft,
  PanelLeftClose
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

interface MenuItem {
  text: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description?: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  
  // --- BEGIN COMMENT ---
  // 侧边栏状态管理 - 简化为只有悬停功能
  // --- END COMMENT ---
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)
  const [hoverTimeoutId, setHoverTimeoutId] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // --- BEGIN COMMENT ---
  // 管理菜单项配置 - 包含管理主页
  // --- END COMMENT ---
  const menuItems: MenuItem[] = [
    { 
      text: '管理主页', 
      icon: Home, 
      href: '/admin',
      description: '管理后台概览'
    },
    { 
      text: 'API 配置', 
      icon: Settings, 
      href: '/admin/api-config',
      description: '管理应用实例和配置参数'
    },
    { 
      text: '用户管理', 
      icon: Users, 
      href: '/admin/users',
      description: '管理用户账户和权限'
    },
    { 
      text: '数据统计', 
      icon: BarChart3, 
      href: '/admin/analytics',
      description: '查看使用情况和分析'
    },
    { 
      text: '安全设置', 
      icon: Shield, 
      href: '/admin/security',
      description: '配置安全策略和审计'
    }
  ]

  // --- BEGIN COMMENT ---
  // 面包屑导航生成
  // --- END COMMENT ---
  const getBreadcrumbs = () => {
    const currentItem = menuItems.find(item => pathname.startsWith(item.href))
    return [
      { text: '管理后台', href: '/admin' },
      ...(currentItem && currentItem.href !== '/admin' ? [{ text: currentItem.text, href: currentItem.href }] : [])
    ]
  }

  // --- BEGIN COMMENT ---
  // 客户端挂载
  // --- END COMMENT ---
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // --- BEGIN COMMENT ---
  // 处理内容显示逻辑
  // --- END COMMENT ---
  useEffect(() => {
    if (!isExpanded) {
      setContentVisible(false)
      return
    }
    
    const timer = setTimeout(() => {
      setContentVisible(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [isExpanded])

  // --- BEGIN COMMENT ---
  // 处理悬停 - 简化逻辑，只有悬停展开/收起
  // --- END COMMENT ---
  const handleSetHovering = (hovering: boolean) => {
    // 移动端忽略悬停
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return
    }
    
    // 清除现有超时
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId)
      setHoverTimeoutId(null)
    }

    // 悬停进入
    if (hovering && !isExpanded) {
      const timeoutId = window.setTimeout(() => {
        setIsHovering(true)
        setIsExpanded(true)
      }, 10)
      setHoverTimeoutId(timeoutId)
      return
    }

    // 悬停离开
    if (!hovering && isHovering) {
      const timeoutId = window.setTimeout(() => {
        setIsHovering(false)
        setIsExpanded(false)
        setContentVisible(false)
      }, 150)
      setHoverTimeoutId(timeoutId)
      return
    }

    setIsHovering(hovering)
  }

  // --- BEGIN COMMENT ---
  // 清理定时器
  // --- END COMMENT ---
  useEffect(() => {
    return () => {
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId)
      }
    }
  }, [hoverTimeoutId])

  return (
    <div className={cn(
      "min-h-screen font-serif relative",
      colors.mainBackground.tailwind
    )}>
      {/* --- BEGIN COMMENT ---
      顶部导航栏 - 固定在顶部，不受sidebar影响，使用与sidebar相同的配色，确保z-index在sidebar之上
      --- END COMMENT --- */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b",
        colors.sidebarBackground.tailwind,
        isDark 
          ? "border-b-stone-700/50" 
          : "border-b-stone-300/60"
      )}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className={cn(
              "text-lg font-semibold",
              colors.mainText.tailwind
            )}>
              AgentifUI 管理后台
            </h1>
            
            {/* --- BEGIN COMMENT ---
            面包屑导航
            --- END COMMENT --- */}
            {getBreadcrumbs().length > 1 && (
              <nav className="ml-4">
                <ol className="flex items-center space-x-2 text-sm">
                  {getBreadcrumbs().map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-3 w-3 text-stone-400 mx-2" />
                      )}
                      <Link
                        href={crumb.href}
                        className={cn(
                          "transition-colors hover:underline",
                          index === getBreadcrumbs().length - 1
                            ? colors.mainText.tailwind + " font-medium"
                            : isDark ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        {crumb.text}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/chat" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                isDark 
                  ? "text-stone-400 hover:text-stone-100 hover:bg-stone-600" 
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-300"
              )}
            >
              <Home className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">返回对话</span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- BEGIN COMMENT ---
      侧边栏 - 从顶部开始，消除与navbar的缝隙，只有悬停功能
      --- END COMMENT --- */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 flex flex-col border-r",
          "transition-[width] duration-300 ease-in-out",
          // 宽度设置 - 展开时64，收起时16
          isExpanded ? "w-64" : "w-16",
          // 移动端未挂载时隐藏
          !isMounted && "opacity-0",
          // 高z-index确保覆盖其他内容
          "z-45",
          // 主题样式 - 与navbar使用相同配色
          colors.sidebarBackground.tailwind,
          "backdrop-blur-sm",
          isDark 
            ? "border-r-stone-700/50 shadow-xl shadow-black/40 text-stone-300" 
            : "border-r-stone-300/60 shadow-xl shadow-stone-300/60 text-stone-700"
        )}
        onMouseEnter={() => handleSetHovering(true)}
        onMouseLeave={() => handleSetHovering(false)}
      >
        <div className="flex flex-col h-full">
          {/* --- BEGIN COMMENT ---
          侧边栏头部 - 为navbar留出空间
          --- END COMMENT --- */}
          <div className="pt-16 px-3 pb-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium",
                      "transition-all duration-200 ease-in-out",
                      "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      isDark ? "focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
                      "border border-transparent h-10 min-h-[2.5rem]",
                      !isDark && [
                        "text-stone-600",
                        "hover:bg-stone-300 hover:shadow-md",
                        isActive && "bg-stone-300 shadow-sm border-stone-400/80",
                      ],
                      isDark && [
                        "text-gray-200",
                        "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
                        isActive && "bg-stone-600 shadow-sm border-stone-500",
                      ],
                      isExpanded ? "w-full" : "w-10 justify-center",
                    )}
                  >
                    <div className="flex flex-1 items-center min-w-0">
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center -ml-0.5 flex-shrink-0", 
                        isDark ? "text-gray-400" : "text-gray-500",
                      )}>
                        <Icon className="h-5 w-5" />
                      </span>
                      {isExpanded && contentVisible && (
                        <div className={cn(
                          "ml-2 flex-1 min-w-0 truncate font-serif",
                          "flex items-center leading-none"
                        )}>
                          {item.text}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* --- BEGIN COMMENT ---
      主内容区域 - 顶部留出navbar空间，左侧始终留出slim sidebar空间
      --- END COMMENT --- */}
      <main className={cn(
        "pt-16 ml-16 transition-all duration-300 ease-in-out min-h-screen"
      )}>
        {children}
      </main>
    </div>
  )
} 