"use client"

import React, { useState } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { IconType } from "react-icons"
import { TooltipWrapper } from "./tooltip-wrapper"

interface MessageActionButtonProps {
  icon: IconType
  activeIcon?: IconType // 激活状态图标（可选）
  label: string
  activeLabel?: string // 激活状态标签（可选）
  onClick: () => void
  className?: string
  tooltipPosition?: "top" | "bottom" | "left" | "right"
  disabled?: boolean
  active?: boolean // 是否处于激活状态
}

export const MessageActionButton: React.FC<MessageActionButtonProps> = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  activeLabel,
  onClick,
  className,
  tooltipPosition = "bottom",
  disabled = false,
  active = false
}) => {
  const { isDark } = useTheme()
  const [isActive, setIsActive] = useState(active)
  
  // 当前显示的图标和标签
  const DisplayIcon = isActive && ActiveIcon ? ActiveIcon : Icon
  const displayLabel = isActive && activeLabel ? activeLabel : label
  
  // 创建唯一的tooltip ID
  const tooltipId = `tooltip-${displayLabel.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`
  
  const handleClick = () => {
    if (!disabled) {
      // 如果提供了激活图标，则切换状态
      if (ActiveIcon || activeLabel) {
        setIsActive(prev => !prev)
      }
      onClick()
    }
  }
  
  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={displayLabel}
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
      <DisplayIcon className="w-4 h-4" />
    </button>
  )
  
  // 如果按钮被禁用，不使用tooltip
  if (disabled) {
    return button
  }
  
  // 使用TooltipWrapper包装按钮
  return (
    <TooltipWrapper
      content={displayLabel}
      id={tooltipId}
      placement={tooltipPosition}
      desktopOnly={true}
    >
      {button}
    </TooltipWrapper>
  )
}
