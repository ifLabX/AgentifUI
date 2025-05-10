"use client"

import React from "react"
import { FiCopy, FiEdit2, FiTrash2 } from "react-icons/fi"
import { MessageActionButton } from "@components/ui/message-action-button"
import { MessageActionsContainer } from "@components/ui/message-actions-container"

interface UserMessageActionsProps {
  messageId: string
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  className?: string
}

export const UserMessageActions: React.FC<UserMessageActionsProps> = ({
  messageId,
  onCopy,
  onEdit,
  onDelete,
  className
}) => {
  return (
    <MessageActionsContainer 
      align="right" 
      className={className}
    >
      <MessageActionButton
        icon={FiCopy}
        label="复制消息"
        onClick={onCopy}
        tooltipPosition="top"
      />
      <MessageActionButton
        icon={FiEdit2}
        label="编辑消息"
        onClick={onEdit}
        tooltipPosition="top"
      />
      <MessageActionButton
        icon={FiTrash2}
        label="删除消息"
        onClick={onDelete}
        tooltipPosition="top"
      />
    </MessageActionsContainer>
  )
}
