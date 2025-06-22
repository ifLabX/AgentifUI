"use client"

import { Sidebar } from "@components/sidebar"
import { MobileNavButton } from "@components/mobile"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useEffect } from "react"
import { useMobile } from "@lib/hooks"
import { useTheme } from "@lib/hooks/use-theme"

interface AppsLayoutProps {
  children: React.ReactNode
}

export default function AppsLayout({ children }: AppsLayoutProps) {
  const { isExpanded, isMounted, setMounted } = useSidebarStore()
  const isMobile = useMobile()
  const { isDark } = useTheme()
  
  // 在组件挂载后设置状态
  useEffect(() => {
    setMounted()
  }, [setMounted])

  // --- BEGIN COMMENT ---
  // 计算主内容区域的左边距
  // 根据sidebar展开状态设置边距，推动主内容
  // --- END COMMENT ---
  const getMainMarginLeft = () => {
    if (isMobile) return "ml-0"
    return isExpanded ? "ml-64" : "ml-16"
  }

  return (
    <div className={cn(
      "flex min-h-screen h-full",
      isDark ? "bg-stone-800" : "bg-stone-100"
    )}>
      {/* 侧边栏 - 始终渲染，由内部控制显示/隐藏 */}
      <Sidebar />
      
      {/* 
        移动端导航按钮 - 仅在客户端挂载后显示 
      */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        {isMounted && <MobileNavButton />}
      </div>
      
      {/* 主内容区域 - 应用市场页面 */}
      <main
        className={cn(
          "w-full h-screen overflow-auto", // 使用 w-full 而不是 flex-1
          getMainMarginLeft(),
          // 过渡效果
          "transition-[margin-left] duration-150 ease-in-out"
        )}
      >
        <div className="h-full p-0">{children}</div>
      </main>
    </div>
  )
} 