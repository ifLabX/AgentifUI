"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useSettingsColors } from "@lib/hooks/use-settings-colors"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { DesktopUserAvatar } from "./desktop-user-avatar"
import { ConversationTitleButton } from "./conversation-title-button"

/**
 * 桌面端顶部导航栏组件
 * 特点：
 * - 仅在桌面视图显示 (md 及以上)
 * - 使用石色(stone)调色板，与应用整体风格一致
 * - 右上角显示用户头像按钮，点击弹出下拉菜单
 * - 左侧显示当前对话标题按钮（仅在历史对话页面）
 * - 布局会根据侧边栏的展开/收起状态动态调整左边距
 * - 在设置页面自动适配设置页面的背景色
 */
export function NavBar() {
  const isMobile = useMobile()
  const pathname = usePathname()
  const { colors } = useThemeColors()
  const { colors: settingsColors } = useSettingsColors()
  const { isExpanded, isLocked } = useSidebarStore()

  if (isMobile) {
    return null
  }

  // --- BEGIN COMMENT ---
  // 检测是否在设置页面，如果是则使用设置页面的背景色
  // --- END COMMENT ---
  const isSettingsPage = pathname?.startsWith('/settings')
  const backgroundColor = isSettingsPage ? settingsColors.pageBackground.tailwind : colors.mainBackground.tailwind

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
          backgroundColor,
          "flex items-center justify-between pl-4 pr-2",
        )}
      >
        <div className="flex items-center space-x-2">
          {/* --- BEGIN MODIFIED COMMENT ---
          左侧：当前对话标题按钮，支持动态隐藏策略，仅在历史对话页面显示
          --- END MODIFIED COMMENT --- */}
          <ConversationTitleButton />
        </div>
        
        <div className="flex items-center">
          {/* --- BEGIN COMMENT ---
          用户头像按钮
          --- END COMMENT --- */}
          <DesktopUserAvatar />
        </div>
      </header>
    </>
  )
}