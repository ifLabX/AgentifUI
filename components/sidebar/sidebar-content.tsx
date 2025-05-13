"use client"

import * as React from "react"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useTheme } from "@lib/hooks/use-theme"
import { useMobile } from "@lib/hooks"
import { cn } from "@lib/utils"
import { SidebarChatList } from "./sidebar-chat-list"

/**
 * 侧边栏内容组件
 * 
 * 管理侧边栏主要内容区域，主要包含聊天列表
 * 提供选中状态管理，并负责将状态传递给子组件
 */
export function SidebarContent() {
  const { 
    isExpanded, 
    selectedType, 
    selectedId, 
    selectItem,
    lockExpanded,
    contentVisible,
    updateContentVisibility,
    showContent
  } = useSidebarStore()
  const { isDark } = useTheme()
  const isMobile = useMobile()

  // 处理侧边栏展开/收起的内容显示逻辑
  React.useEffect(() => {
    // 首先通知store更新内容可见性的基本状态
    updateContentVisibility(isMobile)
    
    // 只为桌面端添加延迟显示
    if (isExpanded && !isMobile) {
      const timer = setTimeout(() => {
        showContent()
      }, 50) // 桌面端保留延迟动画
      return () => clearTimeout(timer)
    }
  }, [isExpanded, isMobile, updateContentVisibility, showContent])

  /**
   * 选择聊天项目的回调函数
   * @param chatId 聊天项目的ID
   */
  const handleSelectChat = React.useCallback((chatId: number | string) => {
    selectItem('chat', chatId)
    lockExpanded() // 确保在选择聊天时保持侧边栏展开状态
  }, [selectItem, lockExpanded])



  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Top Divider - Animates opacity based on contentVisible, add invisible for robust hiding */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-px z-10",
        "transition-opacity duration-150 ease-in-out",
        isDark ? "bg-gray-700/60" : "bg-gray-200/50",
        contentVisible ? "opacity-100" : "opacity-0 invisible"
      )} />
      
      {/* Scrollable Content Area */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col gap-6 overflow-y-auto pb-4 pt-4",
          "scrollbar-thin scrollbar-track-transparent",
          isDark ? "scrollbar-thumb-gray-600" : "scrollbar-thumb-accent",
          // 在移动端上不应用动画效果，直接显示
          !isMobile && isExpanded && "transition-[opacity,transform] duration-300 ease-in-out", 
          // 控制可见性和动画状态
          isExpanded 
            ? (contentVisible 
                // 移动端上不应用动画，直接显示
                ? "opacity-100 transform-none"
                // 桌面端上保留动画效果
                : (!isMobile 
                    ? "opacity-0 scale-95 -translate-x-4 pointer-events-none" 
                    : "opacity-100 transform-none")
              ) 
            : "hidden" // 折叠时直接隐藏
        )}
      >
        {/* Chat List Section */}
        <SidebarChatList 
          isDark={isDark ?? false}
          contentVisible={contentVisible}
          selectedId={selectedType === 'chat' ? String(selectedId) : null}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Bottom Divider - Animates opacity based on contentVisible, add invisible for robust hiding */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px z-10",
        "transition-opacity duration-150 ease-in-out",
        isDark ? "bg-gray-700/60" : "bg-gray-200/50",
        contentVisible ? "opacity-100" : "opacity-0 invisible"
      )} />
    </div>
  )
} 