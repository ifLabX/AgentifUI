"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { IconType } from "react-icons"
import { TooltipWrapper } from "./tooltip-wrapper"

interface MessageActionButtonProps {
  icon: IconType
  label: string
  onClick: () => void
  className?: string
  tooltipPosition?: "top" | "bottom" | "left" | "right"
  disabled?: boolean
}

export const MessageActionButton: React.FC<MessageActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  className,
  tooltipPosition = "top",
  disabled = false
}) => {
  const { isDark } = useTheme()
  
  // 创建唯一的tooltip ID
  const tooltipId = `tooltip-${label.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`
  
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex items-center justify-center p-1.5 rounded-md transition-all",
        "text-sm",
        isDark 
          ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50" 
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
  
  // 如果按钮被禁用，不使用tooltip
  if (disabled) {
    return button
  }
  
  // 使用TooltipWrapper包装按钮
  return (
    <TooltipWrapper
      content={label}
      id={tooltipId}
      placement={tooltipPosition}
      desktopOnly={true}
    >
      {button}
    </TooltipWrapper>
  )
}
