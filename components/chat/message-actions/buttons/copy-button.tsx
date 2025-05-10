"use client"

import React from "react"
import { FiCopy, FiCheck } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { useCopyAction } from "../hooks/use-copy-action"

interface CopyButtonProps {
  content: string
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
  tooltipPosition = "bottom",
  className
}) => {
  const { handleCopy, isCopied } = useCopyAction(content)
  
  return (
    <MessageActionButton
      icon={FiCopy}
      activeIcon={FiCheck}
      label="复制"
      activeLabel="已复制"
      onClick={handleCopy}
      active={isCopied}
      tooltipPosition={tooltipPosition}
      className={className}
    />
  )
}
