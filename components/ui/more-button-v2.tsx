"use client"

import React from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@lib/utils"

interface MoreButtonV2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string
}

export const MoreButtonV2 = React.forwardRef<HTMLButtonElement, MoreButtonV2Props>(
  ({ className, iconClassName, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "p-1 rounded-md transition-all duration-200 ease-in-out", // 更改为transition-all并增加动画时间
          "cursor-pointer", // 添加鼠标指针样式
          "hover:bg-black/5 dark:hover:bg-white/10",
          "hover:scale-110", // 悬停时轻微放大
          // --- BEGIN COMMENT ---
          // 添加活跃状态的视觉反馈
          // 当下拉菜单打开时的样式
          // --- END COMMENT ---
          "active:bg-black/10 dark:active:bg-white/20", 
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        <MoreHorizontal className={cn("w-4 h-4", iconClassName)} />
        <span className="sr-only">More options</span>
      </button>
    )
  }
)

MoreButtonV2.displayName = "MoreButtonV2"