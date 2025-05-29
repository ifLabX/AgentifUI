"use client"

import React, { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { 
  Settings, 
  Menu,
  X,
  Home,
  ChevronRight,
  Pin,
  PinOff,
  Shield,
  Users,
  BarChart3
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
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // --- BEGIN COMMENT ---
  // 管理菜单项配置 - 扩展更多功能
  // --- END COMMENT ---
  const menuItems: MenuItem[] = [
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
      ...(currentItem ? [{ text: currentItem.text, href: currentItem.href }] : [])
    ]
  }

  // --- BEGIN COMMENT ---
  // 处理侧边栏状态变化
  // --- END COMMENT ---
  const handleSidebarToggle = () => {
    setIsSidebarPinned(!isSidebarPinned)
  }

  // --- BEGIN COMMENT ---
  // 侧边栏是否应该显示
  // --- END COMMENT ---
  const shouldShowSidebar = isSidebarHovered || isSidebarPinned || isMobileMenuOpen

  return (
    <div className={cn(
      "min-h-screen font-serif relative",
      isDark ? "bg-stone-900" : "bg-stone-50"
    )}>
      {/* --- BEGIN COMMENT ---
      精简的顶部导航栏 - 无边框，一体化设计
      --- END COMMENT --- */}
      <header className={cn(
        "sticky top-0 z-40 backdrop-blur-md",
        isDark 
          ? "bg-stone-900/95" 
          : "bg-stone-50/95"
      )}>
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isSidebarPinned ? "ml-80" : "ml-0"
        )}>
          <div className="flex items-center justify-between px-6 py-3">
            {/* --- BEGIN COMMENT ---
            左侧：侧边栏切换按钮和标题
            --- END COMMENT --- */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSidebarToggle}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200 hover:scale-105",
                  isDark 
                    ? "hover:bg-stone-800 text-stone-300 hover:text-stone-100" 
                    : "hover:bg-stone-200 text-stone-600 hover:text-stone-900"
                )}
              >
                {isSidebarPinned ? (
                  <PinOff className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              
              <h1 className={cn(
                "text-lg font-semibold",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                AgentifUI 管理后台
              </h1>
            </div>

            {/* --- BEGIN COMMENT ---
            右侧：操作按钮
            --- END COMMENT --- */}
            <div className="flex items-center gap-3">
              <Link 
                href="/chat" 
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                  isDark 
                    ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" 
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                )}
              >
                <Home className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">返回对话</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* --- BEGIN COMMENT ---
      悬停式侧边栏 - Kimi风格设计
      --- END COMMENT --- */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out",
          "flex flex-col",
          // 宽度和位置控制
          shouldShowSidebar ? "w-80" : "w-0",
          // 悬停检测区域 - 即使隐藏也保持5px的检测区域
          !shouldShowSidebar && "hover:w-1"
        )}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        {/* --- BEGIN COMMENT ---
        侧边栏内容容器 - 圆角设计，避开导航栏
        --- END COMMENT --- */}
        <div className={cn(
          "h-full flex flex-col transition-all duration-300 ease-in-out",
          "mt-16 mb-4 mr-4 ml-4 rounded-2xl shadow-2xl backdrop-blur-md",
          isDark 
            ? "bg-stone-800/95 border border-stone-700/50" 
            : "bg-white/95 border border-stone-200/50",
          // 显示/隐藏动画
          shouldShowSidebar 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 -translate-x-full pointer-events-none"
        )}>
          
          {/* --- BEGIN COMMENT ---
          侧边栏头部 - 包含面包屑和固定按钮
          --- END COMMENT --- */}
          <div className="flex items-center justify-between p-6 pb-4">
            <nav>
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
                          ? isDark ? "text-stone-100 font-medium" : "text-stone-900 font-medium"
                          : isDark ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
                      )}
                    >
                      {crumb.text}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            
            <button
              onClick={handleSidebarToggle}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:scale-105",
                isSidebarPinned
                  ? isDark 
                    ? "bg-stone-700 text-stone-200" 
                    : "bg-stone-200 text-stone-700"
                  : isDark
                    ? "hover:bg-stone-700 text-stone-400 hover:text-stone-200"
                    : "hover:bg-stone-100 text-stone-500 hover:text-stone-700"
              )}
            >
              <Pin className={cn(
                "h-4 w-4 transition-transform duration-200",
                isSidebarPinned && "rotate-45"
              )} />
            </button>
          </div>

          {/* --- BEGIN COMMENT ---
          导航菜单 - 现代化设计
          --- END COMMENT --- */}
          <nav className="flex-1 px-4 pb-6">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      if (!isSidebarPinned) {
                        setIsSidebarHovered(false)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                      "hover:scale-[1.02] hover:shadow-md",
                      isActive
                        ? isDark 
                          ? "bg-stone-700 text-stone-100 shadow-lg border border-stone-600" 
                          : "bg-stone-100 text-stone-900 shadow-lg border border-stone-300"
                        : isDark
                          ? "hover:bg-stone-700/50 text-stone-300 hover:text-stone-100"
                          : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? isDark ? "bg-stone-600" : "bg-stone-200"
                        : isDark ? "bg-stone-800 group-hover:bg-stone-600" : "bg-stone-100 group-hover:bg-stone-200"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {item.text}
                      </div>
                      <div className={cn(
                        "text-xs mt-0.5 opacity-75",
                        isDark ? "text-stone-400" : "text-stone-500"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* --- BEGIN COMMENT ---
      主内容区域 - 根据侧边栏状态调整边距
      --- END COMMENT --- */}
      <main className={cn(
        "transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)]",
        isSidebarPinned ? "ml-80" : "ml-0"
      )}>
        {children}
      </main>

      {/* --- BEGIN COMMENT ---
      移动端遮罩层
      --- END COMMENT --- */}
      {(isMobileMenuOpen || (isSidebarHovered && !isSidebarPinned)) && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false)
            setIsSidebarHovered(false)
          }}
        />
      )}

      {/* --- BEGIN COMMENT ---
      悬停触发区域 - 左侧边缘5px宽度的隐形区域
      --- END COMMENT --- */}
      {!shouldShowSidebar && (
        <div 
          className="fixed left-0 top-0 w-1 h-full z-30"
          onMouseEnter={() => setIsSidebarHovered(true)}
        />
      )}
    </div>
  )
} 