"use client"

import React from "react"
import { FiCopy, FiRefreshCw, FiThumbsUp, FiThumbsDown, FiCheck } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { MessageActionsContainer } from "@components/ui/message-actions-container"

interface AssistantMessageActionsProps {
  messageId: string
  onCopy: () => void
  onRegenerate: () => void
  onFeedback: (isPositive: boolean) => void
  className?: string
  isRegenerating?: boolean
}

export const AssistantMessageActions: React.FC<AssistantMessageActionsProps> = ({
  messageId,
  onCopy,
  onRegenerate,
  onFeedback,
  className,
  isRegenerating = false
}) => {
  return (
    <MessageActionsContainer 
      align="left" 
      isAssistantMessage={true}
      className={className}
    >
      <MessageActionButton
        icon={FiCopy}
        activeIcon={FiCheck}
        label="复制"
        activeLabel="已复制"
        onClick={onCopy}
        tooltipPosition="bottom"
      />
      <MessageActionButton
        icon={FiRefreshCw}
        label="重新生成"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={isRegenerating ? "animate-spin" : ""}
        tooltipPosition="bottom"
      />
      <div className="self-stretch border-r border-gray-300 dark:border-gray-700 mx-1" />
      <MessageActionButton
        icon={FiThumbsUp}
        label="有用"
        activeLabel="已评价"
        onClick={() => onFeedback(true)}
        tooltipPosition="bottom"
      />
      <MessageActionButton
        icon={FiThumbsDown}
        label="无用"
        activeLabel="已评价"
        onClick={() => onFeedback(false)}
        tooltipPosition="bottom"
      />
    </MessageActionsContainer>
  )
}
