"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ExecutionBarProps {
  node: {
    id: string
    title: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    startTime?: number
    endTime?: number
    description?: string
  }
  index: number
  delay?: number
}

/**
 * 执行条组件 - slim长方条显示节点执行信息
 * 
 * 特点：
 * - fade-in动画进入
 * - 左侧spinner/状态图标
 * - 中间显示当前操作描述
 * - 右侧显示计时信息
 * - 现代化设计，统一stone色系
 */
export function ExecutionBar({ node, index, delay = 0 }: ExecutionBarProps) {
  const { isDark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // 延迟显示动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])
  
  // 计时器
  useEffect(() => {
    if (node.status === 'running' && node.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - node.startTime!)
      }, 100)
      
      return () => clearInterval(interval)
    } else if (node.status === 'completed' && node.startTime && node.endTime) {
      setElapsedTime(node.endTime - node.startTime)
    }
  }, [node.status, node.startTime, node.endTime])
  
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }
  
  const getStatusIcon = () => {
    switch (node.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-stone-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-stone-400" />
    }
  }
  
  const getStatusText = () => {
    switch (node.status) {
      case 'running':
        return node.description || '正在执行...'
      case 'completed':
        return '执行完成'
      case 'failed':
        return '执行失败'
      case 'pending':
        return '等待执行'
      default:
        return '未知状态'
    }
  }
  
  const getBarStyles = () => {
    const baseStyles = cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300",
      "transform",
      isVisible ? "animate-fade-in opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )
    
    switch (node.status) {
      case 'running':
        return cn(
          baseStyles,
          isDark
            ? "bg-blue-900/20 border-blue-700/50 shadow-lg shadow-blue-900/20"
            : "bg-blue-50 border-blue-200 shadow-lg shadow-blue-100/50"
        )
      case 'completed':
        return cn(
          baseStyles,
          isDark
            ? "bg-green-900/20 border-green-700/50"
            : "bg-green-50 border-green-200"
        )
      case 'failed':
        return cn(
          baseStyles,
          isDark
            ? "bg-red-900/20 border-red-700/50"
            : "bg-red-50 border-red-200"
        )
      case 'pending':
        return cn(
          baseStyles,
          isDark
            ? "bg-stone-800 border-stone-700"
            : "bg-stone-100 border-stone-200"
        )
      default:
        return cn(
          baseStyles,
          isDark
            ? "bg-stone-800 border-stone-700"
            : "bg-stone-100 border-stone-200"
        )
    }
  }
  
  return (
    <div className={getBarStyles()}>
      {/* 左侧：状态图标 */}
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      
      {/* 中间：节点信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium font-serif text-sm",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            {node.title}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-serif",
            node.status === 'running'
              ? isDark
                ? "bg-blue-700/30 text-blue-300"
                : "bg-blue-100 text-blue-700"
              : node.status === 'completed'
                ? isDark
                  ? "bg-green-700/30 text-green-300"
                  : "bg-green-100 text-green-700"
                : node.status === 'failed'
                  ? isDark
                    ? "bg-red-700/30 text-red-300"
                    : "bg-red-100 text-red-700"
                  : isDark
                    ? "bg-stone-700 text-stone-400"
                    : "bg-stone-200 text-stone-600"
          )}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      {/* 右侧：计时信息 */}
      <div className="flex-shrink-0">
        {(node.status === 'running' || node.status === 'completed') && elapsedTime > 0 && (
          <div className={cn(
            "text-xs font-mono",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            {formatTime(elapsedTime)}
          </div>
        )}
      </div>
    </div>
  )
} 