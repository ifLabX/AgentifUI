"use client"

import React from "react"
import { Sparkles, ChevronUp } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface PromptButtonProps {
  className?: string
  onClick?: () => void
  expanded?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  // --- BEGIN COMMENT ---
  // 允许直接传递主题状态，避免重复计算
  // --- END COMMENT ---
  isDark?: boolean
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
  children = "提示模板",
  isDark: propIsDark
}: PromptButtonProps) {
  // --- BEGIN MODIFIED COMMENT ---
  // 如果传入了 isDark 属性，则使用传入的值，否则使用 useThemeColors 获取
  // 这样可以避免主题切换时的闪烁问题
  // --- END MODIFIED COMMENT ---
  const { colors, isDark: hookIsDark } = useThemeColors()
  const isDark = propIsDark !== undefined ? propIsDark : hookIsDark
  
  // 根据主题获取样式
  const getStyles = () => {
    const baseStyles = expanded
      ? isDark 
        ? {
            border: "border-stone-600",
            background: "bg-stone-800/50",
            text: "text-stone-300",
            icon: "text-stone-400"
          }
        : {
            border: "border-stone-300",
            background: "bg-stone-100",
            text: "text-stone-700",
            icon: "text-stone-600"
          }
      : isDark
        ? {
            border: "border-stone-700",
            background: "bg-stone-800/50 hover:bg-stone-800",
            text: "text-stone-300",
            icon: "text-stone-400"
          }
        : {
            border: "border-stone-200",
            background: "bg-white hover:bg-stone-50",
            text: "text-stone-600",
            icon: "text-stone-600 group-hover:text-stone-700"
          }

    return {
      ...baseStyles,
      iconWrapper: cn(
        "w-4 h-4",
        "transition-[color,transform] duration-300",
        baseStyles.icon,
        // 只在亮色模式下且未展开时添加动画
        !isDark && !expanded && "group-hover:animate-bounce-subtle"
      )
    }
  }
  
  const styles = getStyles()
  
  // 根据当前状态选择图标
  const defaultIcon = expanded 
    ? <ChevronUp className={styles.iconWrapper} />
    : <Sparkles className={styles.iconWrapper} />
  
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm rounded-full cursor-pointer",
        "border group whitespace-nowrap",
        "transition-[transform,box-shadow,background-color] duration-300",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        styles.border,
        styles.background,
        styles.text,
        className
      )}
      onClick={onClick}
      aria-label={typeof children === 'string' ? children : "提示按钮"}
      aria-expanded={expanded}
    >
      {icon || defaultIcon}
      <span className={cn(
        "transition-colors duration-300",
        // 仅在亮色模式下悬停时改变文本颜色
        !isDark && "group-hover:text-stone-700",
        styles.text
      )}>
        {children}
      </span>
    </button>
  )
}