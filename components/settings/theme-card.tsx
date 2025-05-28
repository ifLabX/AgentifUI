"use client"

import { cn } from "@lib/utils"

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
  const isActive = currentTheme === theme
  
  // 根据主题类型渲染不同的预览内容
  const renderPreview = () => {
    switch (theme) {
      case "light":
        return (
          <div className="bg-stone-100 border border-stone-200 h-24 mb-4 rounded-md flex items-center justify-center">
            <span className="text-stone-900 font-serif">亮色</span>
          </div>
        )
      case "dark":
        return (
          <div className="bg-stone-800 border border-stone-700 h-24 mb-4 rounded-md flex items-center justify-center">
            <span className="text-stone-100 font-serif">暗色</span>
          </div>
        )
      case "system":
        return (
          <div className="bg-gradient-to-r from-stone-100 to-stone-800 h-24 mb-4 rounded-md flex items-center justify-center">
            <span className="text-stone-900 bg-white px-2 rounded font-serif">系统</span>
          </div>
        )
    }
  }
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 cursor-pointer transition-all",
        "hover:shadow-md hover:-translate-y-1 duration-200",
        isActive
          ? "border-primary ring-2 ring-primary/20 dark:border-primary dark:ring-primary/20"
          : "border-stone-200 dark:border-stone-700"
      )}
    >
      {renderPreview()}
      <p className={cn(
        "text-sm font-medium text-center font-serif",
        isActive ? "text-primary" : ""
      )}>
        {title}
      </p>
    </div>
  )
}
