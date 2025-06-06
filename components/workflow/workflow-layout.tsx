"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useMobile } from '@lib/hooks/use-mobile'
import { cn } from '@lib/utils'
import { WorkflowInputForm } from './workflow-input-form'
import { WorkflowTracker } from './workflow-tracker'
import { ExecutionHistory } from './execution-history'
import { HistoryButton } from '@components/workflow/history-button'
import { MobileTabSwitcher } from '@components/workflow/mobile-tab-switcher'
import { useWorkflowHistoryStore } from '@lib/stores/workflow-history-store'
import { useWorkflowExecution } from '@lib/hooks/use-workflow-execution'

interface WorkflowLayoutProps {
  instanceId: string
}

type MobileTab = 'form' | 'tracker' | 'history'

/**
 * 工作流主布局组件
 * 
 * 布局特点：
 * - 桌面端：左右分栏布局（表单 + 跟踪器）
 * - 移动端：标签切换布局
 * - 可折叠的历史记录侧边栏
 * - 统一的状态管理和数据流
 */
export function WorkflowLayout({ instanceId }: WorkflowLayoutProps) {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  
  // --- 新的工作流执行系统 ---
  const {
    isExecuting,
    progress,
    error,
    canRetry,
    nodes,
    currentNodeId,
    currentExecution,
    executionHistory,
    formData,
    formLocked,
    executeWorkflow,
    stopWorkflowExecution,
    retryExecution,
    resetExecution,
    loadWorkflowHistory
  } = useWorkflowExecution(instanceId)
  
  // --- 保留原有状态管理 ---
  const { showHistory, setShowHistory } = useWorkflowHistoryStore()
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('form')
  
  // --- 工作流执行回调，现在使用真实的hook ---
  const handleExecuteWorkflow = useCallback(async (formData: Record<string, any>) => {
    console.log('[工作流布局] 开始执行工作流，输入数据:', formData)
    
    try {
      await executeWorkflow(formData)
    } catch (error) {
      console.error('[工作流布局] 执行失败:', error)
    }
  }, [executeWorkflow])
  
  // --- 节点状态更新回调 ---
  const handleNodeUpdate = useCallback((event: any) => {
    console.log('[节点更新]', event)
    // 注意：节点状态现在通过hook自动管理，不需要手动更新
  }, [])
  
  // --- 移动端布局 ---
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-2.5rem)] flex flex-col">
        {/* 移动端标签切换器 */}
        <MobileTabSwitcher
          activeTab={mobileActiveTab}
          onTabChange={setMobileActiveTab}
          hasHistory={showHistory}
        />
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveTab === 'form' && (
            <div className="h-full p-4">
              <WorkflowInputForm
                instanceId={instanceId}
                onExecute={handleExecuteWorkflow}
                isExecuting={isExecuting}
              />
            </div>
          )}
          
          {mobileActiveTab === 'tracker' && (
            <div className="h-full">
              <WorkflowTracker
                isExecuting={isExecuting}
                executionResult={currentExecution?.outputs || null}
                currentExecution={currentExecution}
                onNodeUpdate={handleNodeUpdate}
              />
            </div>
          )}
          
          {mobileActiveTab === 'history' && (
            <div className="h-full">
              <ExecutionHistory
                instanceId={instanceId}
                onClose={() => setMobileActiveTab('form')}
                isMobile={true}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // --- 桌面端布局 ---
  return (
    <div className="h-[calc(100vh-2.5rem)] flex relative">
      {/* 左侧：输入表单 */}
      <div className={cn(
        "flex-1 min-w-0 border-r transition-all duration-300",
        isDark ? "border-stone-700" : "border-stone-200",
        showHistory ? "lg:w-1/3" : "lg:w-1/2"
      )}>
        <div className="h-full px-8 py-6 overflow-y-auto">
          <WorkflowInputForm
            instanceId={instanceId}
            onExecute={handleExecuteWorkflow}
            isExecuting={isExecuting}
          />
        </div>
      </div>
      
      {/* 右侧：节点跟踪器 */}
      <div className={cn(
        "flex-1 min-w-0 transition-all duration-300",
        showHistory ? "lg:w-1/3" : "lg:w-1/2"
      )}>
        <WorkflowTracker
          isExecuting={isExecuting}
          executionResult={currentExecution?.outputs || null}
          currentExecution={currentExecution}
          onNodeUpdate={handleNodeUpdate}
        />
      </div>
      
      {/* 历史记录侧边栏 */}
      {showHistory && (
        <div className="w-80 min-w-72 border-l border-stone-200 dark:border-stone-700">
          <ExecutionHistory
            instanceId={instanceId}
            onClose={() => setShowHistory(false)}
            isMobile={false}
          />
        </div>
      )}
      
             {/* 历史记录按钮已移至NavBar */}
    </div>
  )
} 