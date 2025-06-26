"use client"

import { History } from "@components/history"
import { NavBar } from "@components/nav-bar"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useEffect } from "react"
import { useTheme } from "@lib/hooks/use-theme"
import { cn } from "@lib/utils"

// --- BEGIN COMMENT ---
// 历史对话页面
// 使用 History 组件显示历史对话列表
// 与侧边栏集成，支持动态伸缩
// 参考 settings 页面的实现，保持简单的挂载逻辑
// --- END COMMENT ---
export default function HistoryPage() {
  const { isExpanded } = useSidebarStore()
  const { isDark } = useTheme()
  
  // --- BEGIN COMMENT ---
  // 🎯 移除重复的 setMounted 调用，现在由全局 ClientLayout 统一管理
  // --- END COMMENT ---
  useEffect(() => {
    // 设置页面标题
    document.title = "历史对话 | AgentifUI"
  }, [])

  return (
    <>
      {/* --- 添加导航栏 --- */}
      <NavBar />
      
      <div className={cn(
        "h-full w-full overflow-hidden",
        // --- 为navbar留出顶部空间 ---
        "pt-12"
      )}>
        <History />
      </div>
    </>
  )
}
