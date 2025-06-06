"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useWorkflowHistoryStore } from "@lib/stores/workflow-history-store"
import { History } from "lucide-react"

/**
 * 工作流历史记录按钮组件（NavBar版本）
 * 
 * 仅在工作流和文本生成页面显示
 */
export function WorkflowHistoryButton() {
  const { isDark } = useTheme()
  const pathname = usePathname()
  const { showHistory, toggleHistory } = useWorkflowHistoryStore()
  
  // 检查是否在工作流或文本生成页面
  const isWorkflowPage = pathname?.includes('/apps/workflow/') || pathname?.includes('/apps/text-generation/')
  
  if (!isWorkflowPage) {
    return null
  }
  
  return (
    <button
      onClick={toggleHistory}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        "text-sm font-serif font-medium",
        showHistory
          ? isDark
            ? "bg-stone-600 text-stone-100 shadow-lg"
            : "bg-stone-700 text-white shadow-lg"
          : isDark
            ? "text-stone-300 hover:text-stone-100 hover:bg-stone-700/80 border border-stone-600"
            : "text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-300"
      )}
      title={showHistory ? "关闭历史记录" : "查看历史记录"}
    >
      <History className="h-4 w-4" />
      <span className="hidden sm:inline">
        {showHistory ? "关闭历史" : "历史记录"}
      </span>
    </button>
  )
} 