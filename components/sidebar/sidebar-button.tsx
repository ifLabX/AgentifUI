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
          "text-stone-600", // 保持文字颜色不变
          "hover:bg-stone-300 hover:shadow-md", // 只保留背景和阴影的悬停效果
          active 
            ? "bg-stone-300 shadow-sm border-stone-400/80"
            : "", // 移除 font-semibold，确保字重不变
        ],
        
        isDark && [
          "text-gray-200", // 保持文字颜色不变
          "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
          active 
            ? "bg-stone-700 shadow-sm border-stone-600"
            : "", // 移除 font-semibold，确保字重不变
        ],
        
        isExpanded ? "w-full" : "w-10",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <span className={cn(
        "flex h-5 w-5 items-center justify-center",
        "transition-[margin,transform] duration-200 ease-in-out", // 移除 color 过渡
        
        // 保持图标颜色一致，不因选中状态而改变
        isDark ? "text-gray-400" : "text-gray-500",
        
        !isExpanded && "scale-110",
        !isExpanded && "-ml-0.5",
      )}>
        {icon}
      </span>

      <span className={cn(
        "absolute left-10 whitespace-nowrap", // 移除颜色过渡效果
        // 移除 active && "font-medium"，完全去除字重变化
        isExpanded ? "block" : "hidden"
      )}>
        {text}
      </span>
    </button>
  )
}