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
 */
export function ExecutionHistory({ instanceId, onClose, isMobile }: ExecutionHistoryProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // --- 从Store获取执行历史 ---
  const executionHistory = useWorkflowExecutionStore(state => state.executionHistory)
  
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
      "h-full flex flex-col",
      colors.mainBackground.tailwind
    )}>
      {/* 头部 */}
      <div className={cn(
        "p-3 border-b flex-shrink-0",
        isDark ? "border-stone-700/50" : "border-stone-300/50"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className={cn(
              "h-4 w-4",
              isDark ? "text-stone-400" : "text-stone-600"
            )} />
            <h2 className={cn(
              "text-base font-semibold font-serif",
              colors.mainText.tailwind
            )}>
              执行历史
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-md transition-colors",
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
            "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5",
            isDark ? "text-stone-500" : "text-stone-400"
          )} />
          <input
            type="text"
            placeholder="搜索执行记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-8 pr-3 py-2 rounded-md border font-serif text-sm",
              "focus:outline-none focus:ring-1 focus:ring-stone-400/50 focus:border-transparent",
              isDark
                ? "border-stone-600/50 bg-stone-700/50 text-stone-100 placeholder-stone-500"
                : "border-stone-300/50 bg-stone-50/50 text-stone-900 placeholder-stone-400"
            )}
          />
        </div>
      </div>
      
      {/* 执行记录列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className={cn(
                "h-4 w-4 animate-spin",
                isDark ? "text-stone-500" : "text-stone-500"
              )} />
              <div className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-500" : "text-stone-500"
              )}>
                正在加载历史记录...
              </div>
            </div>
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="p-4 text-center">
            <div className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {searchTerm ? '没有找到匹配的记录' : '暂无执行记录'}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredExecutions.map((execution: AppExecution) => (
              <ExecutionItem
                key={execution.id}
                execution={execution}
                onClick={() => {
                  // TODO: 查看执行详情
                  console.log('查看执行详情:', execution)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 