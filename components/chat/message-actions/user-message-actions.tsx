"use client"

import React from "react"
import { MessageActionsContainer } from "@components/ui/message-actions-container"
import { CopyButton } from "./buttons/copy-button"
import { EditButton } from "./buttons/edit-button"

interface UserMessageActionsProps {
  messageId: string
  content: string
  onEdit: () => void
  className?: string
}

/**
 * 用户消息操作按钮组件
 * 
 * 组合了复制和编辑按钮，用于用户消息下方的操作区域
 */
export const UserMessageActions: React.FC<UserMessageActionsProps> = ({
  messageId,
  content,
  onEdit,
  className
}) => {
  return (
    <MessageActionsContainer 
      align="right" 
      className={className}
    >
      <CopyButton content={content} />
      <EditButton onEdit={onEdit} />
    </MessageActionsContainer>
  )
}
