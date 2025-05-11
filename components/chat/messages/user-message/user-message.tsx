"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useTheme, useMobile, useMounted } from "@lib/hooks"
import { MessageAttachment } from '@lib/stores/chat-store'
import { FileAttachmentDisplay } from './file-attachment-display'
import { UserMessageActions } from '@components/chat/message-actions'

interface UserMessageProps {
  content: string
  attachments?: MessageAttachment[]
  id: string
  className?: string
  onCopy?: () => void
  onEdit?: () => void
}

export const UserMessage: React.FC<UserMessageProps> = ({ 
  content, 
  attachments = [], 
  id, 
  className,
  onCopy = () => console.log('Copy message', id),
  onEdit = () => console.log('Edit message', id)
}) => {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  const isMounted = useMounted()
  const hasAttachments = attachments && attachments.length > 0

  if (!isMounted) {
    return null
  }
  
  return (
    <div 
      className="flex justify-end w-full group"
      data-message-id={id}
    >
      <div className="flex flex-col items-end max-w-3xl w-full">
        {/* 附件显示区域 - 直接右对齐 */}
        {hasAttachments && (
          <FileAttachmentDisplay 
            attachments={attachments.map(att => ({
              id: att.id,
              name: att.name,
              size: att.size,
              type: att.type,
              upload_file_id: att.upload_file_id
            }))}
            isDark={isDark}
            className={cn(
              "w-full mb-2",
            )}
          />
        )}
        {/* 消息气泡 - 现代化设计，石色主题 */}
        <div
          className={cn(
            "max-w-full rounded-2xl px-4 py-3 text-base leading-relaxed",
            isDark 
              ? "bg-stone-700/90 text-stone-100" 
              : "bg-stone-200 text-stone-800",
            "border",
            isDark ? "border-stone-600/30" : "border-stone-300/80",
            className
          )}
        >
          {content}
        </div>
        
        {/* 消息操作按钮 */}
        <UserMessageActions
          messageId={id}
          content={content}
          onEdit={onEdit}
        />
      </div>
    </div>
  )
}
