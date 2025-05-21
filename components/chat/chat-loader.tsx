"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@lib/utils"
import { useTheme, useChatWidth, useChatBottomSpacing } from "@lib/hooks"
import { UserMessage, AssistantMessage } from "./messages"
import { ChatMessage } from '@lib/stores/chat-store';
import { TypingDots } from "@components/ui/typing-dots";
import { MessageSkeletonGroup } from "./message-skeleton";
import { useChatScrollStore } from "@lib/stores/chat-scroll-store"

interface ChatLoaderProps {
  messages: ChatMessage[]
  isWaitingForResponse?: boolean
  isLoadingInitial?: boolean
  className?: string
}

export const ChatLoader = ({ 
  messages, 
  isWaitingForResponse = false, 
  isLoadingInitial = false,
  className 
}: ChatLoaderProps) => {
  const { isDark } = useTheme()
  const { widthClass, paddingClass } = useChatWidth()
  const { paddingBottomStyle } = useChatBottomSpacing()
  
  // 消息容器底部引用，用于滚动到底部
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // 消息容器引用，用于scrollToBottom
  const containerRef = useRef<HTMLDivElement>(null)
  // 上一次消息数量引用，用于检测新消息
  const prevMessagesCountRef = useRef<number>(0)
  // 初始加载标记
  const initialLoadCompletedRef = useRef<boolean>(false)
  
  // 使用chatScrollStore的滚动方法
  const scrollToBottom = useChatScrollStore(state => state.scrollToBottom);
  const resetScrollState = useChatScrollStore(state => state.resetScrollState);
  const setScrollRef = useChatScrollStore(state => state.setScrollRef);
  
  // 设置滚动容器引用
  useEffect(() => {
    if (containerRef.current) {
      setScrollRef({ current: containerRef.current });
    }
  }, [setScrollRef]);
  
  // 初始加载完成时
  useEffect(() => {
    if (!isLoadingInitial && messages.length > 0 && !initialLoadCompletedRef.current) {
      // 标记初始加载已完成
      initialLoadCompletedRef.current = true
      
      // 使用多次尝试确保滚动到底部
      requestAnimationFrame(() => {
        // 首先尝试使用store的方法
        resetScrollState();
        
        // 然后直接操作DOM确保滚动到底部
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
            
            // 再次尝试，确保滚动到底部
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }, 50);
          }
        });
      });
    }
  }, [isLoadingInitial, messages.length, resetScrollState])
  
  // 当消息数量变化时
  useEffect(() => {
    // 当有新消息时，滚动到底部
    if (messages.length > prevMessagesCountRef.current && initialLoadCompletedRef.current) {
      // 使用平滑滚动效果
      scrollToBottom('smooth');
    }
    
    // 更新消息数量引用
    prevMessagesCountRef.current = messages.length
  }, [messages.length, scrollToBottom])
  
  // 确保加载完成后滚动到底部
  useEffect(() => {
    // 监听加载状态从true变为false的情况
    if (!isLoadingInitial && initialLoadCompletedRef.current) {
      requestAnimationFrame(() => {
        resetScrollState();
        
        // 再次直接操作DOM确保滚动到底部
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
      });
    }
  }, [isLoadingInitial, resetScrollState])
  
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
        {isLoadingInitial ? (
          // 显示骨架屏
          <MessageSkeletonGroup />
        ) : (
          <>
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
          </>
        )}
        
        {/* 这个div用于滚动定位，始终保持在消息列表底部 */}
        <div ref={messagesEndRef} className="h-0" />
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