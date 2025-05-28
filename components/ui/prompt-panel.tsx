"use client"

import React from "react"
import { Sparkles, X, Check } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme, useMounted } from "@lib/hooks"

interface PromptTemplate {
  id: number | string  // 更新类型支持字符串ID
  icon: React.ReactNode
  title: string
  prompt: string
  isSelected?: boolean // 添加选中状态
}

interface PromptPanelProps {
  templates: PromptTemplate[]
  title: string
  onClose: () => void
  onSelect: (template: PromptTemplate) => void  // 修改为传递整个模板对象
  className?: string
}

/**
 * 提示面板组件
 * 使用石色(stone)调色板，与应用整体风格一致
 */
export function PromptPanel({
  templates,
  title,
  onClose,
  onSelect,
  className,
}: PromptPanelProps) {
  const { isDark } = useTheme()
  const isMounted = useMounted()

  if (!isMounted) {
    return null
  }

  return (
    <div
      className={cn(
        "z-50 rounded-xl overflow-hidden",
        "animate-slide-in-down shadow-lg",
        isDark ? "bg-stone-800 border border-stone-700" : "bg-white border border-stone-200",
        className
      )}
    >
      {/* 头部 */}
      <div className={cn(
        "flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 border-b",
        isDark ? "border-stone-700" : "border-stone-200"
      )}>
        <h3 className={cn(
          "text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2",
          "font-serif",
          isDark ? "text-stone-200" : "text-stone-800"
        )}>
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500" />
          {title}
        </h3>
        <button
          className={cn(
            "p-1 rounded-full cursor-pointer",
            isDark ? "hover:bg-stone-700 text-stone-400" : "hover:bg-stone-100 text-stone-500"
          )}
          onClick={onClose}
          aria-label="关闭"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
      
      {/* 提示列表 */}
      <div className="p-2 sm:p-3 max-h-[50vh] sm:max-h-64 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((template, index) => (
            <button
              key={template.id}
              className={cn(
                "w-full text-left p-2 sm:p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                "hover:shadow-md hover:-translate-y-0.5",
                "animate-fadein flex flex-col",
                template.isSelected 
                  ? isDark 
                    ? "border-stone-500 bg-stone-700/50 text-stone-200"
                    : "border-stone-500 bg-stone-100 text-stone-800"
                  : isDark
                    ? "border-stone-700 hover:bg-stone-700 text-stone-300"
                    : "border-stone-200 hover:bg-stone-50 text-stone-700"
              )}
              onClick={() => onSelect(template)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <span className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full",
                  template.isSelected
                    ? isDark ? "bg-stone-600 text-white" : "bg-stone-500 text-white"
                    : isDark ? "bg-stone-800/50 text-stone-300" : "bg-stone-100 text-stone-600"
                )}>
                  {template.isSelected ? <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : template.icon}
                </span>
                <span className="font-medium text-xs sm:text-sm font-serif">{template.title}</span>
              </div>
              <p className={cn(
                "text-xs line-clamp-2 font-serif",
                template.isSelected
                  ? isDark ? "text-stone-200" : "text-stone-700"
                  : isDark ? "text-stone-400" : "text-stone-500"
              )}>
                {template.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
