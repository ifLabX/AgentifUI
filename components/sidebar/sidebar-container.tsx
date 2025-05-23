"use client"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { SidebarHeader } from "./sidebar-header"
import { SidebarContent } from "./sidebar-content"
import { SidebarFooter } from "./sidebar-footer"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useMobile } from "@lib/hooks"
import { cn } from "@lib/utils"
import { useEffect, useState } from "react"

export function SidebarContainer() {
  const { isExpanded, isLocked, isHovering, setHovering, isMounted, getSidebarWidth } = useSidebarStore()
  const { colors, isDark } = useThemeColors()
  const isMobile = useMobile()

  // 在移动端上禁用悬停事件
  const handleMouseEnter = () => {
    if (!isMobile) {
      setHovering(true)
    }
  }
  
  const handleMouseLeave = () => {
    if (!isMobile) {
      setHovering(false)
    }
  }

  // 根据主题获取侧边栏样式
  const getSidebarStyles = () => {
    if (isDark) {
      return {
        shadow: "shadow-xl shadow-black/40",
        border: "border-r-stone-700/50",
        text: "text-stone-300"
      }
    } else {
      return {
        shadow: "shadow-xl shadow-stone-300/60",
        border: "border-r-stone-300/60",
        text: "text-stone-700"
      }
    }
  }

  const styles = getSidebarStyles()

  // --- BEGIN COMMENT ---
  // 计算z-index：
  // - 移动端：始终使用高z-index
  // - 桌面端：区分锁定和非锁定状态，非锁定时需要更高优先级覆盖其他内容
  // --- END COMMENT ---
  const getZIndex = () => {
    if (isMobile) return "z-50"
    // 桌面端：非锁定状态使用更高z-index，确保覆盖settings等页面内容
    if (!isLocked) return "z-45" // 比settings sidebar的z-40更高
    // 锁定状态使用较低z-index，不需要覆盖其他内容
    return "z-30"
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full flex flex-col border-r",
        // 过渡效果 - 移动端使用transform过渡，桌面端使用width过渡
        isMobile 
          ? "transition-transform duration-300 ease-in-out" 
          : "transition-[width] duration-300 ease-in-out",
        
        // 宽度设置 - 始终保持固定宽度
        isExpanded ? "w-64" : "w-16",
        
        // 移动端的显示/隐藏逻辑
        isMobile && !isExpanded && "-translate-x-full",
        isMobile && isExpanded && "translate-x-0",
        
        // 桌面端始终显示
        !isMobile && "translate-x-0",
        
        // 移动端未挂载时隐藏，避免初始闪烁
        isMobile && !isMounted && "opacity-0",
        
        // Z-index 设置
        getZIndex(),
        
        // 主题样式
        colors.sidebarBackground.tailwind,
        "backdrop-blur-sm",
        styles.shadow,
        styles.border,
        styles.text,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <SidebarHeader />
        <SidebarContent />
        <SidebarFooter />
      </div>
    </aside>
  )
} 