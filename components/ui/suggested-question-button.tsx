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
 * 按钮内文字始终保持一行，完整显示问题内容
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

  // 🎯 根据问题长度动态设置最大宽度，确保完整显示且合理换行
  const getMaxWidth = () => {
    const textLength = question.length
    
    if (textLength <= 10) {
      return "max-w-[200px]"  // 短问题
    } else if (textLength <= 20) {
      return "max-w-[300px]"  // 中等问题
    } else if (textLength <= 30) {
      return "max-w-[400px]"  // 较长问题
    } else if (textLength <= 50) {
      return "max-w-[500px]"  // 长问题
    } else {
      return "max-w-[600px]"  // 超长问题
    }
  }

  return (
    <button
      className={cn(
        // --- 基础样式：超大圆角、自适应宽度、边框 ---
        "text-left px-6 py-2.5 rounded-3xl border transition-colors duration-200 cursor-pointer",
        "font-serif text-sm leading-relaxed",
        
        // --- 🎯 关键：确保文字始终保持一行，完整显示 ---
        "whitespace-nowrap", // 强制文字不换行
        "w-auto", // 宽度根据内容自适应
        getMaxWidth(), // 根据文字长度动态设置最大宽度
        "min-w-[80px]", // 设置最小宽度，避免按钮过窄
        
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
      {question}
    </button>
  )
} 