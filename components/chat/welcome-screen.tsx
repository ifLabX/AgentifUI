"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { useChatLayoutStore, INITIAL_INPUT_HEIGHT } from "@lib/stores/chat-layout-store"

interface WelcomeScreenProps {
  className?: string
  username?: string | null
}

// 定义欢迎页文本内容的向上偏移，在这里修改垂直高度
const WELCOME_TEXT_SHIFT = "-8rem"; // 示例偏移值（根据需要调整）

export const WelcomeScreen = ({ className, username }: WelcomeScreenProps) => {
  const { isDark } = useTheme()
  const { inputHeight } = useChatLayoutStore()
  
  // 计算基于输入框高度增加的半个偏移量（用于外部容器）
  const offsetY = Math.max(0, (inputHeight - INITIAL_INPUT_HEIGHT) / 2)

  return (
    <div 
      className={cn("flex flex-col items-center h-full transition-transform duration-200 ease-in-out", className)}
      // 这个变换处理基于输入框高度的动态移动
      style={{ transform: `translateY(-${offsetY}px)` }}
    >
      {/* 内部包装器应用静态向上偏移，而不改变边距 */}
      <div style={{ transform: `translateY(${WELCOME_TEXT_SHIFT})` }}>
        <div className="text-center max-w-md px-4 mt-[30vh]"> {/* 保持原始边距 */}
          <h2 className="text-2xl font-bold mb-2">
            你好，{username ? username : <span className="animate-pulse text-gray-400">企业用户</span>}
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
            在下方输入框中输入消息开始聊天
          </p>
        </div>
      </div>
    </div>
  )
} 