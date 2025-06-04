import React, { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { cn } from '@lib/utils'

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
}

export function ReferenceSources({ retrieverResources, isDark = false, className }: ReferenceSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 如果没有引用资源，不渲染组件
  if (!retrieverResources || retrieverResources.length === 0) {
    return null
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // 截取内容显示
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  // 格式化相关度分数
  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%'
  }

  return (
    <div className={cn(
      "w-full border rounded-lg transition-all duration-200",
      isDark 
        ? "bg-gray-800 border-gray-700 text-gray-100" 
        : "bg-gray-50 border-gray-200 text-gray-900",
      className
    )}>
      {/* --- 可点击的头部区域 --- */}
      <button
        onClick={toggleExpanded}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between",
          "hover:bg-opacity-80 transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
        )}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">📚</span>
          <span className={cn(
            "text-sm font-medium font-serif",
            isDark ? "text-gray-200" : "text-gray-700"
          )}>
            引用了 {retrieverResources.length} 个知识库资源
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-serif",
            isDark 
              ? "bg-blue-600 text-blue-100" 
              : "bg-blue-100 text-blue-700"
          )}>
            {retrieverResources[0]?.dataset_name || '知识库'}
          </span>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* --- 展开的引用列表 --- */}
      {isExpanded && (
        <div className={cn(
          "border-t px-4 pb-4",
          isDark ? "border-gray-700" : "border-gray-200"
        )}>
          <div className="space-y-3 mt-3">
            {retrieverResources.map((resource, index) => (
              <div
                key={`${resource.dataset_id}-${resource.segment_id}-${index}`}
                className={cn(
                  "p-3 rounded-md border-l-4",
                  isDark 
                    ? "bg-gray-750 border-blue-500" 
                    : "bg-white border-blue-400"
                )}
              >
                {/* --- 引用标题行 --- */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={cn(
                        "inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full font-serif",
                        isDark 
                          ? "bg-blue-600 text-white" 
                          : "bg-blue-500 text-white"
                      )}>
                        {resource.position}
                      </span>
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded font-serif",
                        isDark 
                          ? "bg-gray-600 text-gray-200" 
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {resource.dataset_name}
                      </span>
                    </div>
                    <h4 className={cn(
                      "text-sm font-medium truncate font-serif",
                      isDark ? "text-gray-100" : "text-gray-900"
                    )}>
                      {resource.document_name}
                    </h4>
                  </div>
                </div>

                {/* --- 统计信息 --- */}
                <div className="flex items-center space-x-4 mb-2 text-xs">
                  <span className={cn(
                    "font-serif",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    相关度: {formatScore(resource.score)}
                  </span>
                  <span className={cn(
                    "font-serif",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    字数: {resource.word_count.toLocaleString()}
                  </span>
                  {resource.page && (
                    <span className={cn(
                      "font-serif",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      页码: {resource.page}
                    </span>
                  )}
                </div>

                {/* --- 内容预览 --- */}
                <div className={cn(
                  "text-sm leading-relaxed p-3 rounded font-serif",
                  isDark 
                    ? "bg-gray-800 text-gray-300" 
                    : "bg-gray-50 text-gray-700"
                )}>
                  {truncateContent(resource.content, 150)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 