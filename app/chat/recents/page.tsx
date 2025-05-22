"use client"

import { Recents } from "@components/recents"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useEffect } from "react"
import { useTheme } from "@lib/hooks/use-theme"
import { cn } from "@lib/utils"

// --- BEGIN COMMENT ---
// 历史对话页面
// 使用 Recents 组件显示历史对话列表
// 与侧边栏集成，支持动态伸缩
// 参考 settings 页面的实现，保持简单的挂载逻辑
// --- END COMMENT ---
export default function RecentsPage() {
  const { setMounted, isExpanded } = useSidebarStore()
  const { isDark } = useTheme()
  
  // --- BEGIN COMMENT ---
  // 在组件挂载后设置状态
  // 与设置页面保持一致的实现方式
  // --- END COMMENT ---
  useEffect(() => {
    setMounted()
    
    // 设置页面标题
    document.title = "历史对话 | if-agent-ui"
  }, [setMounted])

  return (
    <div className="h-full w-full overflow-hidden">
      <Recents />
    </div>
  )
}
