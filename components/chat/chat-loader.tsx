"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useTheme, useChatWidth, useChatBottomSpacing } from "@lib/hooks"
import { UserMessage, AssistantMessage } from "./messages"
import { ChatMessage } from '@lib/stores/chat-store';
import { TypingDots } from "@components/ui/typing-dots";

interface ChatLoaderProps {
  messages: ChatMessage[]
  isWaitingForResponse?: boolean
  className?: string
}

export const ChatLoader = ({ messages, isWaitingForResponse = false, className }: ChatLoaderProps) => {
  const { isDark } = useTheme()
  const { widthClass, paddingClass } = useChatWidth()
  const { paddingBottomStyle } = useChatBottomSpacing()
  
  return (
    <div
      className={cn(
        "w-full mx-auto",
        widthClass, paddingClass,
        className
      )}
    >
      <div 
        className="pt-4 space-y-4"
        style={paddingBottomStyle}
      >
        {messages.map((msg) => (
          msg.isUser ? (
            <UserMessage 
              key={msg.id} 
              content={msg.text} 
              attachments={msg.attachments} 
              id={msg.id}
            />
          ) : (
            <AssistantMessage 
              key={msg.id} 
              content={msg.text} 
              isStreaming={msg.isStreaming ?? false}
              wasManuallyStopped={msg.wasManuallyStopped ?? false}
              id={msg.id}
            />
          )
        ))}

        {isWaitingForResponse && (
          <div className="flex justify-start py-2 my-2">
            <TypingDots size="lg" />
          </div>
        )}
      </div>
    </div>
  )
}

// TODO: 后续扩展功能
// 1. 支持富文本消息
// 2. 添加消息时间戳
// 3. 支持消息状态（发送中、已送达、已读）
// 4. 支持消息反馈（点赞、复制等操作）
// 5. 支持图片、文件等多媒体消息 