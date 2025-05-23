"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"
import { useLogout } from "@lib/hooks/use-logout"
import { DropdownMenu } from "@components/ui/dropdown-menu"
import { Settings, LogOut } from "lucide-react"
import { AvatarButton } from "./avatar-button"

/**
 * 桌面端顶部导航栏组件
 * 特点：
 * - 仅在桌面视图显示 (md 及以上)
 * - 使用石色(stone)调色板，与应用整体风格一致
 * - 右上角显示用户头像按钮，点击弹出下拉菜单
 * - 布局会根据侧边栏的展开/收起状态动态调整左边距
 */
export function NavBar() {
  const isMobile = useMobile()
  const { colors, isDark } = useThemeColors()
  const { isExpanded, isLocked } = useSidebarStore()
  const { logout } = useLogout()

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
          {/* 左侧空间预留给未来的导航元素 */}
        </div>
        <div className="flex items-center">
          <AvatarButton dropdownId="user-menu" isDark={isDark} />
        </div>
      </header>

      {/* 用户菜单 */}
      <DropdownMenu id="user-menu" minWidth={160}>
        <DropdownMenu.Item icon={<Settings size={14} />}>设置</DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item 
          icon={<LogOut size={14} />} 
          danger 
          onClick={logout}
        >
          退出登录
        </DropdownMenu.Item>
      </DropdownMenu>
    </>
  )
}