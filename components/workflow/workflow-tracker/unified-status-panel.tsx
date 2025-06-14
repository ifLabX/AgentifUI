"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Play, Square, RefreshCw, RotateCcw, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'

interface UnifiedStatusPanelProps {
  isExecuting: boolean
  progress: number
  error: string | null
  canRetry: boolean
  currentExecution: any
  onStop: () => void
  onRetry: () => void
  onReset: () => void
  onShowResult: () => void
  showResultButton?: boolean // 是否显示查看结果按钮，默认为true
}

/**
 * 统一的工作流状态面板
 * 
 * 合并了ExecutionControlPanel和WorkflowStatus的功能：
 * - 显示执行状态和进度
 * - 提供操作按钮（停止、重试、重置、查看结果）
 * - 显示执行时间和进度条
 * - 统一的视觉设计
 */
export function UnifiedStatusPanel({
  isExecuting,
  progress,
  error,
  canRetry,
  currentExecution,
  onStop,
  onRetry,
  onReset,
  onShowResult,
  showResultButton = true
}: UnifiedStatusPanelProps) {
  const { isDark } = useTheme()
  
  const getOverallStatus = () => {
    if (isExecuting) return 'running'
    if (currentExecution?.status === 'completed') return 'completed'
    if (currentExecution?.status === 'failed') return 'failed'
    if (currentExecution?.status === 'stopped') return 'stopped'
    return 'idle'
  }
  
  const getStatusInfo = () => {
    const status = getOverallStatus()
    
    switch (status) {
      case 'running':
        return {
          icon: <Clock className="h-5 w-5 animate-pulse" />,
          text: '工作流执行中',
          color: 'text-yellow-500'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          text: '执行完成',
          color: isDark ? 'text-stone-300' : 'text-stone-600'
        }
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5" />,
          text: '执行失败',
          color: 'text-red-500'
        }
      case 'stopped':
        return {
          icon: <Square className="h-5 w-5" />,
          text: '执行已停止',
          color: 'text-stone-500'
        }
      default:
        return {
          icon: <Play className="h-5 w-5" />,
          text: '等待执行',
          color: 'text-stone-400'
        }
    }
  }
  
  const statusInfo = getStatusInfo()
  const overallStatus = getOverallStatus()
  
  return (
    <div className={cn(
      "px-6 pt-2 pb-3 flex-shrink-0",
      // 去掉分割线和背景，融入页面
    )}>
      <div className="space-y-3">
        {/* 主状态行 - 只在有状态时显示 */}
        {(isExecuting || currentExecution || error) && (
          <div className="flex items-center justify-between">
            {/* 左侧：状态信息 */}
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center gap-2", statusInfo.color)}>
                {statusInfo.icon}
                <span className="text-base font-medium font-serif">
                  {statusInfo.text}
                </span>
              </div>
            </div>
          
            {/* 右侧：主要操作按钮 */}
            <div className="flex items-center gap-2">
            {/* 查看结果按钮 */}
            {showResultButton && overallStatus === 'completed' && currentExecution?.outputs && (
              <button
                onClick={onShowResult}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-serif transition-colors",
                  isDark
                    ? "bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
                )}
              >
                <Eye className="h-4 w-4" />
                查看结果
              </button>
            )}
            
            {/* 停止按钮 */}
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
            
            {/* 重试按钮 */}
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
            
            {/* 重置按钮 */}
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
        )}
        
        {/* 详细信息行 */}
        {(currentExecution?.elapsed_time || error) && (
          <div className="flex items-center gap-6">
          
          {/* 执行时间 */}
          {currentExecution?.elapsed_time && (
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-serif",
              isDark ? "bg-stone-700 text-stone-300" : "bg-stone-100 text-stone-700"
            )}>
              <Clock className="h-4 w-4" />
              <span>总耗时: {currentExecution.elapsed_time}s</span>
            </div>
          )}
          
          {/* 错误信息 */}
          {error && (
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-serif",
              isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"
            )}>
              <XCircle className="h-4 w-4" />
              <span className="truncate max-w-64">{error}</span>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
} 