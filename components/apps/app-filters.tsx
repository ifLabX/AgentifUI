"use client"

import { Search, Grid3x3, List, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useRef, useState, useEffect } from "react"

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // --- BEGIN COMMENT ---
  // 🎯 监听滚动状态，控制左右滚动按钮的显示
  // --- END COMMENT ---
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      return () => container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [categories])

  // --- BEGIN COMMENT ---
  // 🎯 滚动控制函数
  // --- END COMMENT ---
  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      const currentScroll = scrollContainerRef.current.scrollLeft
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 重构：基于用户友好的tag分类，而非技术性的Dify应用类型
  // 预定义常见标签的图标映射，提供更好的视觉体验
  // --- END COMMENT ---
  const getCategoryDisplay = (category: string) => {
    if (category === '全部') {
      return { icon: '🏪', label: '全部' }
    }
    if (category === '常用应用') {
      return { icon: '⭐', label: '常用' }
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 基于tag的图标映射 - 更贴近用户使用场景
    // 完整覆盖admin配置中的预定义标签 + 常见自定义标签
    // --- END COMMENT ---
    const tagIconMap: Record<string, { icon: string; label: string }> = {
      // --- 功能分类（核心应用场景） ---
      '写作': { icon: '✍️', label: '写作' },
      '翻译': { icon: '🌐', label: '翻译' },
      '代码': { icon: '💻', label: '编程' },
      '代码生成': { icon: '🔧', label: '代码生成' },
      '分析': { icon: '📊', label: '分析' },
      '总结': { icon: '📝', label: '总结' },
      '对话': { icon: '💬', label: '对话' },
      '助手': { icon: '🤖', label: '助手' },
      
      // --- 应用场景（admin配置中的应用场景分类） ---
      '文本生成': { icon: '📄', label: '文本生成' },
      '文档': { icon: '📋', label: '文档' },
      '数据分析': { icon: '📈', label: '数据分析' },
      '开发': { icon: '⚙️', label: '开发' },
      '生成': { icon: '✨', label: '生成' },
      
      // --- 模型类型（admin配置中的模型类型分类） ---
      '对话模型': { icon: '💭', label: '对话模型' },
      '推理模型': { icon: '🧠', label: '推理模型' },
      '文档模型': { icon: '📚', label: '文档模型' },
      '多模态': { icon: '🎨', label: '多模态' },
      
      // --- 技术特性（admin配置中的技术特性分类） ---
      '高精度': { icon: '🎯', label: '高精度' },
      '快速响应': { icon: '⚡', label: '快速' },
      '本地部署': { icon: '🏠', label: '本地' },
      '本地': { icon: '🏠', label: '本地' }, // 同义词映射
      '企业级': { icon: '🏢', label: '企业' },
      '私有': { icon: '🔒', label: '私有' },
      
      // --- 通用标签 ---
      '工具': { icon: '🛠️', label: '工具' },
      '通用': { icon: '🔄', label: '通用' },
      '专业': { icon: '⭐', label: '专业' }
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 如果没有预定义映射，使用默认的标签图标
    // 确保所有自定义标签都有合适的显示效果
    // --- END COMMENT ---
    return tagIconMap[category] || { icon: '🏷️', label: category }
  }

  return (
    <div className="space-y-4 mb-6">
      {/* 搜索框 */}
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
          isDark ? "text-stone-400" : "text-stone-500"
        )} />
        <input
          type="text"
          placeholder="搜索应用..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-lg border font-serif",
            "focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-400",
            "transition-all duration-200",
            isDark ? [
              "bg-stone-800 border-stone-700 text-stone-100",
              "placeholder:text-stone-400"
            ] : [
              "bg-white border-stone-200 text-stone-900",
              "placeholder:text-stone-500"
            ]
          )}
        />
      </div>

      {/* --- BEGIN COMMENT --- */}
      {/* 🎯 重构：单行分类标签 + 横向滚动 + 固定视图切换 */}
      {/* 确保不管有多少tag都保持单行，视图切换按钮始终可见 */}
      {/* --- END COMMENT --- */}
      <div className="flex items-center gap-3">
        {/* 左滚动按钮 */}
        {canScrollLeft && (
          <button
            onClick={() => scrollCategories('left')}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isDark ? [
                "bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-300",
                "border border-stone-700"
              ] : [
                "bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-700",
                "border border-stone-200 shadow-sm"
              ]
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* 分类标签容器 - 横向滚动 */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto no-scrollbar"
        >
          <div className="flex gap-2 pb-1"> {/* pb-1 留出滚动条空间 */}
            {categories.map((category) => {
              const { icon, label } = getCategoryDisplay(category)
              const isSelected = selectedCategory === category
              
              return (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 font-serif",
                    "whitespace-nowrap flex-shrink-0", // 防止收缩和换行
                    isSelected ? [
                      isDark ? [
                        "bg-stone-700 text-stone-100",
                        "ring-1 ring-stone-600"
                      ] : [
                        "bg-stone-900 text-white",
                        "ring-1 ring-stone-300"
                      ]
                    ] : [
                      isDark ? [
                        "bg-stone-800 text-stone-300 hover:bg-stone-700",
                        "border border-stone-700 hover:border-stone-600"
                      ] : [
                        "bg-stone-100 text-stone-700 hover:bg-stone-200",
                        "border border-stone-200 hover:border-stone-300"
                      ]
                    ]
                  )}
                >
                  <span className="text-sm">{icon}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 右滚动按钮 */}
        {canScrollRight && (
          <button
            onClick={() => scrollCategories('right')}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isDark ? [
                "bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-300",
                "border border-stone-700"
              ] : [
                "bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-700",
                "border border-stone-200 shadow-sm"
              ]
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* 视图切换 - 固定在右侧 */}
        <div className={cn(
          "flex-shrink-0 flex rounded-lg p-1 border",
          isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
        )}>
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 font-serif",
              viewMode === 'grid' ? [
                isDark ? "bg-stone-700 text-stone-100" : "bg-white text-stone-900 shadow-sm"
              ] : [
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
              ]
            )}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">网格</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 font-serif",
              viewMode === 'list' ? [
                isDark ? "bg-stone-700 text-stone-100" : "bg-white text-stone-900 shadow-sm"
              ] : [
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
              ]
            )}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">列表</span>
          </button>
        </div>
      </div>
    </div>
  )
} 