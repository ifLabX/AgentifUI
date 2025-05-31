"use client"

import { Blocks } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface AppHeaderProps {
  totalApps: number
  filteredApps: number
  selectedCategory?: string
}

export function AppHeader({ totalApps, filteredApps, selectedCategory }: AppHeaderProps) {
  const { isDark } = useThemeColors()

  const getCategoryDescription = () => {
    if (!selectedCategory || selectedCategory === '全部') {
      return '发现和使用各种AI应用工具'
    }
    
    switch (selectedCategory) {
      case '常用应用':
        return '您经常使用的AI应用工具'
      case 'Chatbot':
        return '基础对话聊天机器人应用'
      case 'Agent':
        return '智能代理，支持工具调用和推理'
      case 'Chatflow':
        return '对话流程编排应用'
      case '工作流':
        return '自动化工作流程应用'
      case '文本生成':
        return '单次文本生成和内容创作应用'
      case '其他':
        return '其他类型的AI应用工具'
      default:
        return `${selectedCategory} 类型的AI应用`
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-stone-600 text-white">
          <Blocks className="w-6 h-6" />
        </div>
        <div>
          <h1 className={cn(
            "text-3xl font-bold font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            应用市场
            {selectedCategory && selectedCategory !== '全部' && (
              <span className={cn(
                "text-xl font-normal ml-3",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                · {selectedCategory}
              </span>
            )}
          </h1>
          <p className={cn(
            "font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            {getCategoryDescription()}
          </p>
        </div>
      </div>
      
      <div className={cn(
        "flex items-center gap-6 text-sm font-serif",
        isDark ? "text-stone-400" : "text-stone-600"
      )}>
        <span>共 {totalApps} 个应用</span>
        {filteredApps !== totalApps && (
          <span>当前显示 {filteredApps} 个</span>
        )}
        {selectedCategory && selectedCategory !== '全部' && (
          <span>分类：{selectedCategory}</span>
        )}
      </div>
    </div>
  )
} 