"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { TypeWriter } from "@components/ui/typewriter"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useAppParameters } from "@lib/hooks/use-app-parameters"
import { useWelcomeLayout } from "@lib/hooks/use-welcome-layout"

interface WelcomeScreenProps {
  className?: string
  username?: string | null
}

export const WelcomeScreen = ({ className, username }: WelcomeScreenProps) => {
  const { isDark } = useTheme()
  const [finalText, setFinalText] = useState("")
  const [shouldStartTyping, setShouldStartTyping] = useState(false)
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取欢迎文字的位置
  // --- END COMMENT ---
  const { welcomeText: welcomePosition, needsCompactLayout } = useWelcomeLayout()

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
      className={cn(
        "flex flex-col items-center justify-center text-center",
        // --- BEGIN COMMENT ---
        // 根据是否需要紧凑布局调整文字大小
        // --- END COMMENT ---
        needsCompactLayout ? "text-lg" : "text-2xl",
        className
      )}
      style={welcomePosition}
    >
      <div className="w-full">
        <h2 className={cn(
          "font-bold mb-2",
          needsCompactLayout ? "text-lg" : "text-2xl"
        )}>
          {shouldStartTyping ? (
            <TypeWriter 
              text={finalText}
              speed={50} // 主标题稍慢
              delay={300} // 延迟开始，给页面加载一点时间
              waitingEffect={finalText.endsWith("...")} // 只有等待状态才显示效果
              className={cn(
                "font-bold",
                needsCompactLayout ? "text-lg" : "text-2xl"
              )}
            />
          ) : (
            <div className="flex items-center justify-center">
              {/* --- BEGIN COMMENT ---
              使用统一的较宽skeleton，适应动态开场白可能较长的情况
              根据紧凑布局调整skeleton大小
              --- END COMMENT --- */}
              <div className={cn(
                "bg-stone-200/60 dark:bg-stone-700/60 rounded animate-pulse",
                needsCompactLayout ? "h-6 w-48" : "h-7 w-60"
              )}></div>
            </div>
          )}
        </h2>
        <p className={cn(
          isDark ? "text-gray-400" : "text-gray-500",
          needsCompactLayout ? "mt-2 text-sm" : "mt-4"
        )}>
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
              className={cn(
                isDark ? "text-gray-400" : "text-gray-500",
                needsCompactLayout ? "text-sm" : ""
              )}
            />
          )}
        </p>
      </div>
    </div>
  )
} 