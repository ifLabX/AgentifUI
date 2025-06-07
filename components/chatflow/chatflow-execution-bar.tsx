"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { ChatflowNode } from '@lib/stores/chatflow-execution-store'

interface ChatflowExecutionBarProps {
  node: ChatflowNode
  index: number
  delay?: number
}

/**
 * Chatflow 执行条组件 - 显示节点执行信息的长条
 * 
 * 特点：
 * - fade-in 动画进入
 * - 左侧状态图标（spinner/完成/失败）
 * - 中间显示节点名称和状态描述
 * - 右侧显示执行时间
 * - 适配 chatflow 的视觉风格
 * - 临时UI，刷新后消失
 */
export function ChatflowExecutionBar({ node, index, delay = 0 }: ChatflowExecutionBarProps) {
  const { isDark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // --- 延迟显示动画 ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])
  
  // --- 计时器 ---
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
        return <Loader2 className={cn(
          "h-4 w-4 animate-spin",
          isDark ? "text-stone-400" : "text-stone-600"
        )} />
      case 'completed':
        return <CheckCircle className={cn(
          "h-4 w-4",
          isDark ? "text-stone-400" : "text-stone-600"
        )} />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className={cn(
          "h-4 w-4",
          isDark ? "text-stone-500" : "text-stone-400"
        )} />
      default:
        return <AlertCircle className={cn(
          "h-4 w-4",
          isDark ? "text-stone-500" : "text-stone-400"
        )} />
    }
  }
  
  const getStatusText = () => {
    switch (node.status) {
      case 'running':
        return node.description || '正在处理...'
      case 'completed':
        return '处理完成'
      case 'failed':
        return '处理失败'
      case 'pending':
        return '等待处理'
      default:
        return '未知状态'
    }
  }
  
  const getNodeTitle = () => {
    // 根据节点类型返回友好的中文名称
    switch (node.type) {
      case 'start':
        return '开始节点'
      case 'llm':
        return 'AI 推理'
      case 'knowledge-retrieval':
        return '知识检索'
      case 'question-classifier':
        return '问题分类'
      case 'if-else':
        return '条件判断'
      case 'code':
        return '代码执行'
      case 'template-transform':
        return '模板转换'
      case 'variable-assigner':
        return '变量赋值'
      case 'end':
        return '结束节点'
      default:
        return node.title || `节点 ${index + 1}`
    }
  }
  
  const getBarStyles = () => {
    const baseStyles = cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300",
      "transform font-serif",
      isVisible ? "animate-fade-in opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )
    
    switch (node.status) {
      case 'running':
        return cn(
          baseStyles,
          isDark
            ? "bg-stone-700/50 border-stone-600 shadow-lg shadow-stone-900/30"
            : "bg-stone-200/50 border-stone-300 shadow-lg shadow-stone-200/50"
        )
      case 'completed':
        return cn(
          baseStyles,
          isDark
            ? "bg-stone-600/30 border-stone-500"
            : "bg-stone-100 border-stone-300"
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
            ? "bg-stone-800/50 border-stone-700/50"
            : "bg-stone-50 border-stone-200"
        )
      default:
        return cn(
          baseStyles,
          isDark
            ? "bg-stone-800/50 border-stone-700/50"
            : "bg-stone-50 border-stone-200"
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
            "font-medium text-sm",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            {getNodeTitle()}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            node.status === 'running'
              ? isDark
                ? "bg-stone-600/40 text-stone-200"
                : "bg-stone-300/60 text-stone-700"
              : node.status === 'completed'
                ? isDark
                  ? "bg-stone-500/40 text-stone-100"
                  : "bg-stone-200 text-stone-800"
                : node.status === 'failed'
                  ? isDark
                    ? "bg-red-700/30 text-red-200"
                    : "bg-red-100 text-red-700"
                  : isDark
                    ? "bg-stone-700/50 text-stone-400"
                    : "bg-stone-200/80 text-stone-600"
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