"use client"

import React, { useState, useEffect, useMemo } from "react"
import { cn } from "@lib/utils"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useWelcomeLayout } from "@lib/hooks/use-welcome-layout"
import { useChatWidth } from "@lib/hooks"
import { SuggestedQuestionButton } from "@components/ui/suggested-question-button"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useTypewriterStore } from "@lib/stores/ui/typewriter-store"

interface DynamicSuggestedQuestionsProps {
  className?: string
}

/**
 * 动态推荐问题组件
 * 从数据库配置中获取推荐问题并渐进显示
 * 等待欢迎文字打字机完成后才开始渲染
 */
export const DynamicSuggestedQuestions = ({ className }: DynamicSuggestedQuestionsProps) => {
  const { widthClass, paddingClass } = useChatWidth()
  const { currentAppInstance, isValidating, isLoading } = useCurrentApp()
  const { setMessage } = useChatInputStore()
  
  // --- BEGIN COMMENT ---
  // 🎯 监听打字机完成状态
  // --- END COMMENT ---
  const { isWelcomeTypewriterComplete } = useTypewriterStore()
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取推荐问题的位置
  // --- END COMMENT ---
  const { suggestedQuestions: questionsPosition, needsCompactLayout } = useWelcomeLayout()

  // --- BEGIN COMMENT ---
  // 🎯 应用切换状态检测，与welcome-screen保持一致
  // --- END COMMENT ---
  const [isAppSwitching, setIsAppSwitching] = useState(false)
  const [displayQuestions, setDisplayQuestions] = useState<string[]>([])
  const [shouldShowQuestions, setShouldShowQuestions] = useState(false)

  // --- BEGIN COMMENT ---
  // 🎯 应用切换检测逻辑，与welcome-screen完全一致
  // --- END COMMENT ---
  useEffect(() => {
    const pathname = window.location.pathname
    const isOnAppDetailPage = pathname.startsWith('/apps/') && pathname.split('/').length === 4
    const isOnNewChatPage = pathname === '/chat/new'
    
    if (isOnAppDetailPage) {
      const urlInstanceId = pathname.split('/')[3]
      const currentInstanceId = currentAppInstance?.instance_id
      
      const isUrlAppMismatch = currentInstanceId && currentInstanceId !== urlInstanceId;
      const isLoadingWithTargetApp = (isValidating || isLoading) && urlInstanceId;
      const isNoAppButHasTarget = !currentInstanceId && urlInstanceId;
      
      if (isUrlAppMismatch || isLoadingWithTargetApp || isNoAppButHasTarget) {
        setIsAppSwitching(true)
      } else if (currentInstanceId === urlInstanceId && !isValidating && !isLoading) {
        setIsAppSwitching(false)
      }
    } else if (isOnNewChatPage) {
      const appMetadata = currentAppInstance?.config?.app_metadata
      const isModelApp = appMetadata?.app_type === 'model'
      
      if (currentAppInstance && !isModelApp) {
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
    isValidating,
    isLoading
  ])

  // --- BEGIN COMMENT ---
  // 🎯 获取推荐问题，等待打字机完成后才开始处理
  // --- END COMMENT ---
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 🎯 核心条件：必须等待打字机完成
    // --- END COMMENT ---
    if (!isWelcomeTypewriterComplete) {
      setShouldShowQuestions(false);
      return;
    }

    // --- BEGIN COMMENT ---
    // 应用切换保护：验证期间或应用切换期间不更新推荐问题
    // --- END COMMENT ---
    if (isValidating || isLoading || isAppSwitching) {
      setShouldShowQuestions(false);
      return;
    }

    // --- BEGIN COMMENT ---
    // 🎯 应用实例完整性检查
    // --- END COMMENT ---
    if (!currentAppInstance?.instance_id) {
      setShouldShowQuestions(false);
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 路径一致性检查
    // --- END COMMENT ---
    const pathname = window.location.pathname;
    const isOnAppDetailPage = pathname.startsWith('/apps/') && pathname.split('/').length === 4;
    
    if (isOnAppDetailPage) {
      const urlInstanceId = pathname.split('/')[3];
      if (currentAppInstance.instance_id !== urlInstanceId) {
        setShouldShowQuestions(false);
        return;
      }
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 延迟处理：在打字机完成后稍等片刻再开始渲染推荐问题
    // --- END COMMENT ---
    const updateTimer = setTimeout(() => {
      // --- BEGIN COMMENT ---
      // 🎯 从数据库config字段直接获取推荐问题
      // --- END COMMENT ---
      const suggestedQuestions = currentAppInstance?.config?.dify_parameters?.suggested_questions;
      
      if (suggestedQuestions && Array.isArray(suggestedQuestions) && suggestedQuestions.length > 0) {
        // 过滤空字符串和无效问题
        const validQuestions = suggestedQuestions
          .filter(q => q && typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim());
          
        if (validQuestions.length > 0) {
          setDisplayQuestions(validQuestions);
          setShouldShowQuestions(true);
        } else {
          setDisplayQuestions([]);
          setShouldShowQuestions(false);
        }
      } else {
        setDisplayQuestions([]);
        setShouldShowQuestions(false);
      }
    }, 300); // 打字机完成后等待300ms再开始渲染
    
    return () => clearTimeout(updateTimer);
    
  }, [
    isWelcomeTypewriterComplete, // 🎯 核心依赖：打字机完成状态
    currentAppInstance?.config?.dify_parameters?.suggested_questions,
    currentAppInstance?.instance_id,
    isValidating,
    isLoading,
    isAppSwitching
  ]);

  // --- BEGIN COMMENT ---
  // 🎯 智能布局计算：根据问题数量动态调整布局
  // 改用flexbox布局，让按钮根据内容宽度居中显示
  // --- END COMMENT ---
  const layoutConfig = useMemo(() => {
    const count = displayQuestions.length;
    
    if (count === 0) return null;
    
    // --- BEGIN COMMENT ---
    // 使用flexbox布局，支持按钮内容自适应宽度并居中
    // 最多显示6个问题
    // --- END COMMENT ---
    return {
      maxDisplay: count > 6 ? 6 : count,
      description: `${count}个问题-flexbox居中`
    };
  }, [displayQuestions.length]);

  // --- BEGIN COMMENT ---
  // 🎯 问题点击处理
  // --- END COMMENT ---
  const handleQuestionClick = (question: string) => {
    setMessage(question);
  };

  // --- BEGIN COMMENT ---
  // 如果没有问题或不应该显示，则不渲染
  // --- END COMMENT ---
  if (!shouldShowQuestions || !layoutConfig || displayQuestions.length === 0) {
    return null;
  }

  // 限制显示的问题数量
  const questionsToShow = displayQuestions.slice(0, layoutConfig.maxDisplay);

  return (
    <div 
      className={cn(
        "w-full mx-auto",
        widthClass,
        paddingClass,
        "absolute left-1/2",
        className
      )}
      style={questionsPosition}
    >
      {/* --- BEGIN COMMENT ---
      问题容器：使用flexbox布局，支持多行换行，每行都居中对齐
      --- END COMMENT --- */}
      <div className="flex flex-wrap justify-center items-start gap-3">
        {questionsToShow.map((question, index) => (
          <SuggestedQuestionButton
            key={`${currentAppInstance?.instance_id}-${index}`}
            question={question}
            onClick={handleQuestionClick}
            animationDelay={index * 100} // 每个问题间隔100ms显示
            className={cn(
              needsCompactLayout && "py-2 px-4 text-xs"
            )}
          />
        ))}
      </div>

      {/* --- BEGIN COMMENT ---
      如果有更多问题，显示提示
      --- END COMMENT --- */}
      {displayQuestions.length > layoutConfig.maxDisplay && (
        <div className={cn(
          "mt-3 text-center opacity-0 animate-fade-in",
          "text-xs text-stone-500 dark:text-stone-500 font-serif"
        )}
        style={{
          animationDelay: `${questionsToShow.length * 100 + 200}ms`,
          animationFillMode: 'forwards'
        }}>
          还有 {displayQuestions.length - layoutConfig.maxDisplay} 个问题...
        </div>
      )}
    </div>
  )
} 