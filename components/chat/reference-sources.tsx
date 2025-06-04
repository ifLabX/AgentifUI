import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { cn } from '@lib/utils'
import { useMobile } from '@lib/hooks/use-mobile'

interface RetrieverResource {
  dataset_name: string
  document_name: string
  content: string
  score: number
  position: number
  word_count: number
  page?: number | null
  dataset_id?: string
  segment_id?: string
  document_id?: string
}

interface ReferenceSourcesProps {
  retrieverResources?: RetrieverResource[]
  isDark?: boolean
  className?: string
  animationDelay?: number
}

export function ReferenceSources({ 
  retrieverResources, 
  isDark = false, 
  className,
  animationDelay = 0
}: ReferenceSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const isMobile = useMobile()

  // 如果没有引用资源，不渲染组件
  if (!retrieverResources || retrieverResources.length === 0) {
    return null
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const toggleItemExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  // 格式化相关度分数
  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%'
  }

  // 截取内容用于概览
  const getContentPreview = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <div className={cn("w-full", className)}>
      {/* --- 简洁的可点击头部区域 - 添加渐进动画效果 --- */}
      <button
        onClick={toggleExpanded}
        className={cn(
          "w-full px-3 py-2 flex items-center justify-between",
          "border rounded transition-colors duration-150",
          "focus:outline-none",
          "opacity-0 animate-fade-in",
          isDark 
            ? "bg-stone-800 border-stone-700 hover:bg-stone-700 text-stone-100" 
            : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-900"
        )}
        style={{
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'forwards'
        }}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUpIcon className={cn("h-4 w-4", isDark ? "text-stone-400" : "text-stone-500")} />
          ) : (
            <ChevronDownIcon className={cn("h-4 w-4", isDark ? "text-stone-400" : "text-stone-500")} />
          )}
          <span className="text-sm font-medium font-serif">
            📚 引用了 {retrieverResources.length} 个知识库资源
          </span>
        </div>
        
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-serif",
          isDark 
            ? "bg-stone-600 text-stone-100" 
            : "bg-stone-200 text-stone-700"
        )}>
          {retrieverResources[0]?.dataset_name || '知识库'}
        </span>
      </button>

      {/* --- 展开的引用列表 --- */}
      {isExpanded && (
        <div className={cn(
          "mt-2 border rounded p-3",
          isDark 
            ? "bg-stone-800 border-stone-700" 
            : "bg-stone-50 border-stone-200"
        )}>
          <div className="space-y-2">
            {retrieverResources.map((resource, index) => (
              <div
                key={`${resource.dataset_id}-${resource.segment_id}-${index}`}
                className={cn(
                  "p-2 rounded border-l-3 transition-colors duration-150",
                  isDark 
                    ? "bg-stone-750 border-stone-600 hover:bg-stone-700" 
                    : "bg-white border-stone-300 hover:bg-stone-50"
                )}
              >
                {/* --- 概览信息行 --- */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full font-serif",
                      isDark 
                        ? "bg-stone-600 text-white" 
                        : "bg-stone-500 text-white"
                    )}>
                      {resource.position}
                    </span>
                    <span className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded font-serif",
                      isDark 
                        ? "bg-stone-600 text-stone-200" 
                        : "bg-stone-200 text-stone-700"
                    )}>
                      {resource.dataset_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className={cn("font-serif", isDark ? "text-stone-400" : "text-stone-600")}>
                      相关度: {formatScore(resource.score)}
                    </span>
                    <span className={cn("font-serif", isDark ? "text-stone-400" : "text-stone-600")}>
                      字数: {resource.word_count.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* --- 文档标题 --- */}
                <h4 className={cn(
                  "text-sm font-medium mb-1 font-serif truncate",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  {resource.document_name}
                </h4>

                {/* --- 内容预览/完整内容 --- */}
                <div className={cn(
                  "text-sm leading-relaxed font-serif",
                  isDark ? "text-stone-300" : "text-stone-700"
                )}>
                  {expandedIndex === index ? (
                    <div className="max-h-32 overflow-y-auto">
                      {resource.content}
                    </div>
                  ) : (
                    <p>{getContentPreview(resource.content)}</p>
                  )}
                </div>

                {/* --- 展开/收起按钮 --- */}
                {resource.content.length > 120 && (
                  <button
                    onClick={() => toggleItemExpanded(index)}
                    className={cn(
                      "mt-2 text-xs px-2 py-1 rounded border transition-colors duration-150 font-serif",
                      "focus:outline-none",
                      isDark 
                        ? "border-stone-600 text-stone-400 hover:bg-stone-600 hover:text-stone-200" 
                        : "border-stone-300 text-stone-600 hover:bg-stone-200 hover:text-stone-800"
                    )}
                  >
                    {expandedIndex === index ? '收起' : '查看完整内容'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}