"use client"

import type * as React from "react"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useTheme } from "@lib/hooks/use-theme"

interface SidebarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  text: string
  active?: boolean
}

export function SidebarButton({ icon, text, active = false, className, onClick, ...props }: SidebarButtonProps) {
  const { isExpanded, lockExpanded } = useSidebarStore()
  const { isDark } = useTheme()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    lockExpanded()
    onClick?.(e)
  }

  return (
    <button
      className={cn(
        "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium",
        "transition-all duration-200 ease-in-out",
        "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark ? "focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",

        "border border-transparent",
        
        !isDark && [
          "text-stone-600 hover:text-stone-900",
          "hover:bg-stone-300 hover:shadow-md", // 增强悬停效果，使用更深的背景色和阴影
          active 
            ? "bg-stone-300 text-stone-900 font-semibold shadow-sm border-stone-400/80"
            : "",
        ],
        
        isDark && [
          "text-gray-200 hover:text-white",
          "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
          active 
            ? "bg-stone-700 text-blue-300 font-semibold shadow-sm border-stone-600"
            : "",
        ],
        
        isExpanded ? "w-full" : "w-10",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <span className={cn(
        "flex h-5 w-5 items-center justify-center",
        "transition-[margin,transform,color] duration-200 ease-in-out",
        
        active 
          ? (isDark ? "text-blue-400" : "text-primary") 
          : (isDark ? "text-gray-400" : "text-gray-500"),
        
        !isExpanded && "scale-110",
        !isExpanded && "-ml-0.5",
      )}>
        {icon}
      </span>

      <span className={cn(
        "absolute left-10 whitespace-nowrap transition-colors duration-200",
        active && (isDark ? "text-blue-300" : "text-primary font-medium"),
        isExpanded ? "block" : "hidden"
      )}>
        {text}
      </span>
    </button>
  )
}