"use client"

import React from "react"
import { FiCopy, FiCheck } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { useCopyAction } from "../hooks/use-copy-action"

interface CopyButtonProps {
  content?: string
  disabled?: boolean
  tooltipPosition?: "top" | "bottom" | "left" | "right"
  className?: string
}

/**
 * 复制按钮组件
 * 
 * 封装了复制功能的按钮，点击后会复制指定内容并显示已复制状态
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  disabled = false,
  tooltipPosition = "bottom",
  className
}) => {
  const { handleCopy, isCopied } = useCopyAction(content || '')
  
  // 当没有内容或被禁用时，不执行复制操作
  const handleClick = () => {
    if (disabled || !content || content.trim().length === 0) {
      return
    }
    handleCopy()
  }
  
  return (
    <MessageActionButton
      icon={FiCopy}
      activeIcon={FiCheck}
      label={disabled ? "无内容可复制" : "复制"}
      activeLabel="已复制"
      onClick={handleClick}
      active={isCopied && !disabled}
      disabled={disabled}
      tooltipPosition={tooltipPosition}
      className={className}
    />
  )
}
