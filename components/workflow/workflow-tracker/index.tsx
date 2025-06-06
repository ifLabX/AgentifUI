"use client"

import React, { useState } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { ExecutionBar } from './execution-bar'
import { WorkflowStatus } from './workflow-status'
import { ResultViewer } from './result-viewer'
import { Play, Clock, CheckCircle, XCircle, Square } from 'lucide-react'
// --- 集成真实的节点状态 ---
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store'
import { ExecutionControlPanel } from '../execution-control-panel'

interface WorkflowTrackerProps {
  isExecuting: boolean
  executionResult: any
  currentExecution: any
  onNodeUpdate: (event: any) => void
  onStop?: () => void
  onRetry?: () => void
  onReset?: () => void
}

/**
 * 工作流节点跟踪器组件
 * 
 * 功能特点：
 * - 实时显示工作流执行状态
 * - 细粒度节点进度跟踪
 * - 执行结果展示
 * - 支持 SSE 事件处理
 */
export function WorkflowTracker({ 
  isExecuting, 
  executionResult, 
  currentExecution, 
  onNodeUpdate,
  onStop,
  onRetry,
  onReset
}: WorkflowTrackerProps) {
  const { isDark } = useTheme()
  const [showResult, setShowResult] = useState(false)
  
  // --- 从store获取真实的节点状态 ---
  const nodes = useWorkflowExecutionStore(state => state.nodes)
  const currentNodeId = useWorkflowExecutionStore(state => state.currentNodeId)
  const progress = useWorkflowExecutionStore(state => state.executionProgress)
  const error = useWorkflowExecutionStore(state => state.error)
  const canRetry = useWorkflowExecutionStore(state => state.canRetry)
  
  const getOverallStatus = () => {
    if (isExecuting) return 'running'
    if (currentExecution?.status === 'completed') return 'completed'
    if (currentExecution?.status === 'failed') return 'failed'
    if (currentExecution?.status === 'stopped') return 'stopped'
    return 'idle'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-stone-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'stopped':
        return <Square className="h-5 w-5 text-stone-500" />
      default:
        return <Play className="h-5 w-5 text-stone-400" />
    }
  }
  
  const overallStatus = getOverallStatus()
  
  return (
    <div className="h-full flex flex-col">
      {/* --- 执行控制面板 --- */}
      {(onStop || onRetry || onReset) && (
        <ExecutionControlPanel
          isExecuting={isExecuting}
          progress={progress}
          error={error}
          canRetry={canRetry}
          currentExecution={currentExecution}
          onStop={onStop || (() => {})}
          onRetry={onRetry || (() => {})}
          onReset={onReset || (() => {})}
        />
      )}
      
      {/* --- 状态头部 --- */}
      <div className={cn(
        "px-6 py-4 border-b flex-shrink-0",
        isDark ? "border-stone-700" : "border-stone-200"
      )}>
        <WorkflowStatus 
          status={overallStatus}
          execution={currentExecution}
          onShowResult={() => setShowResult(true)}
        />
      </div>
      
      {/* --- 节点列表 --- */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!isExecuting && !currentExecution && nodes.length === 0 ? (
          // 空状态
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center mx-auto",
                isDark ? "border-stone-600" : "border-stone-300"
              )}>
                <Play className={cn(
                  "h-6 w-6",
                  isDark ? "text-stone-400" : "text-stone-500"
                )} />
              </div>
              <div className="space-y-2">
                <h3 className={cn(
                  "text-lg font-semibold font-serif",
                  isDark ? "text-stone-200" : "text-stone-800"
                )}>
                  等待执行
                </h3>
                <p className={cn(
                  "text-sm font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  填写左侧表单并点击执行按钮开始工作流
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 节点进度列表
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {getStatusIcon(overallStatus)}
              <h3 className={cn(
                "text-lg font-semibold font-serif",
                isDark ? "text-stone-200" : "text-stone-800"
              )}>
                执行进度
              </h3>
              {/* 显示总体进度 */}
              {isExecuting && (
                <span className={cn(
                  "text-sm font-serif ml-auto",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            
            {/* 如果没有真实节点数据，显示一个简单的占位 */}
            {nodes.length === 0 && (isExecuting || currentExecution) ? (
              <div className={cn(
                "p-4 rounded-lg border-2 border-dashed",
                isDark ? "border-stone-600 bg-stone-800/50" : "border-stone-300 bg-stone-50"
              )}>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <div>
                    <div className={cn(
                      "font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      工作流执行中
                    </div>
                    <div className={cn(
                      "text-sm font-serif",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )}>
                      等待接收节点状态...
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 显示真实的节点数据
              nodes.map((node, index) => (
                <ExecutionBar
                  key={node.id}
                  node={node}
                  index={index}
                  delay={index * 200} // 每个条延迟200ms出现
                />
              ))
            )}
          </div>
        )}
      </div>
      
      {/* --- 结果查看器 --- */}
      {showResult && executionResult && (
        <ResultViewer
          result={executionResult}
          execution={currentExecution}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  )
} 