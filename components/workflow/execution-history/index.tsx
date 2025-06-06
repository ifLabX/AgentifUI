"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { cn } from '@lib/utils'
import { ExecutionItem } from './execution-item'
import { X, History, Search, Loader2, Trash2, Check } from 'lucide-react'
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
  const { colors, isDark } = useThemeColors()
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('') // 保留但不使用
  
  // --- 多选删除相关状态 ---
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  
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
  
  // 直接使用所有执行记录，无需筛选
  const displayExecutions = executionHistory
  
  // --- 批量删除处理 ---
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    
    setIsDeleting(true)
    try {
      // TODO: 实现批量删除逻辑
      console.log('批量删除执行记录:', Array.from(selectedIds))
      
      // 暂时模拟删除操作
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 清空选中状态
      setSelectedIds(new Set())
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error('批量删除失败:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  // --- 点击查看执行详情 ---
  const handleViewExecution = async (execution: AppExecution) => {
    if (isMultiSelectMode) {
      // 多选模式下切换选中状态
      const newSelectedIds = new Set(selectedIds)
      if (newSelectedIds.has(execution.id)) {
        newSelectedIds.delete(execution.id)
      } else {
        newSelectedIds.add(execution.id)
      }
      setSelectedIds(newSelectedIds)
    } else {
      // 正常模式下查看执行详情
      try {
        // TODO: 从数据库获取完整的执行结果
        console.log('查看执行详情:', execution)
        
        // 暂时使用现有的结果查看器
        // 这里需要打开 ResultViewer 模态框
      } catch (error) {
        console.error('获取执行详情失败:', error)
      }
    }
  }
  
  return (
    <div className={cn(
      "h-full flex flex-col relative overflow-hidden",
      colors.mainBackground.tailwind,
      // --- 动画效果 ---
      "transition-all duration-300 ease-in-out",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      isClosing && "translate-x-full opacity-0"
    )}>
      {/* --- 主要内容：使用 absolute 定位填满容器 --- */}
      <div className="absolute inset-0 flex flex-col z-10">
        {/* 头部 */}
        <div className={cn(
          "p-3 border-b flex-shrink-0",
          isDark ? "border-stone-700/50" : "border-stone-300/50",
          // --- 头部动画：从上方滑入 ---
          "transition-all duration-300 ease-out delay-100",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}>
          <div className="flex items-center justify-between">
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
              {/* 选中计数 */}
              {isMultiSelectMode && selectedIds.size > 0 && (
                <span className={cn(
                  "text-sm font-serif px-2 py-1 rounded-md",
                  isDark ? "bg-stone-700 text-stone-300" : "bg-stone-100 text-stone-600"
                )}>
                  已选 {selectedIds.size} 项
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* 多选模式按钮 */}
              {!isMultiSelectMode ? (
                <button
                  onClick={() => setIsMultiSelectMode(true)}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    "hover:scale-110 active:scale-95",
                    isDark
                      ? "hover:bg-stone-700/50 text-stone-400 hover:text-stone-300"
                      : "hover:bg-stone-200/50 text-stone-600 hover:text-stone-700"
                  )}
                  title="批量删除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <>
                  {/* 批量删除执行按钮 */}
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedIds.size === 0 || isDeleting}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      "hover:scale-110 active:scale-95",
                      selectedIds.size === 0 || isDeleting
                        ? "opacity-50 cursor-not-allowed"
                        : isDark
                          ? "hover:bg-red-700/50 text-red-400 hover:text-red-300"
                          : "hover:bg-red-100/50 text-red-600 hover:text-red-700"
                    )}
                    title={`删除选中的 ${selectedIds.size} 项`}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                  
                  {/* 取消多选模式 */}
                  <button
                    onClick={() => {
                      setIsMultiSelectMode(false)
                      setSelectedIds(new Set())
                    }}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      "hover:scale-110 active:scale-95",
                      isDark
                        ? "hover:bg-stone-700/50 text-stone-400 hover:text-stone-300"
                        : "hover:bg-stone-200/50 text-stone-600 hover:text-stone-700"
                    )}
                    title="取消选择"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              
              {/* 关闭按钮 */}
              {!isMultiSelectMode && (
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
              )}
            </div>
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
          ) : displayExecutions.length === 0 ? (
            <div className="p-4 text-center">
              <div className={cn(
                "text-sm font-serif transition-all duration-300",
                isDark ? "text-stone-500" : "text-stone-500",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              )}>
                暂无执行记录
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {displayExecutions.map((execution: AppExecution, index) => (
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
                    onClick={() => handleViewExecution(execution)}
                    isMultiSelectMode={isMultiSelectMode}
                    isSelected={selectedIds.has(execution.id)}
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