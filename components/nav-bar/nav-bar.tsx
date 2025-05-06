"use client"

import React, { useRef } from "react"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks"
import { useTheme } from "@lib/hooks/use-theme"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"
import { DropdownMenu } from "@components/ui/dropdown-menu"
import { Settings, LogOut } from "lucide-react" // 示例图标
import { AvatarButton } from "./avatar-button"

// --- BEGIN COMMENT ---
// 桌面端顶部导航栏组件
// 特点：
// - 仅在桌面视图显示 (md 及以上)
// - 背景色与聊天页面背景同步 (bg-gray-50 / bg-gray-900)
// - 右上角显示用户头像按钮 (AvatarButton)，点击弹出下拉菜单
// - 布局会根据侧边栏的展开/收起状态动态调整左边距
// --- END COMMENT ---
export function NavBar() {
  const isMobile = useMobile()
  const { isDark } = useTheme()
  const { isExpanded } = useSidebarStore()

  if (isMobile) {
    return null
  }

  // --- BEGIN MODIFIED COMMENT ---
  // 根据 isExpanded 和 isDark 动态确定边框类
  // --- END MODIFIED COMMENT ---
  const borderClass = isExpanded 
    ? (isDark ? "border-b border-black" : "border-b border-slate-200") 
    : ""; // 侧边栏收起时无边框类

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-4 h-12 z-20",
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16",
          isDark ? "bg-gray-900" : "bg-gray-50",
          "flex items-center justify-between pl-4 pr-2",
          // --- BEGIN MODIFIED COMMENT ---
          // 应用动态计算的边框类
          // --- END MODIFIED COMMENT ---
          borderClass,
          "transition-[left] duration-300 ease-in-out"
        )}
      >
        <div className="flex items-center space-x-2">
          {/* <NavButton>示例按钮1</NavButton> */}
        </div>

        <div className="flex items-center">
          <AvatarButton dropdownId="user-menu" isDark={isDark} />
        </div>
      </header>

      <DropdownMenu id="user-menu" minWidth={160}>
        <DropdownMenu.Item icon={<Settings size={14} />}>设置</DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item icon={<LogOut size={14} />} danger>
          退出登录
        </DropdownMenu.Item>
      </DropdownMenu>
    </>
  )
} 