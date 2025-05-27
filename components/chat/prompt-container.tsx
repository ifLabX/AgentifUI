"use client"

import React, { useRef, useEffect, useState } from "react"
import { cn } from "@lib/utils"
import { useChatWidth, useWelcomeScreen, usePromptTemplateInteraction, useMounted } from "@lib/hooks"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { PromptButton } from "@components/ui/prompt-button"
import { PromptPanel } from "@components/ui/prompt-panel"
import { Sparkles, HelpCircle, BookOpen, Building, LucideIcon } from "lucide-react"
import { usePromptPanelStore } from "@lib/stores/ui/prompt-panel-store"
import { PROMPT_CATEGORIES } from "@presets/prompt"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { useWelcomeLayout } from "@lib/hooks/use-welcome-layout"

interface PromptContainerProps {
  className?: string
}

// 定义按钮图标映射
const ICON_MAP: Record<string, LucideIcon> = {
  "Sparkles": Sparkles,
  "HelpCircle": HelpCircle, 
  "BookOpen": BookOpen,
  "Building": Building
}

export const PromptContainer = ({ className }: PromptContainerProps) => {
  const { colors, isDark } = useThemeColors()
  const { widthClass, paddingClass } = useChatWidth()
  const { isWelcomeScreen } = useWelcomeScreen()
  const isMounted = useMounted()
  const containerRef = useRef<HTMLDivElement>(null)
  const { expandedId, togglePanel, resetPanel } = usePromptPanelStore()
  const { isTransitioningToWelcome } = useChatTransitionStore()
  
  // --- BEGIN COMMENT ---
  // 使用智能布局系统获取提示容器的位置
  // --- END COMMENT ---
  const { promptContainer: promptPosition, needsCompactLayout } = useWelcomeLayout()

  // 根据主题获取提示容器样式
  const getPromptStyles = () => {
    if (isDark) {
      return {
        background: colors.mainBackground.tailwind,
        border: "border-stone-700/50",
        text: "text-stone-300"
      }
    } else {
      return {
        background: colors.mainBackground.tailwind,
        border: "border-stone-300/50",
        text: "text-stone-700"
      }
    }
  }

  const styles = getPromptStyles()
  
  // 当前选中分类的模板
  const [currentTemplates, setCurrentTemplates] = useState<Array<any>>([])
  
  // 使用模板交互hook处理模板选择和输入框交互
  const { handleTemplateSelect, handlePanelClose, isTemplateSelected } = usePromptTemplateInteraction()
  
  // 当展开的分类ID变化时，更新当前显示的模板列表
  useEffect(() => {
    if (expandedId) {
      const category = PROMPT_CATEGORIES.find(cat => cat.id === expandedId)
      if (category && category.templates) {
        setCurrentTemplates(category.templates)
      } else {
        setCurrentTemplates([])
      }
    }
  }, [expandedId])
  
  // 当组件卸载时重置面板状态
  useEffect(() => {
    return () => resetPanel()
  }, [resetPanel])

  // --- BEGIN MODIFIED COMMENT ---
  // 只在组件挂载完成后才显示
  // 删除对 isWelcomeScreen 的检查，因为现在由父组件控制显示
  // --- END MODIFIED COMMENT ---
  if (!isMounted) return null

  return (
    <div 
      ref={containerRef}
      className={cn(
        "w-full mx-auto",
        widthClass,
        paddingClass,
        "absolute left-1/2",
        // 使用与 ChatContainer 相同的过渡效果
        "transition-opacity duration-100 ease-in-out",
        styles.background,
        styles.text,
        // --- BEGIN COMMENT ---
        // 根据紧凑布局调整按钮大小和间距
        // --- END COMMENT ---
        needsCompactLayout ? "text-sm" : "",
        className
      )}
      style={{ 
        top: promptPosition.top,
        transform: promptPosition.transform,
      }}
    >
      <div className={cn(
        "flex flex-wrap justify-center relative",
        // --- BEGIN COMMENT ---
        // 根据紧凑布局调整按钮间距
        // --- END COMMENT ---
        needsCompactLayout ? "gap-1 md:gap-2" : "gap-2 md:gap-3"
      )}>
        {PROMPT_CATEGORIES.map(category => {
          // 获取对应的图标组件
          const IconComponent = category.icon && ICON_MAP[category.icon] ? ICON_MAP[category.icon] : Sparkles
          
          return (
            <PromptButton 
              key={category.id}
              // 移除默认的动画效果，避免主题切换时闪烁
              className={cn(
                isTransitioningToWelcome ? "" : "hover:animate-pulse-subtle"
              )}
              onClick={() => togglePanel(category.id)} 
              expanded={expandedId === category.id}
              icon={<IconComponent className="h-4 w-4" />}
              isDark={isDark}
            >
              {category.title}
            </PromptButton>
          )
        })}
      </div>
      
      {expandedId && (
        <PromptPanel
          templates={currentTemplates.map(template => ({
            ...template,
            icon: <Sparkles className="h-4 w-4" />,
            isSelected: isTemplateSelected(template.id)
          }))}
          title={PROMPT_CATEGORIES.find(cat => cat.id === expandedId)?.title || "提示模板"}
          onClose={handlePanelClose}
          onSelect={handleTemplateSelect}
          className="absolute top-full mt-2 w-full left-0 right-0 z-10"
        />
      )}
    </div>
  )
} 