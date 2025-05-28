"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { DesktopUserAvatar } from "./desktop-user-avatar"
import { ConversationTitleButton } from "./conversation-title-button"
import { AdminButton } from "@components/admin/admin-button"

/**
 * 桌面端顶部导航栏组件
 * 特点：
 * - 仅在桌面视图显示 (md 及以上)
 * - 使用石色(stone)调色板，与应用整体风格一致
 * - 右上角显示用户头像按钮，点击弹出下拉菜单
 * - 左侧显示当前对话标题按钮（仅在历史对话页面）
 * - 管理员用户在头像左侧显示管理按钮
 * - 布局会根据侧边栏的展开/收起状态动态调整左边距
 */
export function NavBar() {
  const isMobile = useMobile()
  const { colors } = useThemeColors()
  const { isExpanded, isLocked } = useSidebarStore()

  if (isMobile) {
    return null
  }

  // --- BEGIN COMMENT ---
  // 计算左边距：桌面端始终为sidebar留出空间
  // 未锁定时：为slim状态留出16的空间
  // 锁定时：根据展开状态设置相应边距
  // --- END COMMENT ---
  const getLeftMargin = () => {
    if (!isLocked) return "left-0 md:left-16" // 未锁定时为slim状态留出空间
    return isExpanded ? "left-0 md:left-64" : "left-0 md:left-16"
  }

  return (
    <>
      {/* Header 主体 */}
      <header
        className={cn(
          "fixed top-0 right-4 h-12 z-20", 
          getLeftMargin(),
          "transition-[left] duration-300 ease-in-out",
          colors.mainBackground.tailwind,
          "flex items-center justify-between pl-4 pr-2",
        )}
      >
        <div className="flex items-center space-x-2">
          {/* --- BEGIN MODIFIED COMMENT ---
          左侧：当前对话标题按钮，支持动态隐藏策略，仅在历史对话页面显示
          --- END MODIFIED COMMENT --- */}
          <ConversationTitleButton />
        </div>
        
        <div className="flex items-center gap-3">
          {/* --- BEGIN COMMENT ---
          管理员按钮，仅对管理员用户显示
          --- END COMMENT --- */}
          <AdminButton variant="navbar" />
          
          {/* --- BEGIN COMMENT ---
          用户头像按钮
          --- END COMMENT --- */}
          <DesktopUserAvatar />
        </div>
      </header>
    </>
  )
}