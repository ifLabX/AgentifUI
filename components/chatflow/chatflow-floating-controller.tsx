"use client"

import React, { useState } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Workflow, X } from 'lucide-react'
import { useChatflowExecutionStore } from '@lib/stores/chatflow-execution-store'

interface ChatflowFloatingControllerProps {
  isVisible: boolean
  onToggleTracker: (show: boolean) => void
  onClose: () => void
  className?: string
}

/**
 * Chatflow 悬浮控制器组件
 * 
 * 功能：
 * - 悬浮球形式的控制器
 * - 点击切换节点跟踪器的显示/隐藏
 * - 简单的弹窗控制
 * - 临时UI，可以完全关闭
 */
export function ChatflowFloatingController({ 
  isVisible, 
  onToggleTracker, 
  onClose,
  className 
}: ChatflowFloatingControllerProps) {
  const { isDark } = useTheme()
  const [isTrackerVisible, setIsTrackerVisible] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  
  // 从 store 获取执行状态
  const nodes = useChatflowExecutionStore(state => state.nodes)
  const isExecuting = useChatflowExecutionStore(state => state.isExecuting)
  const error = useChatflowExecutionStore(state => state.error)
  
  // 如果不可见或者（没有节点且不在执行中），不显示
  if (!isVisible || (!isExecuting && nodes.length === 0)) {
    return null
  }
  
  const handleTogglePanel = () => {
    setShowPanel(!showPanel)
  }
  
  const handleToggleTracker = () => {
    const newState = !isTrackerVisible
    setIsTrackerVisible(newState)
    onToggleTracker(newState)
  }
  
  const getStatusColor = () => {
    if (error) return "text-red-500"
    if (isExecuting) return "text-yellow-500"
    return "text-green-500"
  }
  
  const getStatusIcon = () => {
    if (error) return "❌"
    if (isExecuting) return "⚡"
    return "✅"
  }
  
  return (
    <div className={cn(
      "fixed bottom-24 right-6 z-20",
      className
    )}>
      {/* 控制面板弹窗 */}
      {showPanel && (
        <div className={cn(
          "absolute bottom-14 right-0 w-64 p-4 rounded-lg shadow-xl border",
          "animate-in slide-in-from-bottom-2 fade-in-0 duration-200",
          isDark 
            ? "bg-stone-800 border-stone-700" 
            : "bg-white border-stone-200"
        )}>
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Workflow className={cn("h-4 w-4", getStatusColor())} />
              <span className={cn(
                "text-sm font-medium font-serif",
                isDark ? "text-stone-200" : "text-stone-800"
              )}>
                节点执行状态
              </span>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-1 rounded-md transition-colors duration-200",
                "hover:bg-red-100 dark:hover:bg-red-900/30",
                "text-stone-500 hover:text-red-600 dark:hover:text-red-400"
              )}
              title="关闭控制器"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          
          {/* 状态信息 */}
          <div className={cn(
            "text-sm font-serif mb-3",
            isDark ? "text-stone-300" : "text-stone-600"
          )}>
            {getStatusIcon()} {nodes.length}个节点 {isExecuting ? "执行中" : "已完成"}
          </div>
          
          {/* 控制按钮 */}
          <div className="space-y-2">
            <button
              onClick={handleToggleTracker}
              className={cn(
                "w-full px-3 py-2 rounded-md text-sm font-serif transition-colors duration-200",
                isTrackerVisible
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
              )}
            >
              {isTrackerVisible ? "隐藏节点跟踪器" : "显示节点跟踪器"}
            </button>
          </div>
          
          {/* 提示信息 */}
          <div className={cn(
            "text-xs font-serif mt-3 opacity-75",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            💡 临时显示，刷新页面后消失
          </div>
        </div>
      )}
      
      {/* 悬浮球 */}
      <button
        onClick={handleTogglePanel}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg transition-all duration-200",
          "flex items-center justify-center",
          "hover:shadow-xl hover:scale-105 active:scale-95",
          isDark 
            ? "bg-stone-800 border border-stone-700 text-stone-200 hover:bg-stone-700" 
            : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
        )}
        title="节点执行控制"
      >
        <Workflow className={cn("h-5 w-5", getStatusColor())} />
      </button>
    </div>
  )
} 