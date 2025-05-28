"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { TypeWriter } from "@components/ui/typewriter"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useAppParametersV2 } from "@lib/hooks/use-app-parameters-v2"
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
  // 🎯 使用新的数据库优先的应用参数Hook
  // 替代原有的useAppParameters，获得更好的性能和用户体验
  // --- END COMMENT ---
  const { currentAppId } = useCurrentApp()
  const { parameters, isLoading: isParametersLoading, error: parametersError, source } = useAppParametersV2(currentAppId)

  // --- BEGIN COMMENT ---
  // 智能处理欢迎文字的显示逻辑
  // 优先级：动态开场白 > 用户名问候 > 默认文字
  // 🎯 优化：数据库优先策略让加载更快，减少等待时间
  // --- END COMMENT ---
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 🎯 应用切换时立即重置状态，准备显示新内容
    // --- END COMMENT ---
    setShouldStartTyping(false);
    setFinalText("");

    // --- BEGIN COMMENT ---
    // 🎯 优化的加载逻辑：数据库优先策略让大部分情况下无需等待
    // 只有在真正需要等待时才显示加载状态
    // --- END COMMENT ---
    if (username === undefined) {
      console.log('[WelcomeScreen] 等待用户信息加载...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 新策略：由于数据库优先，大部分情况下可以立即获得参数
    // 只在确实需要等待API调用时才显示加载状态
    // --- END COMMENT ---
    if (currentAppId && isParametersLoading && !parameters) {
      console.log('[WelcomeScreen] 等待应用参数加载...', { 
        currentAppId, 
        source,
        hasParameters: !!parameters 
      });
      return;
    }

    // 确定最终显示的文字
    let welcomeText = "";
    
    // 优先使用动态开场白（如果获取成功且不为空）
    if (currentAppId && parameters?.opening_statement && !parametersError) {
      welcomeText = parameters.opening_statement;
      console.log('[WelcomeScreen] 使用应用开场白:', {
        appId: currentAppId,
        source,
        text: welcomeText.substring(0, 50) + '...'
      });
    } else if (username) {
      // 如果没有开场白但有用户名，使用用户名问候
      welcomeText = `${getTimeBasedGreeting()}，${username}`;
      console.log('[WelcomeScreen] 使用用户名问候:', welcomeText);
    } else {
      // 都没有的话使用默认问候
      welcomeText = getTimeBasedGreeting();
      console.log('[WelcomeScreen] 使用默认问候:', welcomeText);
    }
    
    // --- BEGIN COMMENT ---
    // 如果获取应用参数失败，记录错误但不影响用户体验
    // 自动fallback到用户名问候或默认问候
    // --- END COMMENT ---
    if (parametersError && currentAppId) {
      console.warn('[WelcomeScreen] 获取应用参数失败，使用fallback文字:', {
        appId: currentAppId,
        error: parametersError,
        fallbackText: welcomeText
      });
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 优化延迟：数据库优先策略让延迟几乎为0
    // 只有API fallback时才需要短暂延迟
    // --- END COMMENT ---
    const delay = (source === 'database' || !isParametersLoading) ? 50 : 200; // 数据库来源几乎立即显示
    
    const timer = setTimeout(() => {
      setFinalText(welcomeText);
      setShouldStartTyping(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [username, parameters?.opening_statement, currentAppId, isParametersLoading, parametersError, source]);

  return (
      <div 
        className={cn(
          "welcome-screen flex flex-col items-center justify-center text-center",
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
                  width: welcomeTextTitle.width 
                    ? `calc(${welcomeTextTitle.width} - 2rem)` // 移动端：基于强制宽度减去padding
                    : welcomeTextTitle.maxWidth 
                      ? `calc(${welcomeTextTitle.maxWidth} - 8rem)` // 桌面端：基于最大宽度减去padding
                      : '80vw', // 回退方案
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