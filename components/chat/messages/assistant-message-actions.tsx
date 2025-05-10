"use client"

import React from "react"
import { FiCopy, FiRefreshCw, FiThumbsUp, FiThumbsDown } from "react-icons/fi"
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
        label="复制回答"
        onClick={onCopy}
        tooltipPosition="top"
      />
      <MessageActionButton
        icon={FiRefreshCw}
        label="重新生成"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={isRegenerating ? "animate-spin" : ""}
        tooltipPosition="top"
      />
      <div className="h-4 border-r border-gray-300 dark:border-gray-700 mx-1" />
      <MessageActionButton
        icon={FiThumbsUp}
        label="有帮助"
        onClick={() => onFeedback(true)}
        tooltipPosition="top"
      />
      <MessageActionButton
        icon={FiThumbsDown}
        label="没帮助"
        onClick={() => onFeedback(false)}
        tooltipPosition="top"
      />
    </MessageActionsContainer>
  )
}
