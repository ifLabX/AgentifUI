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
  // 🎯 使用新的数据库优先的应用参数Hook
  // 替代原有的useAppParameters，获得更好的性能和用户体验
  // --- END COMMENT ---
  const { currentAppId } = useCurrentApp()
  const { parameters, isLoading: isParametersLoading, error: parametersError, source } = useAppParameters(currentAppId)

  // --- BEGIN COMMENT ---
  // 🎯 纯数据库策略的欢迎文字显示逻辑
  // 数据库有配置 → 使用开场白
  // 数据库无配置 → 用户名问候 → 默认问候
  // --- END COMMENT ---
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 应用切换时立即重置状态，准备显示新内容
    // --- END COMMENT ---
    setShouldStartTyping(false);
    setFinalText("");

    // --- BEGIN COMMENT ---
    // 等待用户信息加载完成
    // --- END COMMENT ---
    if (username === undefined) {
      console.log('[WelcomeScreen] 等待用户信息加载...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 如果有应用ID，等待数据库参数加载完成
    // --- END COMMENT ---
    if (currentAppId && isParametersLoading) {
      console.log('[WelcomeScreen] 等待数据库参数加载...', { currentAppId });
      return;
    }

    // --- BEGIN COMMENT ---
    // 🎯 确定最终显示的文字 - 纯数据库策略
    // --- END COMMENT ---
    let welcomeText = "";
    
    if (currentAppId && parameters?.opening_statement && !parametersError) {
      // --- BEGIN COMMENT ---
      // 情况1：数据库中有应用的开场白配置
      // --- END COMMENT ---
      welcomeText = parameters.opening_statement;
      console.log('[WelcomeScreen] 使用数据库开场白:', {
        appId: currentAppId,
        source: 'database',
        text: welcomeText.substring(0, 50) + '...'
      });
    } else if (username) {
      // --- BEGIN COMMENT ---
      // 情况2：数据库无开场白配置，但有用户名 → 时间问候
      // --- END COMMENT ---
      welcomeText = `${getTimeBasedGreeting()}，${username}`;
      console.log('[WelcomeScreen] 数据库无开场白，使用用户名问候:', welcomeText);
    } else {
      // --- BEGIN COMMENT ---
      // 情况3：都没有 → 默认时间问候
      // --- END COMMENT ---
      welcomeText = getTimeBasedGreeting();
      console.log('[WelcomeScreen] 使用默认问候:', welcomeText);
    }
    
    // --- BEGIN COMMENT ---
    // 如果数据库查询出错但不影响显示，记录日志
    // --- END COMMENT ---
    if (parametersError && currentAppId) {
      console.warn('[WelcomeScreen] 数据库参数查询失败，已fallback到用户问候:', {
        appId: currentAppId,
        error: parametersError,
        fallbackText: welcomeText
      });
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 数据库查询很快，极短延迟后立即显示
    // --- END COMMENT ---
    const timer = setTimeout(() => {
      setFinalText(welcomeText);
      setShouldStartTyping(true);
    }, 50); // 极短延迟，确保状态更新完成
    
    return () => clearTimeout(timer);
  }, [username, parameters?.opening_statement, currentAppId, isParametersLoading, parametersError]);

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