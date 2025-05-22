/**
 * 聊天列表骨架屏组件
 * 
 * 在加载对话列表时显示的骨架屏效果
 */

import * as React from "react"
import { cn } from "@lib/utils"

interface ChatSkeletonProps {
  isDark: boolean
  count?: number
}

export function ChatSkeleton({ isDark, count = 5 }: ChatSkeletonProps) {
  return (
    <div className="space-y-1 mb-2">
      {Array(count).fill(0).map((_, index) => (
        <ChatSkeletonItem key={`skeleton-${index}`} isDark={isDark} />
      ))}
    </div>
  )
}

interface ChatSkeletonItemProps {
  isDark: boolean
}

export function ChatSkeletonItem({ isDark }: ChatSkeletonItemProps) {
  // --- BEGIN COMMENT ---
  // 骨架屏项目，模拟聊天项目的外观
  // 不使用外框背景色，只显示内部元素的动画效果
  // --- END COMMENT ---
  return (
    <div className="group relative px-3">
      <div className="flex items-center h-9 rounded-md">
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full mr-3 animate-pulse",
          isDark ? "bg-stone-600" : "bg-stone-400"
        )} />
        <div className={cn(
          "h-4 w-[70%] rounded-md animate-pulse",
          isDark ? "bg-stone-600" : "bg-stone-400"
        )} />
      </div>
    </div>
  )
}
