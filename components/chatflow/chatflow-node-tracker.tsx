"use client"

import React, { useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { ChatflowExecutionBar } from './chatflow-execution-bar'
import { useChatflowExecutionStore } from '@lib/stores/chatflow-execution-store'
import { Workflow, Loader2 } from 'lucide-react'

interface ChatflowNodeTrackerProps {
  isVisible: boolean
  className?: string
}

/**
 * Chatflow 节点跟踪器组件
 * 
 * 功能：
 * - 显示 chatflow 执行过程中的节点进度
 * - 实时更新节点状态
 * - fade-in 动画显示
 * - 临时UI，刷新后消失
 * - 不影响正常的流式响应
 */
export function ChatflowNodeTracker({ isVisible, className }: ChatflowNodeTrackerProps) {
  const { isDark } = useTheme()
  
  // 从 store 获取节点状态
  const nodes = useChatflowExecutionStore(state => state.nodes)
  const isExecuting = useChatflowExecutionStore(state => state.isExecuting)
  const executionProgress = useChatflowExecutionStore(state => state.executionProgress)
  const error = useChatflowExecutionStore(state => state.error)
  
  // 当组件不可见时，清理状态
  useEffect(() => {
    if (!isVisible) {
      // 延迟清理，给动画时间
      const timer = setTimeout(() => {
        useChatflowExecutionStore.getState().resetExecution()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible])
  
  // 如果不可见或者（没有节点且不在执行中），不显示
  if (!isVisible || (!isExecuting && nodes.length === 0)) {
    return null
  }
  
  return (
    <div className={cn(
      "transition-all duration-300 transform",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      className
    )}>
      <div className={cn(
        "rounded-lg border p-4 space-y-3",
        isDark 
          ? "bg-stone-800/50 border-stone-700/50 backdrop-blur-sm" 
          : "bg-white/80 border-stone-200 backdrop-blur-sm"
      )}>
        {/* 标题栏 */}
        <div className="flex items-center gap-2 pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
          <Workflow className={cn(
            "h-4 w-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )} />
          <span className={cn(
            "text-sm font-medium font-serif",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            节点执行进度
          </span>
          
          {/* 进度信息 */}
          {executionProgress.total > 0 && (
            <div className={cn(
              "ml-auto text-xs font-mono",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              {executionProgress.current}/{executionProgress.total}
              {executionProgress.percentage > 0 && (
                <span className="ml-1">
                  ({Math.round(executionProgress.percentage)}%)
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* 节点列表 */}
        <div className="space-y-2">
          {nodes.length === 0 && isExecuting ? (
            // 执行中但还没有节点数据
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed",
              isDark ? "border-stone-600 bg-stone-800/30" : "border-stone-300 bg-stone-50"
            )}>
              <Loader2 className={cn(
                "h-4 w-4 animate-spin",
                isDark ? "text-stone-400" : "text-stone-600"
              )} />
              <div>
                <div className={cn(
                  "text-sm font-medium font-serif",
                  isDark ? "text-stone-200" : "text-stone-800"
                )}>
                  正在启动 Chatflow
                </div>
                <div className={cn(
                  "text-xs font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  等待节点状态更新...
                </div>
              </div>
            </div>
          ) : (
            // 显示节点列表
            nodes.map((node, index) => (
              <ChatflowExecutionBar
                key={node.id}
                node={node}
                index={index}
                delay={index * 150} // 每个条延迟150ms出现
              />
            ))
          )}
        </div>
        
        {/* 错误信息 */}
        {error && (
          <div className={cn(
            "mt-3 p-3 rounded-lg border",
            isDark 
              ? "bg-red-900/20 border-red-700/50 text-red-200" 
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            <div className="text-sm font-serif">
              <strong>执行错误：</strong> {error}
            </div>
          </div>
        )}
        
        {/* 提示信息 */}
        <div className={cn(
          "text-xs font-serif opacity-75",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          💡 这是临时的执行进度显示，刷新页面后会消失
        </div>
      </div>
    </div>
  )
} 