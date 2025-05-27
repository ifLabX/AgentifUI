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

// 北京时间获取方式
const getTimeBasedGreeting = () => {
  const now = new Date();
  const beijingTime = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: 'numeric',
    hour12: false
  }).format(now);
  
  const hour = parseInt(beijingTime);
  
  if (hour >= 6 && hour < 12) {
    return "早上好";
  } else if (hour >= 12 && hour < 18) {
    return "下午好";
  } else if (hour >= 18 && hour < 22) {
    return "晚上好";
  } else {
    return "夜深了";
  }
};

export const WelcomeScreen = ({ className, username }: WelcomeScreenProps) => {
  const { isDark } = useTheme()
  const [finalText, setFinalText] = useState("")
  const [shouldStartTyping, setShouldStartTyping] = useState(false)
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取欢迎文字的位置和标题样式
  // --- END COMMENT ---
  const { welcomeText: welcomePosition, welcomeTextTitle, needsCompactLayout } = useWelcomeLayout()

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
      welcomeText = `${getTimeBasedGreeting()}，${username}`;
    } else {
      // 都没有的话使用默认问候
      welcomeText = getTimeBasedGreeting();
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
          className
        )}
        style={welcomePosition}
      >

      <div className="w-full">
        {/* --- BEGIN COMMENT ---
        主标题容器：使用Hook提供的最高优先级宽度设置
        --- END COMMENT --- */}
        <h2 
          className={cn(
            "font-bold mb-2 mx-auto",
            needsCompactLayout ? "text-xl" : "text-2xl",
            "leading-tight"
          )}
          style={welcomeTextTitle}
        >

          {shouldStartTyping ? (
            <TypeWriter 
              text={finalText}
              speed={30} // 主标题稍慢
              delay={300} // 延迟开始，给页面加载一点时间
              waitingEffect={finalText.endsWith("...")} // 只有等待状态才显示效果
              className={cn(
                "font-bold leading-tight",
                needsCompactLayout ? "text-xl" : "text-3xl"
              )}
            />
          ) : (
            <div className="flex items-center justify-center">
              {/* --- BEGIN COMMENT ---
              skeleton宽度：使用Hook提供的动态宽度，确保与标题宽度一致
              --- END COMMENT --- */}
              <div 
                className={cn(
                  "bg-stone-200/60 dark:bg-stone-700/60 rounded animate-pulse",
                  needsCompactLayout ? "h-6" : "h-7"
                )}
                style={{
                  width: `calc(${welcomeTextTitle.maxWidth} - 20rem)`, // 减去padding
                  maxWidth: '90vw' // 确保不超出视口
                }}
              ></div>
            </div>
          )}
        </h2>
        {/* <p className={cn(
          isDark ? "text-gray-400" : "text-gray-500",
          // --- BEGIN COMMENT ---
          // 副标题尺寸：紧凑模式使用xs，正常模式使用sm，避免过大
          // --- END COMMENT ---
          needsCompactLayout ? "mt-1 text-xs" : "mt-4 text-sm"
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
                needsCompactLayout ? "text-xs" : "text-sm"
              )}
            />
          )}
        </p> */}
      </div>
    </div>
  )
} 