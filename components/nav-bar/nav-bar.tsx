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
  // 不再在这里计算边框类，而是直接在新的边框层 div 上应用条件
  // --- END MODIFIED COMMENT ---
  // const borderClass = isExpanded 
  //   ? (isDark ? "border-b border-black" : "border-b border-slate-200") 
  //   : "";

  return (
    <>
      {/* Header 主体，无边框 */}
      <header
        className={cn(
          "fixed top-0 right-4 h-12 z-20", 
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16",
          isDark ? "bg-gray-900" : "bg-gray-50",
          "flex items-center justify-between pl-4 pr-2",
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

      {/* --- BEGIN MODIFIED BLOCK --- */}
      {/* 移除旧的背景边框层 div */}
      {/* 
      <div 
        className={cn(
          "fixed top-0 h-12", 
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16", 
          "right-0", 
          "z-10", 
          "pointer-events-none", 
          isExpanded ? (isDark ? "border-b border-black" : "border-b border-slate-200") : "",
          "transition-[left] duration-300 ease-in-out"
        )}
      />
      */}
      
      {/* 新增：1px 高的全宽度分割线 div，位于 header 下方边缘 */}
      <div 
        className={cn(
          "fixed top-12 h-px", // 定位在 header (h-12) 的正下方，高度为 1px
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16", // 左侧对齐 header
          "right-0", // 延伸至屏幕右边缘
          "z-20", // z-index 与 header 一致或稍低即可
          "pointer-events-none", // 不干扰鼠标事件
          // 条件性地应用背景色作为线条颜色
          isExpanded ? (isDark ? 'bg-black' : 'bg-slate-200') : 'bg-transparent',
          "transition-[left] duration-300 ease-in-out" // 保持 left 过渡
        )}
      />
      {/* --- END MODIFIED BLOCK --- */}

      {/* DropdownMenu 保持不变 */}
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