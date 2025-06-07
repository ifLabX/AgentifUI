"use client"

import React, { useState, useCallback, useRef } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useMobile } from '@lib/hooks/use-mobile'
import { cn } from '@lib/utils'
import { WorkflowInputForm, WorkflowInputFormRef } from '@components/workflow/workflow-input-form'
import { WorkflowTracker } from '@components/workflow/workflow-tracker'
import { ExecutionHistory } from '@components/workflow/execution-history'
import { MobileTabSwitcher } from '@components/workflow/mobile-tab-switcher'
import { useWorkflowHistoryStore } from '@lib/stores/workflow-history-store'
import { useTextGenerationExecution } from '@lib/hooks/use-text-generation-execution'
import { AlertCircle, RefreshCw, X, FileText } from 'lucide-react'

interface TextGenerationLayoutProps {
  instanceId: string
}

/**
 * 文本生成主布局组件
 * 
 * 布局特点：
 * - 桌面端：左右分栏布局（表单 + 跟踪器）
 * - 移动端：标签切换布局
 * - 可折叠的历史记录侧边栏
 * - 复用workflow的状态管理和数据流
 * - 适配文本生成的流式输出特点
 */
export function TextGenerationLayout({ instanceId }: TextGenerationLayoutProps) {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  
  // --- 文本生成执行系统 ---
  const {
    isExecuting,
    isStreaming,
    progress,
    error,
    canRetry,
    currentExecution,
    executionHistory,
    formData,
    formLocked,
    generatedText,
    executeTextGeneration,
    stopTextGeneration,
    retryTextGeneration,
    resetTextGeneration,
    loadTextGenerationHistory
  } = useTextGenerationExecution(instanceId)
  
  // --- 保留原有状态管理 ---
  const { showHistory, setShowHistory } = useWorkflowHistoryStore()
  
  // --- 表单重置引用 ---
  const formResetRef = useRef<WorkflowInputFormRef>(null)
  
  // --- 文本生成执行回调 ---
  const handleExecuteTextGeneration = useCallback(async (formData: Record<string, any>) => {
    console.log('[文本生成布局] 开始执行文本生成，输入数据:', formData)
    
    try {
      await executeTextGeneration(formData)
    } catch (error) {
      console.error('[文本生成布局] 执行失败:', error)
    }
  }, [executeTextGeneration])
  
  // --- 停止执行 ---
  const handleStopExecution = useCallback(async () => {
    console.log('[文本生成布局] 停止执行')
    try {
      await stopTextGeneration()
    } catch (error) {
      console.error('[文本生成布局] 停止执行失败:', error)
    }
  }, [stopTextGeneration])
  
  // --- 重试执行 ---
  const handleRetryExecution = useCallback(async () => {
    console.log('[文本生成布局] 重试执行')
    try {
      await retryTextGeneration()
    } catch (error) {
      console.error('[文本生成布局] 重试执行失败:', error)
    }
  }, [retryTextGeneration])
  
  // --- 完全重置（包括表单） ---
  const handleCompleteReset = useCallback(() => {
    console.log('[文本生成布局] 完全重置')
    
    // 重置执行状态
    resetTextGeneration()
    
    // 重置表单
    if (formResetRef.current?.resetForm) {
      formResetRef.current.resetForm()
    }
  }, [resetTextGeneration])
  
  // --- 清除错误 ---
  const handleClearError = useCallback(() => {
    console.log('[文本生成布局] 清除错误')
    // 这里可以添加清除错误的逻辑
  }, [])
  
  // --- 节点状态更新回调（文本生成不需要，但保持接口一致） ---
  const handleNodeUpdate = useCallback((event: any) => {
    console.log('[文本生成布局] 节点更新:', event)
  }, [])
  
  // --- 查看结果回调 ---
  const handleViewResult = useCallback((result: any, execution: any) => {
    console.log('[文本生成布局] 查看结果:', result, execution)
  }, [])
  
  // --- 错误提示组件 ---
  const ErrorBanner = ({ error, canRetry, onRetry, onDismiss }: {
    error: string
    canRetry: boolean
    onRetry: () => void
    onDismiss: () => void
  }) => (
    <div className={cn(
      "px-4 py-3 border-l-4 border-red-500 flex items-center gap-3",
      isDark ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-800"
    )}>
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-serif">{error}</p>
      </div>
      <div className="flex items-center gap-2">
        {canRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark
                ? "hover:bg-red-800/50 text-red-300 hover:text-red-200"
                : "hover:bg-red-200/50 text-red-700 hover:text-red-800"
            )}
            title="重试"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDismiss}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            isDark
              ? "hover:bg-red-800/50 text-red-300 hover:text-red-200"
              : "hover:bg-red-200/50 text-red-700 hover:text-red-800"
          )}
          title="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  // --- 移动端布局 ---
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-2.5rem)] flex flex-col">
        {/* 全局错误提示 */}
        {error && (
          <ErrorBanner
            error={error}
            canRetry={canRetry}
            onRetry={handleRetryExecution}
            onDismiss={handleClearError}
          />
        )}
        
        {/* 移动端标签切换器 - 暂时简化 */}
        <div className={cn(
          "flex border-b",
          isDark ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-white"
        )}>
          <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-serif border-b-2 border-stone-600">
            <FileText className="h-4 w-4" />
            <span>文本生成</span>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-4">
            <WorkflowInputForm
              ref={formResetRef}
              instanceId={instanceId}
              onExecute={handleExecuteTextGeneration}
              isExecuting={isExecuting}
            />
          </div>
        </div>
      </div>
    )
  }

  // --- 桌面端布局 ---
  return (
    <div className="h-[calc(100vh-2.5rem)] flex">
      {/* 全局错误提示 */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <ErrorBanner
            error={error}
            canRetry={canRetry}
            onRetry={handleRetryExecution}
            onDismiss={handleClearError}
          />
        </div>
      )}
      
      {/* 左侧：输入表单 */}
      <div className={cn(
        "flex-shrink-0 border-r overflow-hidden",
        isDark ? "border-stone-700 bg-stone-900/50" : "border-stone-200 bg-stone-50/50",
        showHistory ? "w-80" : "w-96"
      )}>
        <div className="h-full p-6">
          <WorkflowInputForm
            ref={formResetRef}
            instanceId={instanceId}
            onExecute={handleExecuteTextGeneration}
            isExecuting={isExecuting}
          />
        </div>
      </div>
      
      {/* 中间：工作流跟踪器（复用） */}
      <div className="flex-1 overflow-hidden">
        <WorkflowTracker
          isExecuting={isExecuting}
          executionResult={generatedText ? { generated_text: generatedText } : null}
          currentExecution={currentExecution}
          onNodeUpdate={handleNodeUpdate}
          onStop={handleStopExecution}
          onRetry={handleRetryExecution}
          onReset={handleCompleteReset}
        />
      </div>
      
      {/* 右侧：历史记录（可折叠） */}
      {showHistory && (
        <div className={cn(
          "flex-shrink-0 w-80 border-l overflow-hidden",
          isDark ? "border-stone-700 bg-stone-900/50" : "border-stone-200 bg-stone-50/50"
        )}>
          <ExecutionHistory
            instanceId={instanceId}
            onClose={() => setShowHistory(false)}
            isMobile={false}
            onViewResult={handleViewResult}
          />
        </div>
      )}
    </div>
  )
} 