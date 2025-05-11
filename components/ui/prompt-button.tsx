"use client"

import React from "react"
import { Sparkles, ChevronUp } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"

interface PromptButtonProps {
  className?: string
  onClick?: () => void
  expanded?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

/**
 * 提示按钮组件
 * 使用石色(stone)调色板，与应用整体风格一致
 */
export function PromptButton({ 
  className, 
  onClick, 
  expanded = false, 
  icon, 
  children = "提示模板" 
}: PromptButtonProps) {
  const { isDark } = useTheme()
  
  // 根据当前状态选择图标
  const defaultIcon = expanded ? (
    <ChevronUp className={cn(
      "w-4 h-4 transition-all duration-300",
      isDark ? "text-stone-400" : "text-stone-600"
    )} />
  ) : (
    <Sparkles className={cn(
      "w-4 h-4 transition-all duration-300",
      // 亮色模式下悬停时改变颜色，暗色模式下保持原色
      isDark ? "text-stone-400" : "text-stone-600 group-hover:text-stone-700 group-hover:animate-bounce-subtle"
    )} />
  )
  
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm rounded-full",
        "border transition-all duration-300 group whitespace-nowrap",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        expanded ? (
          isDark 
            ? "border-stone-600 bg-stone-800/50 text-stone-300" 
            : "border-stone-300 bg-stone-100 text-stone-700"
        ) : (
          isDark
            ? "border-stone-700 bg-stone-800/50 hover:bg-stone-800 text-stone-300"
            : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
        ),
        className
      )}
      onClick={onClick}
      aria-label={typeof children === 'string' ? children : "提示按钮"}
      aria-expanded={expanded}
    >
      {icon || defaultIcon}
      <span className={cn(
        // 仅在亮色模式下悬停时改变文本颜色
        isDark ? "transition-colors duration-300" : "group-hover:text-stone-700 transition-colors duration-300",
        expanded && (isDark ? "text-stone-300" : "text-stone-700"),
        !expanded && (isDark ? "text-stone-300" : "text-stone-600")
      )}>
        {children}
      </span>
    </button>
  )
}