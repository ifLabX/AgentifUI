"use client"

import React, { useState } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Workflow } from 'lucide-react'
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
 * - 点击直接切换节点跟踪器的显示/隐藏
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
  
  // 从 store 获取执行状态
  const nodes = useChatflowExecutionStore(state => state.nodes)
  const isExecuting = useChatflowExecutionStore(state => state.isExecuting)
  const error = useChatflowExecutionStore(state => state.error)
  
  // 只要isVisible为true就显示悬浮球，不管是否有节点执行
  if (!isVisible) {
    return null
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
  
  return (
    <div className={cn(
      "fixed bottom-24 right-6 z-20",
      className
    )}>
      {/* 悬浮球 - 点击直接切换节点跟踪器 */}
      <button
        onClick={handleToggleTracker}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg transition-all duration-200",
          "flex items-center justify-center",
          "hover:shadow-xl hover:scale-105 active:scale-95",
          isDark 
            ? "bg-stone-800 border border-stone-700 text-stone-200 hover:bg-stone-700" 
            : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
        )}
        title={isTrackerVisible ? "隐藏节点跟踪器" : "显示节点跟踪器"}
      >
        <Workflow className={cn("h-5 w-5", getStatusColor())} />
      </button>
    </div>
  )
} 