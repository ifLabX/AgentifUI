"use client"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { SidebarHeader } from "./sidebar-header"
import { SidebarContent } from "./sidebar-content"
import { SidebarFooter } from "./sidebar-footer"
import { useTheme } from "@lib/hooks/use-theme"
import { useMobile } from "@lib/hooks"
import { cn } from "@lib/utils"
import { useEffect, useState } from "react"

export function SidebarContainer() {
  const { isExpanded, setHovering, isMounted } = useSidebarStore()
  const { isDark } = useTheme()
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

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-transparent",
        "transition-all duration-300 ease-in-out",
        
        // Responsive width adjustments
        isExpanded ? "md:w-64" : "md:w-16",
        "w-0", // Initial width for mobile
        isMobile && isMounted && isExpanded ? "w-64" : "w-0", // Apply width on mobile only when mounted and expanded
        
        "z-20 fixed md:relative",
        
        // Light mode styles - 更深的灰黄色调
        !isDark && [
          "bg-stone-200/95 backdrop-blur-sm", // 更深的石灰色半透明背景
          "shadow-lg shadow-stone-300/50", // 增强阴影
          "border-r-stone-300/60", // 更深的石灰色边框
        ],
        
        // Dark mode styles
        isDark && [
          "bg-gray-900/85 backdrop-blur-sm", // Slightly transparent dark background with blur
          "shadow-lg shadow-black/30", // Adjusted dark shadow
          "border-r-gray-700/50", // Subtle dark border
          "text-gray-300",
        ],
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