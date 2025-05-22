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
  const { isExpanded, isMounted, setMounted } = useSidebarStore()
  const isMobile = useMobile()
  const { colors } = useSettingsColors();
  
  // --- BEGIN COMMENT ---
  // 在组件挂载后设置状态
  // --- END COMMENT ---
  useEffect(() => {
    setMounted()
  }, [setMounted])

  return (
    <div className={cn(
      "flex min-h-screen h-full",
      colors.pageBackground.tailwind
    )}>
      {/* 
        移动端导航按钮 - 仅在客户端挂载后显示 
      */}
      <div className="md:hidden">
        {isMounted && <MobileNavButton />}
      </div>
      
      {/* 
        侧边栏 - 使用与聊天页面相同的响应式逻辑
      */}
      <div className={cn(
        "md:block",
        "hidden",
        isMobile && isMounted && isExpanded ? "block" : "hidden"
      )}>
        <div className="fixed top-0 left-0 h-full z-30">
          <Sidebar />
        </div>
      </div>
      
      {/* 主内容区域 - 分为左侧设置导航和右侧内容 */}
      <main
        className={cn(
          "flex-1 overflow-auto h-screen",
          isExpanded ? "md:ml-64" : "md:ml-16",
          "ml-0",
          "transition-all duration-300 ease-in-out",
          colors.textColor.tailwind
        )}
      >
        <div className="h-full flex flex-col md:flex-row">
          {/* 设置侧边导航 - 移动端响应式隐藏 */}
          <div className={`hidden md:block w-64 border-r ${colors.borderColor.tailwind} shrink-0`}>
            <SettingsSidebar />
          </div>
          
          {/* 移动端设置导航 - 仅在移动端显示 */}
          <div className={`block md:hidden p-4 border-b ${colors.borderColor.tailwind}`}>
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
