"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'

interface ExecutionItemProps {
  execution: any
  onClick: () => void
}

/**
 * 单个执行记录项组件
 * 
 * 显示执行记录的基本信息和状态
 */
export function ExecutionItem({ execution, onClick }: ExecutionItemProps) {
  const { isDark } = useTheme()
  
  const getStatusIcon = () => {
    switch (execution.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-stone-400" />
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
        "p-4 rounded-lg border cursor-pointer transition-all duration-200",
        "hover:shadow-md",
        isDark
          ? "border-stone-700 bg-stone-800 hover:bg-stone-750 hover:border-stone-600"
          : "border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* 标题和状态 */}
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <h3 className={cn(
              "font-medium font-serif truncate",
              isDark ? "text-stone-200" : "text-stone-800"
            )}>
              {execution.title}
            </h3>
          </div>
          
          {/* 时间和统计 */}
          <div className="flex items-center gap-4 text-xs font-serif">
            <span className={cn(
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              {formatDate(execution.created_at)}
            </span>
            
            {execution.total_steps > 0 && (
              <span className={cn(
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                {execution.total_steps} 步骤
              </span>
            )}
            
            {execution.total_tokens > 0 && (
              <span className={cn(
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                {execution.total_tokens} tokens
              </span>
            )}
            
            {execution.elapsed_time && (
              <span className={cn(
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                {execution.elapsed_time}s
              </span>
            )}
          </div>
          
          {/* 错误信息 */}
          {execution.status === 'failed' && execution.error_message && (
            <div className="mt-2 text-xs text-red-500 font-serif">
              {execution.error_message}
            </div>
          )}
        </div>
        
        {/* 状态和箭头 */}
        <div className="flex items-center gap-2 ml-4">
          <span className={cn(
            "text-xs font-serif px-2 py-1 rounded",
            execution.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            execution.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            execution.status === 'running' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}>
            {getStatusText()}
          </span>
          
          <ChevronRight className={cn(
            "h-4 w-4",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />
        </div>
      </div>
    </div>
  )
} 