"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { cn } from '@lib/utils'
import { CheckCircle, XCircle, Clock, ChevronRight, Check, Loader2 } from 'lucide-react'

interface ExecutionItemProps {
  execution: any
  onClick: () => void
  isMultiSelectMode?: boolean
  isSelected?: boolean
  isLoading?: boolean
}

/**
 * 单个执行记录项组件
 * 
 * 显示执行记录的基本信息和状态
 */
export function ExecutionItem({ execution, onClick, isMultiSelectMode, isSelected, isLoading }: ExecutionItemProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  
  const getStatusIcon = () => {
    switch (execution.status) {
      case 'completed':
        return <CheckCircle className={cn(
          "h-3.5 w-3.5",
          isDark ? "text-stone-400" : "text-stone-600"
        )} />
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />
      case 'running':
        return <Clock className={cn(
          "h-3.5 w-3.5 animate-pulse",
          isDark ? "text-stone-400" : "text-stone-600"
        )} />
      default:
        return <Clock className={cn(
          "h-3.5 w-3.5",
          isDark ? "text-stone-400" : "text-stone-600"
        )} />
    }
  }
  
  const getStatusText = () => {
    switch (execution.status) {
      case 'completed':
        return '已完成'
      case 'failed':
        return '已失败'
      case 'running':
        return '执行中'
      default:
        return '未知'
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-md border cursor-pointer transition-all duration-200",
        "hover:shadow-sm",
        // 选中状态样式
        isMultiSelectMode && isSelected && (
          isDark
            ? "border-stone-500 bg-stone-600/50"
            : "border-stone-400 bg-stone-300/50"
        ),
        // 默认样式
        (!isMultiSelectMode || !isSelected) && (
          isDark
            ? "border-stone-700/50 bg-stone-700/30 hover:bg-stone-700/50 hover:border-stone-600/50"
            : "border-stone-300/50 bg-stone-50/50 hover:bg-stone-200/50 hover:border-stone-400/50"
        )
      )}
    >
      <div className="flex items-center justify-between">
        {/* 多选模式下的复选框 */}
        {isMultiSelectMode && (
          <div className={cn(
            "flex items-center justify-center w-4 h-4 rounded border mr-3",
            isSelected
              ? isDark
                ? "bg-stone-500 border-stone-500"
                : "bg-stone-600 border-stone-600"
              : isDark
                ? "border-stone-600"
                : "border-stone-300"
          )}>
            {isSelected && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* 标题和状态 */}
          <div className="flex items-center gap-2 mb-1.5">
            {getStatusIcon()}
            <h3 className={cn(
              "text-sm font-medium font-serif truncate",
              colors.mainText.tailwind
            )}>
              {execution.title}
            </h3>
          </div>
          
          {/* 时间和耗时 */}
          <div className="flex items-center gap-3 text-xs font-serif">
            <span className={cn(
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {formatDate(execution.created_at)}
            </span>
            
            {execution.elapsed_time && (
              <span className={cn(
                isDark ? "text-stone-500" : "text-stone-500"
              )}>
                {execution.elapsed_time}s
              </span>
            )}
          </div>
          
          {/* 错误信息 */}
          {execution.status === 'failed' && execution.error_message && (
            <div className="mt-1.5 text-xs text-red-500 font-serif truncate">
              {execution.error_message}
            </div>
          )}
        </div>
        
        {/* 状态标签 */}
        <div className="flex items-center gap-2 ml-3">
          <span className={cn(
            "text-xs font-serif px-2 py-0.5 rounded-sm",
            execution.status === 'completed' && "bg-stone-200/50 text-stone-700 dark:bg-stone-700/50 dark:text-stone-300",
            execution.status === 'failed' && "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            execution.status === 'running' && "bg-stone-300/50 text-stone-700 dark:bg-stone-600/50 dark:text-stone-300"
          )}>
            {getStatusText()}
          </span>
          
          {/* 只在非多选模式下显示箭头或loading */}
          {!isMultiSelectMode && (
            isLoading ? (
              <Loader2 className={cn(
                "h-3.5 w-3.5 animate-spin",
                isDark ? "text-stone-500" : "text-stone-400"
              )} />
            ) : (
              <ChevronRight className={cn(
                "h-3.5 w-3.5",
                isDark ? "text-stone-500" : "text-stone-400"
              )} />
            )
          )}
        </div>
      </div>
    </div>
  )
} 