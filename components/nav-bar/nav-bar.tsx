"use client"

import React, { useRef } from "react"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks"
import { useTheme } from "@lib/hooks/use-theme"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"
import { DropdownMenu } from "@components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react" // 示例图标

// --- BEGIN COMMENT ---
// 桌面端顶部导航栏组件
// 特点：
// - 仅在桌面视图显示 (md 及以上)
// - 无明显边界，通过底部细微阴影与内容区分
// - 背景色与页面背景一致，支持亮/暗主题
// - 右上角显示用户头像，点击弹出下拉菜单
// - 布局会根据侧边栏的展开/收起状态动态调整左边距
// --- END COMMENT ---
export function NavBar() {
  const isMobile = useMobile()
  const { isDark } = useTheme()
  const { isExpanded } = useSidebarStore()
  const { toggleDropdown } = useDropdownStore()
  const avatarRef = useRef<HTMLButtonElement>(null)

  const handleAvatarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation() // 阻止冒泡，特别重要，防止触发外部关闭逻辑
    if (avatarRef.current) {
      toggleDropdown("user-menu", avatarRef.current)
    }
  }

  // --- BEGIN COMMENT ---
  // 在移动端，此导航栏不渲染
  // --- END COMMENT ---
  if (isMobile) {
    return null
  }

  return (
    <>
      <header
        className={cn(
          // 定位和层级
          "fixed top-0 right-0 h-14 z-20", // 高度h-14，可调整；z-index低于sidebar(30)和dropdown(50)
          // 动态左边距，适配侧边栏
          isExpanded ? "left-0 md:left-64" : "left-0 md:left-16",
          // 背景和边框（细微阴影模拟无边框效果）
          "bg-background",
          isDark
            ? "shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]" // 暗色模式下的细线阴影
            : "shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]",      // 亮色模式下的细线阴影
          // 布局
          "flex items-center justify-between px-4", // 内部布局和内边距
          // 过渡效果
          "transition-all duration-300 ease-in-out"
        )}
      >
        {/* 左侧区域 - 可放置Logo或导航按钮 */}
        <div className="flex items-center space-x-2">
          {/* <NavButton>示例按钮1</NavButton> */}
          {/* <NavButton>示例按钮2</NavButton> */}
        </div>

        {/* 右侧区域 - 用户头像和下拉菜单 */}
        <div className="flex items-center">
          <button
            ref={avatarRef}
            onClick={handleAvatarClick}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-gray-200 dark:bg-gray-700", // 头像背景色
              "hover:opacity-80 transition-opacity",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              "dark:focus:ring-offset-gray-800"
            )}
            aria-label="用户菜单"
            data-more-button-id="user-menu-trigger" // 添加此属性以兼容dropdown关闭逻辑
          >
            {/* --- BEGIN COMMENT --- */}
            {/* 用户头像图标或图片 - 这里用 User 图标占位 */}
            {/* --- END COMMENT --- */}
            <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </header>

      {/* 用户下拉菜单 */}
      <DropdownMenu id="user-menu" minWidth={160}>
        <DropdownMenu.Item icon={<User size={14} />}>个人资料</DropdownMenu.Item>
        <DropdownMenu.Item icon={<Settings size={14} />}>设置</DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item icon={<LogOut size={14} />} danger>
          退出登录
        </DropdownMenu.Item>
      </DropdownMenu>
    </>
  )
} 