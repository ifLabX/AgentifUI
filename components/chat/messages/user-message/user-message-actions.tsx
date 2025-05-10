"use client"

import React from "react"
import { FiCopy, FiEdit2, FiCheck } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { MessageActionsContainer } from "@components/ui/message-actions-container"

interface UserMessageActionsProps {
  messageId: string
  onCopy: () => void
  onEdit: () => void
  className?: string
}

export const UserMessageActions: React.FC<UserMessageActionsProps> = ({
  messageId,
  onCopy,
  onEdit,
  className
}) => {
  return (
    <MessageActionsContainer 
      align="right" 
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
        icon={FiEdit2}
        label="编辑"
        onClick={onEdit}
        tooltipPosition="bottom"
      />
    </MessageActionsContainer>
  )
}
