import { useCallback, useEffect, useRef } from 'react'
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store'
import type { AppExecution, ExecutionStatus } from '@lib/types/database'
import type { DifyWorkflowRequestPayload } from '@lib/services/dify/types'
import { useProfile } from '@lib/hooks/use-profile'

/**
 * 工作流执行Hook - 简化版
 * 
 * 核心职责：
 * - 实现完整的9步工作流执行流程
 * - 协调Store、Service和数据库操作
 * - 提供错误处理和恢复机制
 * - 管理数据一致性
 */
export function useWorkflowExecution(instanceId: string) {
  const { profile } = useProfile()
  const userId = profile?.id
  
  // --- 安全地获取Store状态，避免频繁重渲染 ---
  const isExecuting = useWorkflowExecutionStore(state => state.isExecuting)
  const progress = useWorkflowExecutionStore(state => state.executionProgress)
  const error = useWorkflowExecutionStore(state => state.error)
  const canRetry = useWorkflowExecutionStore(state => state.canRetry)
  const nodes = useWorkflowExecutionStore(state => state.nodes)
  const currentNodeId = useWorkflowExecutionStore(state => state.currentNodeId)
  const currentExecution = useWorkflowExecutionStore(state => state.currentExecution)
  const executionHistory = useWorkflowExecutionStore(state => state.executionHistory)
  const formData = useWorkflowExecutionStore(state => state.formData)
  const formLocked = useWorkflowExecutionStore(state => state.formLocked)
  
  // --- 使用ref获取store actions，避免依赖问题 ---
  const getActions = useCallback(() => useWorkflowExecutionStore.getState(), [])
  
  // --- SSE连接引用 ---
  const sseConnectionRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  /**
   * 核心执行流程：9步完整工作流执行
   */
  const executeWorkflow = useCallback(async (formData: Record<string, any>) => {
    if (!userId) {
      getActions().setError('用户未登录，请先登录')
      return
    }
    
    console.log('[工作流执行] 开始执行流程，instanceId:', instanceId)
    
    try {
      // --- 步骤1: 设置初始执行状态 ---
      getActions().startExecution(formData)
      getActions().clearError()
      
      // --- 步骤1.5: 获取正确的应用UUID ---
      const { useAppListStore } = await import('@lib/stores/app-list-store')
      const appListState = useAppListStore.getState()
      
      // 如果应用列表为空，先获取应用列表
      if (appListState.apps.length === 0) {
        console.log('[工作流执行] 应用列表为空，先获取应用列表')
        await appListState.fetchApps()
      }
      
      // 查找对应的应用记录
      const currentApps = useAppListStore.getState().apps
      const targetApp = currentApps.find(app => app.instance_id === instanceId)
      
      if (!targetApp) {
        throw new Error(`未找到应用记录: ${instanceId}`)
      }
      
      console.log('[工作流执行] 找到应用记录，UUID:', targetApp.id, 'instance_id:', targetApp.instance_id)
      
      // --- 步骤2: 创建pending状态的数据库记录 ---
      const { createExecution } = await import('@lib/db/app-executions')
      
      const executionData: Omit<AppExecution, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        service_instance_id: targetApp.id, // 使用UUID主键
        execution_type: 'workflow',
        external_execution_id: null,
        task_id: null,
        title: `工作流执行 - ${new Date().toLocaleString()}`,
        inputs: formData,
        outputs: null,
        status: 'pending',
        error_message: null,
        total_steps: 0,
        total_tokens: 0,
        elapsed_time: null,
        completed_at: null,
        metadata: {}
      }
      
      const createResult = await createExecution(executionData)
      if (!createResult.success) {
        throw new Error(`数据库记录创建失败: ${createResult.error.message}`)
      }
      
      const dbExecution = createResult.data
      console.log('[工作流执行] 数据库记录创建成功，ID:', dbExecution.id)
      getActions().setCurrentExecution(dbExecution)
      
      // --- 步骤3: 更新状态为running ---
      const { updateExecutionStatus } = await import('@lib/db/app-executions')
      const updateRunningResult = await updateExecutionStatus(dbExecution.id, 'running')
      
      if (updateRunningResult.success) {
        getActions().updateCurrentExecution({ status: 'running' })
      }
      
      // --- 步骤4: 准备Dify API调用payload ---
      const difyPayload: DifyWorkflowRequestPayload = {
        inputs: formData,
        response_mode: 'streaming' as const,
        user: userId
      }
      
      console.log('[工作流执行] 准备调用Dify API，payload:', JSON.stringify(difyPayload, null, 2))
      
      // --- 步骤5: 调用Dify流式API ---
      const { streamDifyWorkflow } = await import('@lib/services/dify/workflow-service')
      
      // 创建中断控制器
      abortControllerRef.current = new AbortController()
      
      const streamResponse = await streamDifyWorkflow(difyPayload, instanceId)
      
      console.log('[工作流执行] Dify流式响应启动成功')
      
      // --- 步骤6: 获取并存储Dify标识符 ---
      const taskId = streamResponse.getTaskId()
      const workflowRunId = streamResponse.getWorkflowRunId()
      
      if (taskId) {
        getActions().setDifyTaskId(taskId)
      }
      
      if (workflowRunId) {
        getActions().setDifyWorkflowRunId(workflowRunId)
        
        // 更新数据库记录
        await updateExecutionStatus(dbExecution.id, 'running')
        getActions().updateCurrentExecution({
          external_execution_id: workflowRunId,
          task_id: taskId
        })
      }
      
      // --- 步骤7: 处理SSE事件流 ---
      console.log('[工作流执行] 开始处理SSE事件流')
      
      // 处理进度事件
      for await (const event of streamResponse.progressStream) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('[工作流执行] 执行被中断')
          break
        }
        
        if (event.event === 'node_started') {
          const { node_id, node_type, title } = event.data
          getActions().onNodeStarted(
            node_id, 
            title || node_type, 
            `正在执行${title || node_type}...`
          )
        } else if (event.event === 'node_finished') {
          const { node_id, status, error } = event.data
          const success = status === 'succeeded'
          getActions().onNodeFinished(node_id, success, error)
        }
      }
      
      // --- 步骤8: 等待最终完成结果 ---
      const finalResult = await streamResponse.completionPromise
      
      console.log('[工作流执行] 工作流执行完成')
      
      // --- 步骤9: 更新最终状态 ---
      const finalStatus: ExecutionStatus = finalResult.status === 'succeeded' ? 'completed' : 'failed'
      const completedAt = new Date().toISOString()
      
      // 更新数据库
      await updateExecutionStatus(
        dbExecution.id,
        finalStatus,
        finalResult.error || undefined,
        completedAt
      )
      
      const updatedExecution = {
        ...dbExecution,
        status: finalStatus,
        outputs: finalResult.outputs || null,
        total_steps: finalResult.total_steps || 0,
        total_tokens: finalResult.total_tokens || 0,
        elapsed_time: finalResult.elapsed_time || null,
        completed_at: completedAt,
        error_message: finalResult.error || null
      }
      
      getActions().updateCurrentExecution(updatedExecution)
      getActions().addExecutionToHistory(updatedExecution)
      
      // 完成执行
      getActions().stopExecution()
      getActions().unlockForm()
      
      console.log('[工作流执行] 执行流程完成')
      
    } catch (error) {
      console.error('[工作流执行] 执行失败:', error)
      
      // 错误处理：更新数据库和Store状态
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      getActions().setError(errorMessage, true)
      
      // 如果有当前执行记录，更新为失败状态
      const current = useWorkflowExecutionStore.getState().currentExecution
      if (current?.id) {
        try {
          const { updateExecutionStatus } = await import('@lib/db/app-executions')
          await updateExecutionStatus(
            current.id,
            'failed',
            errorMessage,
            new Date().toISOString()
          )
          
          getActions().updateCurrentExecution({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString()
          })
        } catch (updateError) {
          console.error('[工作流执行] 更新失败状态时出错:', updateError)
        }
      }
    } finally {
      // 清理资源
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close()
        sseConnectionRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current = null
      }
    }
  }, [instanceId, userId, getActions])
  
  /**
   * 停止工作流执行
   */
  const stopWorkflowExecution = useCallback(async () => {
    console.log('[工作流执行] 停止工作流执行')
    
    try {
      // 中断网络请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // 关闭SSE连接
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close()
        sseConnectionRef.current = null
      }
      
      // 获取当前状态
      const state = useWorkflowExecutionStore.getState()
      
      // 如果有Dify任务ID，尝试停止Dify工作流
      if (state.difyTaskId && userId) {
        try {
          const { stopDifyWorkflow } = await import('@lib/services/dify/workflow-service')
          await stopDifyWorkflow(instanceId, state.difyTaskId, userId)
          console.log('[工作流执行] Dify工作流已停止')
        } catch (stopError) {
          console.warn('[工作流执行] 停止Dify工作流失败:', stopError)
        }
      }
      
      // 更新Store状态
      getActions().stopExecution()
      
      // 更新数据库记录状态
      if (state.currentExecution?.id) {
        try {
          const { updateExecutionStatus } = await import('@lib/db/app-executions')
          await updateExecutionStatus(
            state.currentExecution.id,
            'stopped',
            '用户手动停止',
            new Date().toISOString()
          )
          
          getActions().updateCurrentExecution({
            status: 'stopped',
            error_message: '用户手动停止',
            completed_at: new Date().toISOString()
          })
        } catch (updateError) {
          console.error('[工作流执行] 更新停止状态时出错:', updateError)
        }
      }
      
    } catch (error) {
      console.error('[工作流执行] 停止执行时出错:', error)
      getActions().setError('停止执行失败')
    }
  }, [instanceId, userId, getActions])
  
  /**
   * 加载工作流历史记录
   */
  const loadWorkflowHistory = useCallback(async () => {
    if (!userId) return
    
    console.log('[工作流执行] 加载历史记录，instanceId:', instanceId)
    
    try {
      // --- 获取正确的应用UUID ---
      const { useAppListStore } = await import('@lib/stores/app-list-store')
      const appListState = useAppListStore.getState()
      
      // 如果应用列表为空，先获取应用列表
      if (appListState.apps.length === 0) {
        console.log('[工作流执行] 历史记录加载：应用列表为空，先获取应用列表')
        await appListState.fetchApps()
      }
      
      // 查找对应的应用记录
      const currentApps = useAppListStore.getState().apps
      const targetApp = currentApps.find(app => app.instance_id === instanceId)
      
      if (!targetApp) {
        console.warn('[工作流执行] 未找到对应的应用记录，instanceId:', instanceId)
        getActions().setExecutionHistory([])
        return
      }
      
      console.log('[工作流执行] 历史记录查询使用UUID:', targetApp.id)
      
      const { getExecutionsByServiceInstance } = await import('@lib/db/app-executions')
      const result = await getExecutionsByServiceInstance(targetApp.id, 20) // 使用UUID主键
      
      if (result.success) {
        console.log('[工作流执行] 历史记录加载成功，数量:', result.data.length)
        getActions().setExecutionHistory(result.data)
      } else {
        console.error('[工作流执行] 历史记录加载失败:', result.error)
      }
    } catch (error) {
      console.error('[工作流执行] 加载历史记录时出错:', error)
    }
  }, [instanceId, userId, getActions])
  
  /**
   * 重试执行
   */
  const retryExecution = useCallback(async () => {
    const state = useWorkflowExecutionStore.getState()
    if (state.formData && Object.keys(state.formData).length > 0) {
      console.log('[工作流执行] 重试执行')
      getActions().clearError()
      await executeWorkflow(state.formData)
    } else {
      console.warn('[工作流执行] 无法重试：没有表单数据')
      getActions().setError('无法重试：没有表单数据')
    }
  }, [executeWorkflow, getActions])
  
  /**
   * 重置执行状态
   */
  const resetExecution = useCallback(() => {
    console.log('[工作流执行] 重置执行状态')
    
    // 清理连接
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close()
      sseConnectionRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // 重置Store状态
    getActions().reset()
  }, [getActions])
  
  // --- 组件卸载时清理资源 ---
  useEffect(() => {
    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  // --- 初始化时加载历史记录 ---
  useEffect(() => {
    if (userId && instanceId) {
      loadWorkflowHistory()
    }
  }, [userId, instanceId, loadWorkflowHistory])
  
  return {
    // --- 状态 ---
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
    
    // --- 方法 ---
    executeWorkflow,
    stopWorkflowExecution,
    retryExecution,
    resetExecution,
    loadWorkflowHistory
  }
} 