"use client"

import React, { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@lib/hooks/use-theme'
import { useChatWidth } from '@lib/hooks/use-chat-width'
import { cn } from '@lib/utils'
import { 
  Settings, 
  Menu,
  X,
  Home,
  Pin,
  PinOff,
  ChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 管理菜单项
  const menuItems: MenuItem[] = [
    { 
      text: 'API 配置', 
      icon: Settings, 
      href: '/admin/api-config',
      description: '管理应用实例和配置参数'
    }
  ]

  // 面包屑导航
  const getBreadcrumbs = () => {
    const currentItem = menuItems.find(item => pathname.startsWith(item.href))
    return [
      { text: '管理后台', href: '/admin' },
      ...(currentItem ? [{ text: currentItem.text, href: currentItem.href }] : [])
    ]
  }

  return (
    <div className={cn(
      "min-h-screen font-serif",
      isDark ? "bg-stone-900" : "bg-stone-50"
    )}>
      {/* --- BEGIN COMMENT ---
      顶部导航栏
      --- END COMMENT --- */}
      <header className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        isDark 
          ? "bg-stone-900/80 border-stone-700" 
          : "bg-stone-50/80 border-stone-200"
      )}>
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo和标题 */}
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  isDark ? "text-stone-300 hover:text-stone-100" : "text-stone-600 hover:text-stone-900"
                )}
              >
                <Home className="h-5 w-5" />
                <span className="text-sm">返回主页</span>
              </Link>
              <ChevronRight className="h-4 w-4 text-stone-400" />
              <h1 className={cn(
                "text-xl md:text-2xl font-bold",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                AgentifUI 管理后台
              </h1>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-stone-800 text-stone-300" 
                  : "hover:bg-stone-200 text-stone-600"
              )}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* --- BEGIN COMMENT ---
      主要内容区域 - 全宽度布局
      --- END COMMENT --- */}
      <div className="flex h-[calc(100vh-73px)]">
        
        {/* --- BEGIN COMMENT ---
        侧边栏导航 - 固定宽度，桌面端固定，移动端可折叠
        --- END COMMENT --- */}
        <aside className={cn(
          "w-80 flex-shrink-0 border-r",
          isDark ? "border-stone-700 bg-stone-800" : "border-stone-200 bg-white",
          // 移动端展开/收起状态
          isMobileMenuOpen ? "block" : "hidden lg:block"
        )}>
          <div className="h-full flex flex-col p-6">
            {/* 面包屑导航 */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-3 w-3 text-stone-400 mx-2" />
                    )}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "transition-colors",
                        index === getBreadcrumbs().length - 1
                          ? isDark ? "text-stone-100" : "text-stone-900"
                          : isDark ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
                      )}
                    >
                      {crumb.text}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>

            {/* 导航菜单 */}
            <nav className="space-y-2">
              <h2 className={cn(
                "text-sm font-medium mb-4",
                isDark ? "text-stone-300" : "text-stone-600"
              )}>
                管理功能
              </h2>
              {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-all group",
                      isActive
                        ? isDark 
                          ? "bg-stone-700 text-stone-100 border border-stone-600" 
                          : "bg-stone-100 text-stone-900 border border-stone-300"
                        : isDark
                          ? "hover:bg-stone-700 text-stone-300 hover:text-stone-100"
                          : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mt-0.5 transition-colors",
                      isActive 
                        ? "text-blue-500" 
                        : "text-stone-400 group-hover:text-stone-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {item.text}
                      </div>
                      {item.description && (
                        <div className={cn(
                          "text-xs mt-1",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* --- BEGIN COMMENT ---
        主内容区域 - 占满剩余空间
        --- END COMMENT --- */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* --- BEGIN COMMENT ---
      移动端菜单遮罩
      --- END COMMENT --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
