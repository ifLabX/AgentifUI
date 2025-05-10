"use client"

import { Sidebar } from "@components/sidebar"
import { MobileNavButton } from "@components/mobile"
// import { NavBar } from "@components/nav-bar/nav-bar" // NavBar 将在 Page 中引入
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useEffect } from "react"
import { useMobile } from "@lib/hooks"

interface ChatLayoutProps {
  children: React.ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { isExpanded, isMobileNavVisible, isMounted, setMounted } = useSidebarStore() // Restored isMobileNavVisible just in case
  const isMobile = useMobile()
  
  // 在组件挂载后设置状态
  useEffect(() => {
    setMounted()
  }, [setMounted])

  return (
    <div className="flex min-h-screen h-full bg-blue-400">
      {/* 
        移动端导航按钮 - 仅在客户端挂载后显示 
        使用mobile类只在移动设备上显示
      */}
      <div className="md:hidden">
        {isMounted && <MobileNavButton />}
      </div>
      
      {/* 
        侧边栏 - 使用CSS媒体查询控制初始显示:
        - 在移动设备(md以下)：只有在isMounted且isExpanded时才显示
        - 在桌面设备(md及以上)：始终显示
      */}
      <div className={cn(
        // 桌面设备上始终显示
        "md:block",
        // 移动设备上根据状态控制显示
        "hidden",
        isMobile && isMounted && isExpanded ? "block" : "hidden"
      )}>
        <div className="fixed top-0 left-0 h-full z-30">
          <Sidebar />
        </div>
      </div>
      
      {/* 主内容区域 - 确保聊天页面有固定高度和正确的滚动行为 */}
      <main
        className={cn(
          "flex-1 overflow-auto h-screen", // 保持固定高度和溢出滚动
          // 桌面端根据侧边栏状态设置margin
          isExpanded ? "md:ml-64" : "md:ml-16",
          // 移动设备不设置margin
          "ml-0",
          // 过渡效果
          "transition-all duration-300 ease-in-out"
        )}
      >
        <div className="h-full p-0">{children}</div>
      </main>
    </div>
  )
} 