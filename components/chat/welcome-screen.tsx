"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { useChatLayoutStore, INITIAL_INPUT_HEIGHT } from "@lib/stores/chat-layout-store"
import { TypeWriter } from "@components/ui/typewriter"

interface WelcomeScreenProps {
  className?: string
  username?: string | null
}

// 定义欢迎页文本内容的向上偏移，在这里修改垂直高度
const WELCOME_TEXT_SHIFT = "-8rem"; // 示例偏移值（根据需要调整）

export const WelcomeScreen = ({ className, username }: WelcomeScreenProps) => {
  const { isDark } = useTheme()
  const { inputHeight } = useChatLayoutStore()
  const [finalText, setFinalText] = useState("")
  const [shouldStartTyping, setShouldStartTyping] = useState(false)
  
  // 计算基于输入框高度增加的半个偏移量（用于外部容器）
  const offsetY = Math.max(0, (inputHeight - INITIAL_INPUT_HEIGHT) / 2)

  // --- BEGIN COMMENT ---
  // 智能处理用户名变化，避免重复打印"你好"
  // 等待profile数据稳定后再开始打字
  // --- END COMMENT ---
  useEffect(() => {
    if (username === undefined) {
      // 还没有开始加载profile，等待
      return;
    }
    
    if (username === null) {
      // 明确没有用户名，显示等待状态
      setFinalText("");
      setShouldStartTyping(true);
      return;
    }
    
    // 有用户名，但等待一下确保数据稳定（避免缓存+数据库的双重更新）
    const timer = setTimeout(() => {
      setFinalText(`你好，${username}`);
      setShouldStartTyping(true);
    }, 500); // 等待500ms确保profile数据稳定
    
    return () => clearTimeout(timer);
  }, [username]);

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
            {shouldStartTyping ? (
              <TypeWriter 
                text={finalText}
                speed={120} // 主标题稍慢
                delay={300} // 延迟开始，给页面加载一点时间
                waitingEffect={finalText.endsWith("...")} // 只有等待状态才显示效果
                className="text-2xl font-bold"
              />
            ) : (
              <div className="flex items-center justify-center">
                <div className="h-7 w-40 bg-stone-200/60 dark:bg-stone-700/60 rounded animate-pulse"></div>
              </div>
            )}
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"} mt-4`}>
            {shouldStartTyping && (
              <TypeWriter 
                text="在下方输入框中输入消息开始聊天"
                speed={40} // 副标题更快
                delay={finalText.endsWith("...") ? 1500 : 2200} // 根据是否有用户名调整延迟
                className={`${isDark ? "text-gray-400" : "text-gray-500"}`}
              />
            )}
          </p>
        </div>
      </div>
    </div>
  )
} 