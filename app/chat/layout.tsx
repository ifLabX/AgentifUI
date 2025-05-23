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
  const { isExpanded, isLocked, isMounted, setMounted } = useSidebarStore()
  const isMobile = useMobile()
  
  // 在组件挂载后设置状态
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
    <div className="flex min-h-screen h-full bg-stone-100 dark:bg-stone-800">
      {/* 侧边栏 - 始终渲染，由内部控制显示/隐藏 */}
      <Sidebar />
      
      {/* 
        移动端导航按钮 - 仅在客户端挂载后显示 
      */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        {isMounted && <MobileNavButton />}
      </div>
      
      {/* 主内容区域 - 确保聊天页面有固定高度和正确的滚动行为 */}
      <main
        className={cn(
          "w-full h-screen overflow-auto", // 使用 w-full 而不是 flex-1
          getMainMarginLeft(),
          // 过渡效果
          "transition-[margin-left] duration-300 ease-in-out"
        )}
      >
        <div className="h-full p-0">{children}</div>
      </main>
    </div>
  )
} 