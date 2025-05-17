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
  ...props 
}: SidebarButtonProps) {
  const { isExpanded, lockExpanded } = useSidebarStore()
  const { isDark } = useTheme()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    lockExpanded()
    onClick?.(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      lockExpanded();
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
        "transition-all duration-200 ease-in-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark ? "focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
        "border border-transparent",
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        !isDark && !isDisabled && [
          "text-stone-600",
          "hover:bg-stone-300 hover:shadow-md",
          active && "bg-stone-300 shadow-sm border-stone-400/80",
        ],
        !isDark && isDisabled && ["text-stone-400"],
        isDark && !isDisabled && [
          "text-gray-200",
          "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
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
          <span className={cn("flex h-5 w-5 items-center justify-center")}>
            <div className={cn("h-4 w-4 animate-pulse rounded-full", isDark ? "bg-stone-600" : "bg-stone-400", "opacity-80")} />
          </span>
        ) : (
          <span className={cn("flex h-5 w-5 items-center justify-center -ml-0.5", 
          isDark ? "text-gray-400" : "text-gray-500",)}>
            {icon}
          </span>
        )}
        {isExpanded && children && (
          <div className="ml-2 flex-1 min-w-0 truncate"> 
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