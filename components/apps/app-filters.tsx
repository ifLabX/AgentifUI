"use client"

import { Search, Grid3x3, List } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

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

  return (
    <div className="mb-8 space-y-4">
      {/* 搜索框 */}
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

      {/* 过滤和排序控件 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* 分类过滤 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category || '全部')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors font-serif",
                selectedCategory === category
                  ? "bg-stone-600 text-white"
                  : isDark ? [
                      "bg-stone-800 text-stone-400 border border-stone-700",
                      "hover:bg-stone-700"
                    ] : [
                      "bg-white text-stone-600 border border-stone-200",
                      "hover:bg-stone-50"
                    ]
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 视图切换 */}
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
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 