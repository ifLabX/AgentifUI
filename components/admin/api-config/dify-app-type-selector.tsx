"use client"

import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { type DifyAppType, getAllDifyAppTypes } from "@lib/types/dify-app-types"

interface DifyAppTypeSelectorProps {
  value: DifyAppType | undefined
  onChange: (type: DifyAppType) => void
  className?: string
}

/**
 * Dify应用类型选择器组件
 * 基于现有app_type选择器的设计模式
 */
export function DifyAppTypeSelector({ value, onChange, className }: DifyAppTypeSelectorProps) {
  const { isDark } = useThemeColors()
  const allTypes = getAllDifyAppTypes()

  return (
    <div className={cn("space-y-4", className)}>
      {/* --- 标题和说明 --- */}
      <div>
        <label className={cn(
          "block text-sm font-medium mb-3 font-serif",
          isDark ? "text-stone-300" : "text-stone-700"
        )}>
          Dify应用类型 (dify_apptype) *
        </label>
        
        {/* --- 响应式网格布局：移动端1列，平板2列，桌面3列 --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allTypes.map((typeInfo) => (
            <button
              key={typeInfo.key}
              type="button"
              onClick={() => onChange(typeInfo.key)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-lg border transition-colors cursor-pointer text-left",
                "hover:shadow-sm active:scale-[0.98]",
                value === typeInfo.key
                  ? isDark
                    ? "border-stone-500 bg-stone-700/50"
                    : "border-stone-400 bg-stone-100"
                  : isDark
                    ? "border-stone-600 hover:border-stone-500"
                    : "border-stone-300 hover:border-stone-400"
              )}
            >
              {/* --- 顶部：图标、标题和选择指示器 --- */}
              <div className="flex items-center gap-3 w-full">
                <div className="text-2xl flex-shrink-0">{typeInfo.icon}</div>
                <div className="flex-1">
                  <div className={cn(
                    "font-medium text-sm font-serif",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    {typeInfo.label}
                  </div>
                  <div className={cn(
                    "text-xs font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    {typeInfo.description}
                  </div>
                </div>
                
                {/* --- 单选按钮指示器 --- */}
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  value === typeInfo.key
                    ? isDark
                      ? "border-stone-400 bg-stone-400"
                      : "border-stone-600 bg-stone-600"
                    : isDark
                      ? "border-stone-500"
                      : "border-stone-400"
                )}>
                  {value === typeInfo.key && (
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isDark ? "bg-stone-800" : "bg-white"
                    )} />
                  )}
                </div>
              </div>
              
              {/* --- 底部：功能特性标签 --- */}
              <div className="flex flex-wrap gap-1 mt-1 w-full">
                {typeInfo.features.slice(0, 3).map(feature => (
                  <span
                    key={feature}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-serif",
                      isDark
                        ? "bg-stone-600 text-stone-300"
                        : "bg-stone-200 text-stone-600"
                    )}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        
        {/* --- 底部说明文字 --- */}
        <p className={cn(
          "text-xs mt-3 font-serif",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          根据Dify官方文档选择对应的应用类型，影响API调用端点和功能特性。
          不同类型的应用支持不同的功能和交互方式。
        </p>
      </div>
    </div>
  )
}

/**
 * 紧凑版本的Dify应用类型选择器
 * 用于空间受限的场景
 */
export function DifyAppTypeSelectorCompact({ value, onChange, className }: DifyAppTypeSelectorProps) {
  const { isDark } = useThemeColors()
  const allTypes = getAllDifyAppTypes()

  return (
    <div className={cn(className)}>
      <label className={cn(
        "block text-sm font-medium mb-2 font-serif",
        isDark ? "text-stone-300" : "text-stone-700"
      )}>
        Dify应用类型 *
      </label>
      
      <select
        value={value || 'chatbot'}
        onChange={(e) => onChange(e.target.value as DifyAppType)}
        className={cn(
          "w-full px-3 py-2 rounded-md border text-sm font-serif",
          isDark
            ? "bg-stone-700 border-stone-600 text-stone-200"
            : "bg-white border-stone-300 text-stone-900"
        )}
      >
        {allTypes.map((typeInfo) => (
          <option key={typeInfo.key} value={typeInfo.key}>
            {typeInfo.icon} {typeInfo.label} - {typeInfo.description}
          </option>
        ))}
      </select>
    </div>
  )
} 