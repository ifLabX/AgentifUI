"use client"

import React from "react"
import { MessageActionsContainer } from "@components/ui/message-actions-container"
import { CopyButton } from "./buttons/copy-button"
import { RegenerateButton } from "./buttons/regenerate-button"
import { FeedbackButton } from "./buttons/feedback-button"

interface AssistantMessageActionsProps {
  messageId: string
  content: string
  onRegenerate: () => void
  onFeedback: (isPositive: boolean) => void
  isRegenerating?: boolean
  className?: string
}

/**
 * 助手消息操作按钮组件
 * 
 * 组合了复制、重新生成和反馈按钮，用于助手消息下方的操作区域
 */
export const AssistantMessageActions: React.FC<AssistantMessageActionsProps> = ({
  messageId,
  content,
  onRegenerate,
  onFeedback,
  isRegenerating = false,
  className
}) => {
  return (
    <MessageActionsContainer 
      align="left" 
      isAssistantMessage={true}
      className={className}
    >
      <CopyButton content={content} />
      <RegenerateButton 
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
      />
      
      {/* 分隔线 */}
      <div className="self-stretch border-r border-gray-300 dark:border-gray-700 mx-1" />
      
      {/* 反馈按钮 */}
      <FeedbackButton 
        onFeedback={(isPositive) => onFeedback(isPositive)}
        isPositive={true}
      />
      <FeedbackButton 
        onFeedback={(isPositive) => onFeedback(isPositive)}
        isPositive={false}
      />
    </MessageActionsContainer>
  )
}
