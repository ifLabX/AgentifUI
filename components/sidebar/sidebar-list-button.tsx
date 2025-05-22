"use client"

import type * as React from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"

// --- BEGIN COMMENT ---
// SidebarListButton 组件
// 专门为侧边栏列表项设计的按钮组件，样式更加紧凑和美观
// 不同于 SidebarButton，此组件不会占满整个侧边栏宽度
// 支持响应式布局，在移动端和桌面端有不同的表现
// --- END COMMENT ---
interface SidebarListButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  active?: boolean
  isLoading?: boolean
  moreActionsTrigger?: React.ReactNode
  isDisabled?: boolean 
  children?: React.ReactNode
}

export function SidebarListButton({ 
  icon, 
  active = false, 
  isLoading = false, 
  className, 
  onClick, 
  moreActionsTrigger,
  isDisabled = false,
  children,
  ...props 
}: SidebarListButtonProps) {
  const { isDark } = useTheme()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
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
        // --- BEGIN COMMENT ---
        // 基础样式 - 减小高度和内边距，使按钮更加纤细
        // --- END COMMENT ---
        "relative flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium",
        "transition-all duration-200 ease-in-out",
        
        // --- BEGIN COMMENT ---
        // 焦点状态样式
        // --- END COMMENT ---
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark ? "focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
        
        // --- BEGIN COMMENT ---
        // 边框样式
        // --- END COMMENT ---
        "border",
        
        // --- BEGIN COMMENT ---
        // 禁用状态样式
        // --- END COMMENT ---
        isDisabled ? "cursor-not-allowed opacity-60 border-transparent" : "cursor-pointer",
        
        // --- BEGIN COMMENT ---
        // 亮色主题样式
        // --- END COMMENT ---
        !isDark && !isDisabled && [
          "text-stone-600",
          "hover:bg-stone-300 hover:shadow-md",
          active 
            ? "bg-stone-300 shadow-sm border-stone-400/80" 
            : "border-transparent"
        ],
        !isDark && isDisabled && ["text-stone-400"],
        
        // --- BEGIN COMMENT ---
        // 暗色主题样式
        // --- END COMMENT ---
        isDark && !isDisabled && [
          "text-gray-200",
          "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
          active 
            ? "bg-stone-700 shadow-sm border-stone-600" 
            : "border-transparent"
        ],
        isDark && isDisabled && ["text-gray-500"],
        
        // --- BEGIN COMMENT ---
        // 响应式宽度样式
        // --- END COMMENT ---
        "w-full", // 默认宽度为100%
        
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
            isDark ? "text-gray-400" : "text-gray-500")}>
            {icon}
          </span>
        )}
        {children && (
          <div className="ml-2 flex-1 min-w-0 truncate"> 
            {children}
          </div>
        )}
      </div>
      {moreActionsTrigger && (
        <div 
          className={cn("ml-1 flex-shrink-0")}
          onClick={(e) => {
            e.stopPropagation(); // 防止点击 MoreButton 区域时选中聊天项
          }}
        >
          {moreActionsTrigger}
        </div>
      )}
    </div>
  )
}
