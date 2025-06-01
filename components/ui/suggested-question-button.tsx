"use client"

import React from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"

interface SuggestedQuestionButtonProps {
  question: string
  onClick: (question: string) => void
  className?: string
  animationDelay?: number
}

/**
 * 推荐问题按钮组件
 * 具有大圆角效果和渐进显示动画
 * 根据文字长度动态调整宽度
 */
export const SuggestedQuestionButton = ({ 
  question, 
  onClick, 
  className,
  animationDelay = 0
}: SuggestedQuestionButtonProps) => {
  const { isDark } = useTheme()

  const handleClick = () => {
    onClick(question)
  }

  // 🎯 根据文字长度动态计算按钮宽度
  // 调整最大宽度，确保在容器中能正常换行
  const getButtonWidth = () => {
    const textLength = question.length
    
    if (textLength <= 10) {
      return "w-auto min-w-[120px] max-w-[180px]" // 短文本
    } else if (textLength <= 20) {
      return "w-auto min-w-[160px] max-w-[240px]" // 中等文本
    } else if (textLength <= 40) {
      return "w-auto min-w-[200px] max-w-[300px]" // 长文本
    } else {
      return "w-auto min-w-[240px] max-w-[320px]" // 超长文本
    }
  }

  return (
    <button
      className={cn(
        // --- 基础样式：超大圆角、动态宽度、边框 ---
        "text-left px-6 py-2.5 rounded-3xl border transition-colors duration-200 cursor-pointer",
        "font-serif text-sm leading-relaxed",
        
        // --- 动态宽度：根据文字长度调整 ---
        getButtonWidth(),
        
        // --- 动画效果：使用与标题相同的fade-in动画 ---
        "opacity-0 animate-fade-in",
        
        // --- 主题样式：使用main color背景，简化悬停效果，加回边框 ---
        isDark 
          ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 hover:border-stone-600" // 暗色：主背景 + 边框 -> 悬停稍亮
          : "bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200 hover:border-stone-400", // 亮色：主背景 + 边框 -> 悬停稍深
        
        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
      onClick={handleClick}
      aria-label={`推荐问题: ${question}`}
    >
      <span className="block">
        {question}
      </span>
    </button>
  )
} 