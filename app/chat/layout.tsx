"use client"

import { Sidebar } from "@components/sidebar"
import { MobileNavButton } from "@components/mobile"
import { NavBar } from "@components/nav-bar/nav-bar"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useEffect } from "react"
import { useMobile } from "@lib/hooks"

interface ChatLayoutProps {
  children: React.ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { isExpanded, isMobileNavVisible, isMounted, setMounted } = useSidebarStore()
  const isMobile = useMobile()
  
  // 在组件挂载后设置状态
  useEffect(() => {
    setMounted()
  }, [setMounted])

  return (
    <div className="flex min-h-screen bg-background">
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
      
      {/* 
        将 NavBar 和 main 包裹在一个 flex-1 的容器中，
        以便 NavBar 固定在顶部，main 占据剩余空间 
      */}
      <div className="flex flex-col flex-1">
        {/* 渲染 NavBar 组件 - 它内部处理了仅桌面显示逻辑 */}
        <NavBar />

        {/* 主内容区域，根据侧边栏状态调整margin，并增加上内边距以避开 NavBar */}
        <main
          className={cn(
            // 占据剩余空间并允许滚动
            "flex-1 overflow-auto",
            // 增加 pt-14 (NavBar 高度) 以确保内容不被遮挡
            "pt-14",
            // 桌面端根据侧边栏状态设置左 margin
            isExpanded ? "md:ml-64" : "md:ml-16",
            // 移动设备不设置左 margin
            "ml-0",
            // 过渡效果
            "transition-all duration-300 ease-in-out"
          )}
        >
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  )
} 