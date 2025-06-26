"use client"

import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useTranslations } from 'next-intl'

// --- BEGIN COMMENT ---
// 主题卡片组件
// 用于在设置页面中展示和选择不同的主题选项
// --- END COMMENT ---
interface ThemeCardProps {
  title: string
  theme: "light" | "dark" | "system"
  currentTheme: string
  onClick: () => void
}

export function ThemeCard({ title, theme, currentTheme, onClick }: ThemeCardProps) {
  const { isDark } = useTheme()
  const t = useTranslations('pages.settings.appearanceSettings.preview')
  const isActive = currentTheme === theme
  
  // 根据主题类型渲染不同的预览内容
  const renderPreview = () => {
    switch (theme) {
      case "light":
        return (
          <div className="bg-stone-100 border border-stone-200 h-24 mb-4 rounded-md flex items-center justify-center">
            <span className="text-stone-900 font-serif">{t('light')}</span>
          </div>
        )
      case "dark":
        return (
          <div className="bg-stone-800 border border-stone-700 h-24 mb-4 rounded-md flex items-center justify-center">
            <span className="text-stone-100 font-serif">{t('dark')}</span>
          </div>
        )
      case "system":
        return (
          <div className="bg-gradient-to-r from-stone-100 to-stone-800 h-24 mb-4 rounded-md flex items-center justify-center">
            <span className="text-stone-900 bg-white px-2 rounded font-serif">{t('system')}</span>
          </div>
        )
    }
  }
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
        isActive
          ? "border-primary ring-2 ring-primary/20"
          : isDark
            ? "border-stone-700"
            : "border-stone-200"
      )}
    >
      {renderPreview()}
      <p className={cn(
        "text-sm font-medium text-center font-serif",
        isActive ? "text-primary" : isDark ? "text-stone-200" : "text-stone-900"
      )}>
        {title}
      </p>
    </div>
  )
}
