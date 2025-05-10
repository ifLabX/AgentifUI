"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useChatWidth } from "@lib/hooks"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface ChatInputBackdropProps {
  className?: string
}

export function ChatInputBackdrop({ className }: ChatInputBackdropProps) {
  const { colors, isDark } = useThemeColors()
  const { widthClass } = useChatWidth()
  
  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0 mx-auto",
        widthClass, // 使用统一的宽度类
        colors.mainBackground.tailwind, // <-- 始终使用 mainBackground
        className
      )}
      // style={{  <-- 修改点：移除 style
      //   background: colors.mainBackground.rgb
      // }}
    />
  )
} 