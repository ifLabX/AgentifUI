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
  const { isExpanded } = useSidebarStore()
  const { logout } = useLogout()

  if (isMobile) {
    return null
  }
  
  // 根据主题获取导航栏样式
  const getNavStyles = () => {
    if (isDark) {
      return {
        dividerColor: "bg-stone-600"
      };
    } else {
      return {
        dividerColor: "bg-stone-300"
      };
    }
  };
  
  const navStyles = getNavStyles();

  return (
    <>
      {/* Header 主体 */}
      <header
        className={cn(
          "fixed top-0 right-4 h-12 z-20", 
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16",
          colors.mainBackground.tailwind,
          "flex items-center justify-between pl-4 pr-2",
          "transition-all duration-300 ease-in-out" 
        )}
      >
        <div className="flex items-center space-x-2">
          {/* 左侧空间预留给未来的导航元素 */}
        </div>
        <div className="flex items-center">
          <AvatarButton dropdownId="user-menu" isDark={isDark} />
        </div>
      </header>

      {/* 分割线 */}
      <div 
        className={cn(
          "fixed top-12 h-px", 
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16", 
          "right-0", 
          "z-20", 
          "pointer-events-none", 
          isExpanded ? navStyles.dividerColor : "bg-transparent",
          "transition-all duration-300 ease-in-out" 
        )}
      />

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