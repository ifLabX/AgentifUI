"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Clock, CheckCircle, XCircle, Circle, Loader2 } from 'lucide-react'

interface NodeProgressProps {
  node: {
    id: string
    title: string
    status: string
    startTime: number | null
    endTime: number | null
  }
  index: number
  isLast: boolean
}

/**
 * 单个节点进度组件
 * 
 * 显示节点的执行状态、耗时等信息
 * 支持 fade-in 动画效果
 */
export function NodeProgress({ node, index, isLast }: NodeProgressProps) {
  const { isDark } = useTheme()
  
  const getStatusIcon = () => {
    switch (node.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-stone-400" />
    }
  }
  
  const getStatusColor = () => {
    switch (node.status) {
      case 'running':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      default:
        return isDark ? 'border-stone-600 bg-stone-700' : 'border-stone-200 bg-stone-50'
    }
  }
  
  const getElapsedTime = () => {
    if (!node.startTime) return null
    const endTime = node.endTime || Date.now()
    const elapsed = Math.round((endTime - node.startTime) / 1000 * 10) / 10
    return `${elapsed}s`
  }
  
  return (
    <div className={cn(
      "animate-in fade-in-0 slide-in-from-right-2 duration-300",
      `animation-delay-${index * 100}`
    )}>
      <div className="flex items-start gap-4">
        {/* 连接线和状态图标 */}
        <div className="flex flex-col items-center">
          {/* 状态图标 */}
          <div className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center",
            getStatusColor()
          )}>
            {getStatusIcon()}
          </div>
          
          {/* 连接线 */}
          {!isLast && (
            <div className={cn(
              "w-0.5 h-8 mt-2",
              isDark ? "bg-stone-600" : "bg-stone-200"
            )} />
          )}
        </div>
        
        {/* 节点信息 */}
        <div className="flex-1 pb-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              "font-medium font-serif",
              isDark ? "text-stone-200" : "text-stone-800"
            )}>
              {node.title}
            </h4>
            
            {getElapsedTime() && (
              <span className={cn(
                "text-xs font-serif px-2 py-1 rounded",
                isDark ? "bg-stone-700 text-stone-300" : "bg-stone-100 text-stone-600"
              )}>
                {getElapsedTime()}
              </span>
            )}
          </div>
          
          <p className={cn(
            "text-sm font-serif",
            node.status === 'running' ? "text-yellow-600 dark:text-yellow-400" :
            node.status === 'completed' ? "text-green-600 dark:text-green-400" :
            node.status === 'failed' ? "text-red-600 dark:text-red-400" :
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            {node.status === 'running' && '正在执行...'}
            {node.status === 'completed' && '执行完成'}
            {node.status === 'failed' && '执行失败'}
            {node.status === 'pending' && '等待执行'}
          </p>
        </div>
      </div>
    </div>
  )
} 