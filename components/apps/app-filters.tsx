"use client"

import { Search, Grid3x3, List } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { getDifyAppTypeInfo } from "@lib/types/dify-app-types"

interface AppFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function AppFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange
}: AppFiltersProps) {
  const { colors, isDark } = useThemeColors()

  const getCategoryDisplay = (category: string) => {
    if (category === '全部') {
      return { icon: '🔍', label: '全部' }
    }
    if (category === '常用应用') {
      return { icon: '⭐', label: '常用应用' }
    }
    if (category === '其他') {
      return { icon: '📦', label: '其他' }
    }
    
    const difyTypes = ['chatbot', 'agent', 'chatflow', 'workflow', 'text-generation']
    for (const type of difyTypes) {
      const typeInfo = getDifyAppTypeInfo(type)
      if (typeInfo && typeInfo.label === category) {
        return { icon: typeInfo.icon, label: typeInfo.label }
      }
    }
    
    return { icon: '🔧', label: category }
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="搜索应用名称、描述或标签..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-3 rounded-xl border font-serif",
            "focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent",
            "transition-colors duration-200",
            isDark ? [
              "bg-stone-800 border-stone-700 text-stone-100",
              "placeholder-stone-400"
            ] : [
              "bg-white border-stone-200 text-stone-900",
              "placeholder-stone-500"
            ]
          )}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const { icon, label } = getCategoryDisplay(category)
            const isSelected = selectedCategory === category
            
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category || '全部')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors font-serif",
                  isSelected
                    ? "bg-stone-600 text-white"
                    : isDark ? [
                        "bg-stone-800 text-stone-400 border border-stone-700",
                        "hover:bg-stone-700 hover:text-stone-300"
                      ] : [
                        "bg-white text-stone-600 border border-stone-200",
                        "hover:bg-stone-50 hover:text-stone-700"
                      ]
                )}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "flex rounded-lg border overflow-hidden",
            isDark ? "border-stone-700" : "border-stone-200"
          )}>
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'grid'
                  ? "bg-stone-600 text-white"
                  : isDark ? [
                      "bg-stone-800 text-stone-400",
                      "hover:bg-stone-700"
                    ] : [
                      "bg-white text-stone-600",
                      "hover:bg-stone-50"
                    ]
              )}
              title="网格视图"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'list'
                  ? "bg-stone-600 text-white"
                  : isDark ? [
                      "bg-stone-800 text-stone-400",
                      "hover:bg-stone-700"
                    ] : [
                      "bg-white text-stone-600",
                      "hover:bg-stone-50"
                    ]
              )}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 