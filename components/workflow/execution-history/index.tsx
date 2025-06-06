"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { cn } from '@lib/utils'
import { ExecutionItem } from './execution-item'
import { X, History, Search, Loader2 } from 'lucide-react'
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store'
import type { AppExecution } from '@lib/types/database'

interface ExecutionHistoryProps {
  instanceId: string
  onClose: () => void
  isMobile: boolean
}

/**
 * 执行历史记录组件
 * 
 * 功能特点：
 * - 显示工作流执行历史
 * - 支持搜索
 * - 可查看历史执行结果
 * - 响应式设计
 * - 动态开门关门效果
 * - 独立滚动容器
 */
export function ExecutionHistory({ instanceId, onClose, isMobile }: ExecutionHistoryProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // --- 动画状态管理 ---
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  
  // --- 从Store获取执行历史 ---
  const executionHistory = useWorkflowExecutionStore(state => state.executionHistory)
  
  // --- 组件挂载时触发进入动画 ---
  useEffect(() => {
    // 延迟触发动画，确保DOM已渲染
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])
  
  // --- 处理关闭动画 ---
  const handleClose = () => {
    setIsClosing(true)
    setIsVisible(false)
    
    // 动画完成后执行实际关闭
    setTimeout(() => {
      onClose()
    }, 300) // 与CSS动画时长保持一致
  }
  
  // --- 自动刷新历史记录 ---
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        // 获取正确的应用UUID
        const { useAppListStore } = await import('@lib/stores/app-list-store')
        const currentApps = useAppListStore.getState().apps
        const targetApp = currentApps.find(app => app.instance_id === instanceId)
        
        if (!targetApp) {
          console.warn('[执行历史] 未找到对应的应用记录，instanceId:', instanceId)
          setIsLoading(false)
          return
        }
        
        const { getExecutionsByServiceInstance } = await import('@lib/db/app-executions')
        const result = await getExecutionsByServiceInstance(targetApp.id, 50) // 获取更多历史记录
        
        if (result.success) {
          console.log('[执行历史] 历史记录加载成功，数量:', result.data.length)
          useWorkflowExecutionStore.getState().setExecutionHistory(result.data)
        } else {
          console.error('[执行历史] 历史记录加载失败:', result.error)
        }
      } catch (error) {
        console.error('[执行历史] 加载历史记录时出错:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHistory()
  }, [instanceId])
  
  // 筛选执行记录（只保留搜索功能）
  const filteredExecutions = executionHistory.filter((execution: AppExecution) => {
    const matchesSearch = (execution.title || '工作流执行').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.stringify(execution.inputs || {}).toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  return (
    <div className={cn(
      "h-full flex flex-col relative overflow-hidden",
      colors.mainBackground.tailwind,
      // --- 动画效果 ---
      "transition-all duration-300 ease-in-out",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      isClosing && "translate-x-full opacity-0"
    )}>
      {/* --- 动态背景遮罩（开门效果） --- */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300 ease-in-out",
        isDark ? "bg-stone-900/95" : "bg-white/95",
        "backdrop-blur-sm",
        isVisible ? "opacity-100" : "opacity-0"
      )} />
      
      {/* --- 主要内容 --- */}
      <div className="relative z-10 h-full flex flex-col">
        {/* 头部 */}
        <div className={cn(
          "p-3 border-b flex-shrink-0",
          isDark ? "border-stone-700/50" : "border-stone-300/50",
          // --- 头部动画：从上方滑入 ---
          "transition-all duration-300 ease-out delay-100",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className={cn(
                "h-4 w-4 transition-transform duration-300",
                isDark ? "text-stone-400" : "text-stone-600",
                isVisible ? "rotate-0" : "rotate-180"
              )} />
              <h2 className={cn(
                "text-base font-semibold font-serif",
                colors.mainText.tailwind
              )}>
                执行历史
              </h2>
            </div>
            
            <button
              onClick={handleClose}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                "hover:scale-110 active:scale-95",
                isDark
                  ? "hover:bg-stone-700/50 text-stone-400 hover:text-stone-300"
                  : "hover:bg-stone-200/50 text-stone-600 hover:text-stone-700"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className={cn(
              "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 transition-all duration-300",
              isDark ? "text-stone-500" : "text-stone-400",
              isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )} />
            <input
              type="text"
              placeholder="搜索执行记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-8 pr-3 py-2 rounded-md border font-serif text-sm",
                "focus:outline-none focus:ring-1 focus:ring-stone-400/50 focus:border-transparent",
                "transition-all duration-300",
                isDark
                  ? "border-stone-600/50 bg-stone-700/50 text-stone-100 placeholder-stone-500"
                  : "border-stone-300/50 bg-stone-50/50 text-stone-900 placeholder-stone-400",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              )}
            />
          </div>
        </div>
        
        {/* --- 执行记录列表（独立滚动容器） --- */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          // --- 自定义滚动条样式 ---
          "scrollbar-thin",
          isDark 
            ? "scrollbar-track-stone-800 scrollbar-thumb-stone-600 hover:scrollbar-thumb-stone-500" 
            : "scrollbar-track-stone-100 scrollbar-thumb-stone-300 hover:scrollbar-thumb-stone-400",
          // --- 列表动画：从下方滑入 ---
          "transition-all duration-300 ease-out delay-200",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className={cn(
                  "h-4 w-4 animate-spin transition-all duration-300",
                  isDark ? "text-stone-500" : "text-stone-500",
                  isVisible ? "scale-100" : "scale-75"
                )} />
                <div className={cn(
                  "text-sm font-serif transition-all duration-300",
                  isDark ? "text-stone-500" : "text-stone-500",
                  isVisible ? "opacity-100" : "opacity-0"
                )}>
                  正在加载历史记录...
                </div>
              </div>
            </div>
          ) : filteredExecutions.length === 0 ? (
            <div className="p-4 text-center">
              <div className={cn(
                "text-sm font-serif transition-all duration-300",
                isDark ? "text-stone-500" : "text-stone-500",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              )}>
                {searchTerm ? '没有找到匹配的记录' : '暂无执行记录'}
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredExecutions.map((execution: AppExecution, index) => (
                <div
                  key={execution.id}
                  className={cn(
                    "transition-all duration-300 ease-out",
                    isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                  )}
                  style={{
                    transitionDelay: `${300 + index * 50}ms` // 每个项目延迟50ms出现
                  }}
                >
                  <ExecutionItem
                    execution={execution}
                    onClick={() => {
                      // TODO: 查看执行详情
                      console.log('查看执行详情:', execution)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 