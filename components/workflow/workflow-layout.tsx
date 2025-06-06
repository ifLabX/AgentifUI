"use client"

import React, { useState, useCallback } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useMobile } from '@lib/hooks/use-mobile'
import { cn } from '@lib/utils'
import { WorkflowInputForm } from './workflow-input-form'
import { WorkflowTracker } from './workflow-tracker'
import { ExecutionHistory } from './execution-history'
import { HistoryButton } from '@components/workflow/history-button'
import { MobileTabSwitcher } from '@components/workflow/mobile-tab-switcher'

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
  
  // --- 状态管理 ---
  const [showHistory, setShowHistory] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [currentExecution, setCurrentExecution] = useState<any>(null)
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('form')
  
  // --- 执行工作流的回调函数 ---
  const handleExecuteWorkflow = useCallback(async (formData: Record<string, any>) => {
    console.log('[工作流执行] 开始执行，输入数据:', formData)
    
    try {
      setIsExecuting(true)
      setExecutionResult(null)
      setCurrentExecution(null)
      
      // TODO: 集成真实的 Dify API 调用
      // const { streamDifyWorkflow } = await import('@lib/services/dify/workflow-service')
      // const result = await streamDifyWorkflow(payload, instanceId, handleNodeUpdate)
      
      // 模拟执行过程
      console.log('[工作流执行] 模拟执行中...')
      
      // 创建执行记录
      const mockExecution = {
        id: `exec_${Date.now()}`,
        title: `工作流执行 - ${new Date().toLocaleString()}`,
        inputs: formData,
        status: 'running' as const,
        created_at: new Date().toISOString(),
        total_steps: 0,
        total_tokens: 0
      }
      
      setCurrentExecution(mockExecution)
      
      // 模拟完成
      setTimeout(() => {
        const completedExecution = {
          ...mockExecution,
          status: 'completed' as const,
          outputs: { result: '模拟执行结果' },
          total_steps: 3,
          total_tokens: 150,
          completed_at: new Date().toISOString()
        }
        
        setCurrentExecution(completedExecution)
        setExecutionResult(completedExecution.outputs)
        setIsExecuting(false)
        
        console.log('[工作流执行] 执行完成:', completedExecution)
      }, 3000)
      
    } catch (error) {
      console.error('[工作流执行] 执行失败:', error)
      setIsExecuting(false)
      
      // TODO: 错误处理
    }
  }, [instanceId])
  
  // --- 节点状态更新回调 ---
  const handleNodeUpdate = useCallback((event: any) => {
    console.log('[节点更新]', event)
    // TODO: 更新节点状态
  }, [])
  
  // --- 移动端布局 ---
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-3rem)] flex flex-col">
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
                executionResult={executionResult}
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
    <div className="h-[calc(100vh-3rem)] flex relative">
      {/* 左侧：输入表单 */}
      <div className={cn(
        "flex-1 min-w-0 border-r transition-all duration-300",
        isDark ? "border-stone-700" : "border-stone-200",
        showHistory ? "lg:w-1/3" : "lg:w-1/2"
      )}>
        <div className="h-full p-6 overflow-y-auto">
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
          executionResult={executionResult}
          currentExecution={currentExecution}
          onNodeUpdate={handleNodeUpdate}
        />
      </div>
      
      {/* 历史记录侧边栏 */}
      {showHistory && (
        <div className="w-1/3 min-w-80 border-l border-stone-200 dark:border-stone-700">
          <ExecutionHistory
            instanceId={instanceId}
            onClose={() => setShowHistory(false)}
            isMobile={false}
          />
        </div>
      )}
      
      {/* 历史记录按钮 */}
      <HistoryButton
        onClick={() => setShowHistory(!showHistory)}
        isActive={showHistory}
        className="fixed top-16 right-4 z-10"
      />
    </div>
  )
} 