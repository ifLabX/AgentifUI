"use client"

import React from "react"
import { MessageActionsContainer } from "@components/ui/message-actions-container"
import { CopyButton } from "./buttons/copy-button"
import { RegenerateButton } from "./buttons/regenerate-button"
import { FeedbackButton } from "./buttons/feedback-button"
import { useFeedbackManager } from "./hooks/use-feedback-manager"

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
  // 使用反馈管理hook，实现排他性
  const { selectedFeedback, handleFeedback, shouldShowButton } = useFeedbackManager(onFeedback);
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
      
      {/* 分隔线 - 使用更深的颜色，在深色模式下不那么显眼 */}
      <div className="self-stretch border-r border-gray-200/50 dark:border-gray-800/50 mx-1" />
      
      {/* 反馈按钮 - 实现排他性，点击一个时另一个消失 */}
      {shouldShowButton(true) && (
        <FeedbackButton 
          onFeedback={() => handleFeedback(true)}
          isPositive={true}
          active={selectedFeedback === true}
        />
      )}
      {shouldShowButton(false) && (
        <FeedbackButton 
          onFeedback={() => handleFeedback(false)}
          isPositive={false}
          active={selectedFeedback === false}
        />
      )}
    </MessageActionsContainer>
  )
}
