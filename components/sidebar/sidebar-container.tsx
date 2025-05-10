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
  const { isExpanded, setHovering, isMounted } = useSidebarStore()
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
        colors.sidebarBackground.tailwind,
        "backdrop-blur-sm",
        
        !isDark && [
          "shadow-lg shadow-stone-300/50", 
          "border-r-stone-300/60", 
        ],
        isDark && [
          "shadow-lg shadow-black/30", 
          "border-r-gray-700/50", 
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