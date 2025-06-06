"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { FileText, Activity, History } from 'lucide-react'

type MobileTab = 'form' | 'tracker' | 'history'

interface MobileTabSwitcherProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  hasHistory: boolean
}

/**
 * 移动端标签切换器组件
 * 
 * 在移动端提供表单、跟踪器、历史记录之间的切换
 */
export function MobileTabSwitcher({ activeTab, onTabChange, hasHistory }: MobileTabSwitcherProps) {
  const { isDark } = useTheme()
  
  const tabs = [
    {
      id: 'form' as const,
      label: '输入表单',
      icon: FileText
    },
    {
      id: 'tracker' as const,
      label: '执行状态',
      icon: Activity
    },
    {
      id: 'history' as const,
      label: '历史记录',
      icon: History
    }
  ]
  
  return (
    <div className={cn(
      "flex border-b",
      isDark ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-white"
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-serif transition-colors",
              isActive
                ? isDark
                  ? "text-stone-100 border-b-2 border-stone-400"
                  : "text-stone-900 border-b-2 border-stone-600"
                : isDark
                  ? "text-stone-400 hover:text-stone-300"
                  : "text-stone-600 hover:text-stone-700"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
} 