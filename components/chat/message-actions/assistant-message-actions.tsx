"use client"

import React from "react"
import { MessageActionsContainer } from "@components/ui/message-actions-container"
import { CopyButton } from "./buttons/copy-button"
import { RegenerateButton } from "./buttons/regenerate-button"
import { FeedbackButton } from "./buttons/feedback-button"
import { useFeedbackManager } from "./hooks/use-feedback-manager"

interface AssistantMessageActionsProps {
  messageId: string
  content?: string
  onRegenerate: () => void
  onFeedback: (isPositive: boolean) => void
  isRegenerating?: boolean
  className?: string
}

/**
 * 助手消息操作按钮组件
 * 
 * 组合了复制、重新生成和反馈按钮，用于助手消息下方的操作区域
 * 
 * 🎯 思维链支持：
 * - 对于包含思维链的消息，只复制主要内容部分，不包含 <think> 和 <details> 标签内的推理过程
 * - 当思维链未完成时，复制按钮会被隐藏，避免复制不完整的内容
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
  
  // --- 检查是否有可复制的内容 ---
  const hasContentToCopy = content && content.trim().length > 0;
  
  return (
    <MessageActionsContainer 
      align="left" 
      isAssistantMessage={true}
      className={className}
    >
      {/* 复制按钮 - 只在有内容时显示 */}
      {hasContentToCopy && (
        <CopyButton content={content} />
      )}
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
