"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { useChatLayoutStore, INITIAL_INPUT_HEIGHT } from "@lib/stores/chat-layout-store"
import { TypeWriter } from "@components/ui/typewriter"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useAppParameters } from "@lib/hooks/use-app-parameters"

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
  // 获取当前应用ID和应用参数
  // --- END COMMENT ---
  const { currentAppId } = useCurrentApp()
  const { parameters, isLoading: isParametersLoading, error: parametersError } = useAppParameters(currentAppId)

  // --- BEGIN COMMENT ---
  // 智能处理欢迎文字的显示逻辑
  // 优先级：动态开场白 > 用户名问候 > 默认文字
  // 包含错误处理和fallback机制
  // --- END COMMENT ---
  useEffect(() => {
    // 如果还在加载profile或应用参数，等待
    if (username === undefined || (currentAppId && isParametersLoading)) {
      return;
    }
    
    // 确定最终显示的文字
    let welcomeText = "";
    
    // 优先使用动态开场白（如果获取成功且不为空）
    if (parameters?.opening_statement && !parametersError) {
      welcomeText = parameters.opening_statement;
    } else if (username) {
      // 如果没有开场白但有用户名，使用用户名问候
      welcomeText = `你好，${username}`;
    } else {
      // 都没有的话使用默认问候
      welcomeText = "你好";
    }
    
    // --- BEGIN COMMENT ---
    // 如果获取应用参数失败，记录错误但不影响用户体验
    // 自动fallback到用户名问候或默认问候
    // --- END COMMENT ---
    if (parametersError && currentAppId) {
      console.warn('[WelcomeScreen] 获取应用参数失败，使用fallback文字:', parametersError);
    }
    
    // 等待一下确保数据稳定（避免缓存+数据库的双重更新）
    const timer = setTimeout(() => {
      setFinalText(welcomeText);
      setShouldStartTyping(true);
    }, 300); // 稍微减少延迟，因为现在有更多数据要等待
    
    return () => clearTimeout(timer);
  }, [username, parameters?.opening_statement, currentAppId, isParametersLoading, parametersError]);

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
                speed={50} // 主标题稍慢
                delay={300} // 延迟开始，给页面加载一点时间
                waitingEffect={finalText.endsWith("...")} // 只有等待状态才显示效果
                className="text-2xl font-bold"
              />
            ) : (
              <div className="flex items-center justify-center">
                {/* --- BEGIN COMMENT ---
                使用统一的较宽skeleton，适应动态开场白可能较长的情况
                --- END COMMENT --- */}
                <div className="h-7 w-60 bg-stone-200/60 dark:bg-stone-700/60 rounded animate-pulse"></div>
              </div>
            )}
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"} mt-4`}>
            {shouldStartTyping && (
              <TypeWriter 
                text="在下方输入框中输入消息开始聊天"
                speed={20} // 副标题更快
                delay={
                  // --- BEGIN COMMENT ---
                  // 根据主标题内容调整副标题的延迟时间
                  // 动态开场白通常更长，需要更多时间
                  // --- END COMMENT ---
                  parameters?.opening_statement 
                    ? Math.max(2500, finalText.length * 60) // 动态开场白：基于长度计算延迟
                    : finalText.endsWith("...") 
                      ? 1500 // 等待状态
                      : 2200 // 用户名问候
                }
                className={`${isDark ? "text-gray-400" : "text-gray-500"}`}
              />
            )}
          </p>
        </div>
      </div>
    </div>
  )
} 