"use client"

import type * as React from "react"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useTheme } from "@lib/hooks/use-theme"

interface SidebarButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  active?: boolean
  isLoading?: boolean
  moreActionsTrigger?: React.ReactNode
  isDisabled?: boolean 
  children?: React.ReactNode
  disableLockBehavior?: boolean
  variant?: 'default' | 'transparent' // 新增：控制悬停效果样式
}

export function SidebarButton({ 
  icon, 
  active = false, 
  isLoading = false, 
  className, 
  onClick, 
  moreActionsTrigger,
  isDisabled = false,
  children,
  disableLockBehavior = false,
  variant = 'default',
  ...props 
}: SidebarButtonProps) {
  const { isExpanded } = useSidebarStore()
  const { isDark } = useTheme()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    
    // --- BEGIN COMMENT ---
    // 立即移除focus，避免影响父容器的cursor显示
    // --- END COMMENT ---
    e.currentTarget.blur();
    
    onClick?.(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      
      const mockEvent = { ...e, type: 'click' } as unknown as React.MouseEvent<HTMLDivElement>; 
      onClick?.(mockEvent);
    }
  }

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      className={cn(
        "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium",
        "transition-all duration-150 ease-in-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "select-none", // 防止文字选中
        isDark ? "focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
        "border border-transparent",
        "h-10",
        // --- BEGIN COMMENT ---
        // 恢复cursor-pointer，现在父容器使用cursor-e-resize不会冲突
        // disabled时使用cursor-not-allowed
        // --- END COMMENT ---
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        !isDark && !isDisabled && [
          "text-stone-600",
          variant === 'transparent' 
            ? "hover:bg-stone-300/80" 
            : "hover:bg-stone-300/80",
          active && "bg-stone-300 shadow-sm border-stone-400/80",
        ],
        !isDark && isDisabled && ["text-stone-400"],
        isDark && !isDisabled && [
          "text-gray-200",
          variant === 'transparent' 
            ? "hover:bg-stone-600/60" 
            : "hover:bg-stone-600/60",
          active && "bg-stone-700 shadow-sm border-stone-600",
        ],
        isDark && isDisabled && ["text-gray-500"],
        isExpanded ? "w-full" : "w-10 justify-center",
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className="flex flex-1 items-center min-w-0">
        {isLoading ? (
          <span className={cn("flex h-5 w-5 items-center justify-center flex-shrink-0")}>
            <div className={cn("h-4 w-4 animate-pulse rounded-full", isDark ? "bg-stone-600" : "bg-stone-400", "opacity-80")} />
          </span>
        ) : (
          <span className={cn(
            "flex h-5 w-5 items-center justify-center -ml-0.5 flex-shrink-0", 
            isDark ? "text-gray-400" : "text-gray-500",
          )}>
            {icon}
          </span>
        )}
        {isExpanded && children && (
          <div className={cn(
            "ml-2 flex-1 min-w-0 truncate",
            "flex items-center leading-normal"
          )}> 
            {children}
          </div>
        )}
      </div>
      {isExpanded && moreActionsTrigger && (
        <div 
          className={cn("ml-1 flex-shrink-0")}
          onClick={(e) => {
            e.stopPropagation(); // Prevent click on MoreButton area from selecting the chat item
          }}
          // Optional: Add onKeyDown stopPropagation if needed, but Popover trigger should handle its own key events.
          // onKeyDown={(e) => e.stopPropagation()} 
        >
          {moreActionsTrigger}
        </div>
      )}
    </div>
  )
}