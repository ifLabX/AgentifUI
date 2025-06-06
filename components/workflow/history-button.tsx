"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { History } from 'lucide-react'

interface HistoryButtonProps {
  onClick: () => void
  isActive: boolean
  className?: string
}

/**
 * 历史记录按钮组件
 * 
 * 固定在右上角的浮动按钮，用于打开/关闭历史记录侧边栏
 */
export function HistoryButton({ onClick, isActive, className }: HistoryButtonProps) {
  const { isDark } = useTheme()
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-full shadow-lg transition-all duration-200",
        "hover:shadow-xl hover:scale-105",
        isActive
          ? isDark
            ? "bg-stone-600 text-stone-100"
            : "bg-stone-700 text-white"
          : isDark
            ? "bg-stone-800 text-stone-300 hover:bg-stone-700"
            : "bg-white text-stone-600 hover:bg-stone-50",
        className
      )}
      title={isActive ? "关闭历史记录" : "查看历史记录"}
    >
      <History className="h-5 w-5" />
    </button>
  )
}