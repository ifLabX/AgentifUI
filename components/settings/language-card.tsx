"use client"

import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useTranslations } from 'next-intl'
import { SupportedLocale, getLanguageInfo } from '@lib/config/language-config'

// --- BEGIN COMMENT ---
// 语言卡片组件
// 用于在设置页面中展示和选择不同的语言选项
// --- END COMMENT ---
interface LanguageCardProps {
  language: SupportedLocale
  currentLanguage: SupportedLocale
  onClick: () => void
}

export function LanguageCard({ language, currentLanguage, onClick }: LanguageCardProps) {
  const { isDark } = useTheme()
  const isActive = currentLanguage === language
  const languageInfo = getLanguageInfo(language)
  
  // 渲染语言预览内容
  const renderPreview = () => {
    return (
      <div className={cn(
        "h-24 mb-4 rounded-md flex items-center justify-center",
        isDark 
          ? "bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-stone-700"
          : "bg-gradient-to-r from-blue-100 to-green-100 border border-stone-200"
      )}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{languageInfo.flag}</span>
          <div className="text-center">
            <div className={cn(
              "font-medium text-lg font-serif",
              isDark ? "text-gray-100" : "text-gray-900"
            )}>
              {languageInfo.nativeName}
            </div>
            <div className={cn(
              "text-sm font-serif",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              {languageInfo.name}
            </div>
          </div>
        </div>
      </div>
    )
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
        {languageInfo.nativeName}
      </p>
    </div>
  )
} 