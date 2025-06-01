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
 * 具有圆角效果和渐进显示动画
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

  return (
    <button
      className={cn(
        // --- 基础样式 ---
        "w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer",
        "font-serif text-sm leading-relaxed",
        
        // --- 动画效果：使用与标题相同的fade-in动画 ---
        "opacity-0 animate-fade-in",
        "hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02]",
        
        // --- 主题样式 ---
        isDark 
          ? "bg-stone-800/50 border-stone-700 text-stone-300 hover:bg-stone-800 hover:border-stone-600" 
          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
        
        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
      onClick={handleClick}
      aria-label={`推荐问题: ${question}`}
    >
      <span className="block truncate">
        {question}
      </span>
    </button>
  )
} 