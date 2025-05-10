"use client"

import React from "react"
import { FiRefreshCw } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { useRegenerateAction } from "../hooks/use-regenerate-action"

interface RegenerateButtonProps {
  onRegenerate: () => void
  isRegenerating?: boolean
  tooltipPosition?: "top" | "bottom" | "left" | "right"
  className?: string
}

/**
 * 重新生成按钮组件
 * 
 * 封装了重新生成功能的按钮，点击后会触发重新生成回调
 * 支持显示加载状态
 */
export const RegenerateButton: React.FC<RegenerateButtonProps> = ({
  onRegenerate,
  isRegenerating = false,
  tooltipPosition = "bottom",
  className
}) => {
  const { handleRegenerate } = useRegenerateAction(onRegenerate, isRegenerating)
  
  return (
    <MessageActionButton
      icon={FiRefreshCw}
      label="重新生成"
      onClick={handleRegenerate}
      disabled={isRegenerating}
      className={cn(
        isRegenerating ? "animate-spin" : "",
        className
      )}
      tooltipPosition={tooltipPosition}
    />
  )
}

// 导入cn工具函数
import { cn } from "@lib/utils"
