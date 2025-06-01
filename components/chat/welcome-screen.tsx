"use client"

import React, { useMemo, useState, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { TypeWriter } from "@components/ui/typewriter"
import { useCurrentApp } from "@lib/hooks/use-current-app"
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
  // --- BEGIN COMMENT ---
  // 🎯 新增：TypeWriter重置键，确保应用切换时能够重新打字
  // --- END COMMENT ---
  const [typewriterKey, setTypewriterKey] = useState(0)
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取欢迎文字的位置和标题样式
  // --- END COMMENT ---
  const { welcomeText: welcomePosition, welcomeTextTitle, needsCompactLayout } = useWelcomeLayout()

  // --- BEGIN COMMENT ---
  // 🎯 直接从当前应用实例获取开场白配置
  // 完全基于数据库，无任何API调用
  // 添加验证状态保护，避免应用切换时显示错误内容
  // 🎯 新增：路径感知的状态保护，确保应用切换时序正确
  // --- END COMMENT ---
  const { currentAppInstance, isValidating, isLoading } = useCurrentApp()

  // --- BEGIN COMMENT ---
  // 🎯 新增：路径感知的应用切换检测
  // 检测当前路径与应用实例是否匹配，避免显示错误应用的内容
  // 🎯 优化：增强应用切换检测逻辑，确保与应用详情页面的优化保持一致
  // --- END COMMENT ---
  const [isAppSwitching, setIsAppSwitching] = useState(false)
  
  useEffect(() => {
    // 检测应用切换状态
    const pathname = window.location.pathname
    const isOnAppDetailPage = pathname.startsWith('/apps/') && pathname.split('/').length === 4
    const isOnNewChatPage = pathname === '/chat/new'
    
    if (isOnAppDetailPage) {
      // 在应用详情页面，检查当前应用是否与URL匹配
      const urlInstanceId = pathname.split('/')[3] // /apps/{type}/[instanceId] 中的 instanceId
      const currentInstanceId = currentAppInstance?.instance_id
      
      // --- BEGIN COMMENT ---
      // 🎯 优化：更严格的应用切换检测
      // 1. URL应用与当前应用不匹配
      // 2. 或者正在验证/加载中（表示可能正在切换）
      // 3. 或者当前没有应用实例但URL指向特定应用
      // --- END COMMENT ---
      const isUrlAppMismatch = currentInstanceId && currentInstanceId !== urlInstanceId;
      const isLoadingWithTargetApp = (isValidating || isLoading) && urlInstanceId;
      const isNoAppButHasTarget = !currentInstanceId && urlInstanceId;
      
      if (isUrlAppMismatch || isLoadingWithTargetApp || isNoAppButHasTarget) {
        console.log('[WelcomeScreen] 检测到应用切换状态:', {
          isUrlAppMismatch,
          isLoadingWithTargetApp,
          isNoAppButHasTarget,
          currentInstanceId,
          urlInstanceId
        });
        setIsAppSwitching(true)
      } else if (currentInstanceId === urlInstanceId && !isValidating && !isLoading) {
        // 只有在应用匹配且不在加载状态时才认为切换完成
        setIsAppSwitching(false)
      }
    } else if (isOnNewChatPage) {
      // 在新对话页面，检查当前应用是否为模型类型
      const appMetadata = currentAppInstance?.config?.app_metadata
      const isModelApp = appMetadata?.app_type === 'model'
      
      if (currentAppInstance && !isModelApp) {
        console.log('[WelcomeScreen] 检测到应用切换：新对话页面但当前应用不是模型类型')
        setIsAppSwitching(true)
      } else if (isModelApp && !isValidating && !isLoading) {
        setIsAppSwitching(false)
      }
    } else {
      setIsAppSwitching(false)
    }
  }, [
    currentAppInstance?.instance_id, 
    currentAppInstance?.config?.app_metadata,
    isValidating,  // 🎯 新增：监听验证状态变化
    isLoading      // 🎯 新增：监听加载状态变化
  ])

  // --- BEGIN COMMENT ---
  // 🎯 纯数据库策略的欢迎文字显示逻辑
  // 数据库有配置 → 使用开场白
  // 数据库无配置 → 用户名问候 → 默认问候
  // 移除骨架屏，依赖 PageLoadingSpinner 处理长时间加载
  // 🎯 增强验证状态保护，确保应用切换时序正确
  // 🎯 新增：防抖机制，避免快速切换时的闪烁
  // --- END COMMENT ---
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 🎯 应用切换保护：验证期间或应用切换期间不更新欢迎文字
    // 避免显示错误应用的开场白
    // --- END COMMENT ---
    if (isValidating || isLoading || isAppSwitching) {
      console.log('[WelcomeScreen] 应用正在验证、加载或切换中，暂停更新欢迎文字', {
        isValidating,
        isLoading,
        isAppSwitching
      });
      return;
    }

    // --- BEGIN COMMENT ---
    // 等待用户信息加载完成
    // --- END COMMENT ---
    if (username === undefined) {
      console.log('[WelcomeScreen] 等待用户信息加载...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 应用实例完整性检查：确保有完整的应用信息
    // --- END COMMENT ---
    if (!currentAppInstance?.instance_id) {
      console.log('[WelcomeScreen] 等待应用实例加载完成...');
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 新增：路径一致性检查，确保当前应用与URL匹配
    // 避免在应用切换过程中显示错误的开场白
    // --- END COMMENT ---
    const pathname = window.location.pathname;
    const isOnAppDetailPage = pathname.startsWith('/apps/') && pathname.split('/').length === 4;
    
    if (isOnAppDetailPage) {
      const urlInstanceId = pathname.split('/')[3];
      if (currentAppInstance.instance_id !== urlInstanceId) {
        console.log('[WelcomeScreen] 路径不匹配，等待应用切换完成', {
          currentApp: currentAppInstance.instance_id,
          urlApp: urlInstanceId
        });
        return;
      }
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 防抖机制：延迟更新，避免快速切换时的闪烁
    // --- END COMMENT ---
    const updateTimer = setTimeout(() => {
      // --- BEGIN COMMENT ---
      // 🎯 确定最终显示的文字 - 纯数据库策略
      // --- END COMMENT ---
      let welcomeText = "";
      
      // --- BEGIN COMMENT ---
      // 🎯 从数据库config字段直接获取开场白
      // --- END COMMENT ---
      const openingStatement = currentAppInstance?.config?.dify_parameters?.opening_statement;
      
      if (openingStatement && openingStatement.trim()) {
        // --- BEGIN COMMENT ---
        // 情况1：数据库中有应用的开场白配置
        // --- END COMMENT ---
        welcomeText = openingStatement.trim();
        console.log('[WelcomeScreen] 使用数据库开场白:', {
          appId: currentAppInstance?.instance_id,
          source: 'database_config',
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
      // 🎯 直接设置文字，无需骨架屏
      // 🎯 同时更新TypeWriter重置键，确保重新开始打字动画
      // --- END COMMENT ---
      setFinalText(welcomeText);
      setTypewriterKey(prev => prev + 1); // 强制TypeWriter重新开始
    }, 100); // 100ms 防抖延迟
    
    // 清理定时器
    return () => clearTimeout(updateTimer);
    
  }, [
    username, 
    currentAppInstance?.config?.dify_parameters?.opening_statement, 
    currentAppInstance?.instance_id,
    isValidating,     // 🎯 监听验证状态
    isLoading,        // 🎯 监听加载状态
    isAppSwitching    // �� 新增：监听应用切换状态
  ]);

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
          {/* --- BEGIN COMMENT ---
          直接显示打字机效果，无骨架屏
          长时间加载由 PageLoadingSpinner 处理
          🎯 添加key属性，确保应用切换时重新开始打字动画
          --- END COMMENT --- */}
          <TypeWriter 
            key={typewriterKey} // 🎯 强制重新开始打字动画
            text={finalText}
            speed={30}
            delay={200} // 减少延迟，更快响应
            waitingEffect={finalText.endsWith("...")}
            className={cn(
              "font-bold leading-tight",
              needsCompactLayout ? "text-xl" : "text-3xl"
            )}
          />
        </h2>
      </div>
    </div>
  )
} 