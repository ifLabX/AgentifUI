"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Clock, CheckCircle, XCircle, Play, Eye } from 'lucide-react'

interface WorkflowStatusProps {
  status: string
  execution: any
  onShowResult: () => void
}

/**
 * 工作流整体状态组件
 * 
 * 显示工作流的整体执行状态和统计信息
 */
export function WorkflowStatus({ status, execution, onShowResult }: WorkflowStatusProps) {
  const { isDark } = useTheme()
  
  const getStatusInfo = () => {
    switch (status) {
      case 'running':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />,
          text: '执行中',
          color: 'text-yellow-600 dark:text-yellow-400'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          text: '执行完成',
          color: 'text-green-600 dark:text-green-400'
        }
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          text: '执行失败',
          color: 'text-red-600 dark:text-red-400'
        }
      default:
        return {
          icon: <Play className="h-5 w-5 text-stone-400" />,
          text: '等待执行',
          color: isDark ? 'text-stone-400' : 'text-stone-500'
        }
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className="space-y-4">
      {/* 状态标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {statusInfo.icon}
          <h2 className={cn(
            "text-lg font-semibold font-serif",
            statusInfo.color
          )}>
            {statusInfo.text}
          </h2>
        </div>
        
        {/* 查看结果按钮 */}
        {status === 'completed' && execution?.outputs && (
          <button
            onClick={onShowResult}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-serif transition-colors",
              isDark
                ? "bg-stone-700 hover:bg-stone-600 text-stone-200"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            )}
          >
            <Eye className="h-4 w-4" />
            查看结果
          </button>
        )}
      </div>
      
      {/* 执行统计 */}
      {execution && (
        <div className="grid grid-cols-3 gap-4">
          <div className={cn(
            "text-center p-3 rounded-lg",
            isDark ? "bg-stone-700" : "bg-stone-50"
          )}>
            <div className={cn(
              "text-lg font-semibold font-serif",
              isDark ? "text-stone-200" : "text-stone-800"
            )}>
              {execution.total_steps || 0}
            </div>
            <div className={cn(
              "text-xs font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              总步数
            </div>
          </div>
          
          <div className={cn(
            "text-center p-3 rounded-lg",
            isDark ? "bg-stone-700" : "bg-stone-50"
          )}>
            <div className={cn(
              "text-lg font-semibold font-serif",
              isDark ? "text-stone-200" : "text-stone-800"
            )}>
              {execution.total_tokens || 0}
            </div>
            <div className={cn(
              "text-xs font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              Token 数
            </div>
          </div>
          
          <div className={cn(
            "text-center p-3 rounded-lg",
            isDark ? "bg-stone-700" : "bg-stone-50"
          )}>
            <div className={cn(
              "text-lg font-semibold font-serif",
              isDark ? "text-stone-200" : "text-stone-800"
            )}>
              {execution.elapsed_time ? `${execution.elapsed_time}s` : '-'}
            </div>
            <div className={cn(
              "text-xs font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              耗时
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 