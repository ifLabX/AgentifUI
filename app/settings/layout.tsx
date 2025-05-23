"use client"

import { Sidebar } from "@components/sidebar"
import { MobileNavButton } from "@components/mobile"
import { SettingsSidebar } from "@components/settings/settings-sidebar"
import { SettingsMobileNav } from "@components/settings/settings-mobile-nav"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useEffect } from "react"
import { useMobile } from "@lib/hooks"
import { useSettingsColors } from '@lib/hooks/use-settings-colors'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { isExpanded, isLocked, isMounted, setMounted } = useSidebarStore()
  const isMobile = useMobile()
  const { colors } = useSettingsColors();
  
  // --- BEGIN COMMENT ---
  // 在组件挂载后设置状态
  // --- END COMMENT ---
  useEffect(() => {
    setMounted()
  }, [setMounted])

  // --- BEGIN COMMENT ---
  // 计算主内容区域的左边距
  // 仅在桌面端且侧边栏锁定时，根据展开状态设置边距
  // 悬停展开时不设置边距（覆盖模式）
  // --- END COMMENT ---
  const getMainMarginLeft = () => {
    if (isMobile) return "ml-0"
    if (!isLocked) return "ml-16" // 未锁定时保持slim状态的边距
    return isExpanded ? "ml-64" : "ml-16"
  }

  return (
    <div className={cn(
      "flex min-h-screen h-full",
      colors.pageBackground.tailwind
    )}>
      {/* 侧边栏 - 始终渲染，由内部控制显示/隐藏 */}
      <Sidebar />
      
      {/* 
        移动端导航按钮 - 仅在客户端挂载后显示 
      */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        {isMounted && <MobileNavButton />}
      </div>
      
      {/* 主内容区域 - 分为左侧设置导航和右侧内容 */}
      <main
        className={cn(
          "w-full h-screen overflow-auto",
          getMainMarginLeft(),
          "transition-[margin-left] duration-300 ease-in-out",
          colors.textColor.tailwind
        )}
      >
        <div className="h-full flex flex-col md:flex-row">
          {/* 设置侧边导航 - 移动端响应式隐藏，调整z-index防止被主sidebar遮挡 */}
          <div className={cn(
            "hidden md:block w-64 border-r shrink-0 relative z-40",
            colors.borderColor.tailwind,
            colors.pageBackground.tailwind
          )}>
            <SettingsSidebar />
          </div>
          
          {/* 移动端设置导航 - 仅在移动端显示 */}
          <div className={cn(
            "block md:hidden p-4 border-b",
            colors.borderColor.tailwind
          )}>
            <SettingsMobileNav />
          </div>
          
          {/* 设置内容区域 */}
          <div className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
