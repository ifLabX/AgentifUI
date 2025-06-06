"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Play, Square, RefreshCw, RotateCcw, Clock, CheckCircle, XCircle } from 'lucide-react'

interface ExecutionControlPanelProps {
  isExecuting: boolean
  progress: number
  error: string | null
  canRetry: boolean
  currentExecution: any
  onStop: () => void
  onRetry: () => void
  onReset: () => void
}

/**
 * 工作流执行控制面板
 * 
 * 功能特点：
 * - 显示执行状态和进度
 * - 提供停止、重试、重置操作
 * - 统一的视觉反馈
 */
export function ExecutionControlPanel({
  isExecuting,
  progress,
  error,
  canRetry,
  currentExecution,
  onStop,
  onRetry,
  onReset
}: ExecutionControlPanelProps) {
  const { isDark } = useTheme()
  
  const getStatusInfo = () => {
    if (isExecuting) {
      return {
        icon: <Clock className="h-5 w-5 animate-pulse" />,
        text: '执行中',
        color: 'text-yellow-500'
      }
    }
    
    if (error) {
      return {
        icon: <XCircle className="h-5 w-5" />,
        text: '执行失败',
        color: 'text-red-500'
      }
    }
    
    if (currentExecution?.status === 'completed') {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        text: '执行完成',
        color: 'text-green-500'
      }
    }
    
    if (currentExecution?.status === 'stopped') {
      return {
        icon: <Square className="h-5 w-5" />,
        text: '已停止',
        color: 'text-stone-500'
      }
    }
    
    return {
      icon: <Play className="h-5 w-5" />,
      text: '待执行',
      color: 'text-stone-400'
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className={cn(
      "px-4 py-3 border-b flex items-center justify-between",
      isDark ? "border-stone-700 bg-stone-800/50" : "border-stone-200 bg-stone-50/50"
    )}>
      {/* 状态显示 */}
      <div className="flex items-center gap-3">
        <div className={cn("flex items-center gap-2", statusInfo.color)}>
          {statusInfo.icon}
          <span className="text-sm font-semibold font-serif">
            {statusInfo.text}
          </span>
        </div>
        
        {/* 进度条 */}
        {isExecuting && (
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-24 h-2 rounded-full overflow-hidden",
              isDark ? "bg-stone-700" : "bg-stone-200"
            )}>
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
        
        {/* 执行时间 */}
        {currentExecution?.elapsed_time && (
          <span className={cn(
            "text-xs font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            耗时 {currentExecution.elapsed_time.toFixed(1)}s
          </span>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {isExecuting && (
          <button
            onClick={onStop}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-serif transition-colors",
              "flex items-center gap-1.5",
              isDark
                ? "bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-600/50"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            )}
          >
            <Square className="h-3.5 w-3.5" />
            停止
          </button>
        )}
        
        {error && canRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-serif transition-colors",
              "flex items-center gap-1.5",
              isDark
                ? "bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 border border-yellow-600/50"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
            )}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            重试
          </button>
        )}
        
        {(currentExecution || error) && !isExecuting && (
          <button
            onClick={onReset}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-serif transition-colors",
              "flex items-center gap-1.5",
              isDark
                ? "bg-stone-600/20 text-stone-300 hover:bg-stone-600/30 border border-stone-600/50"
                : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
        )}
      </div>
    </div>
  )
} 