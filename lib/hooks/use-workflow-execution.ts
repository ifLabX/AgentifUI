import { useCallback, useEffect, useRef } from 'react'
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store'
import type { AppExecution, ExecutionStatus } from '@lib/types/database'
import type { DifyWorkflowRequestPayload } from '@lib/services/dify/types'
import { useProfile } from '@lib/hooks/use-profile'

/**
 * 工作流执行Hook - 万无一失的数据保存版本
 * 
 * 核心职责：
 * - 实现完整的工作流执行流程
 * - 确保所有Dify返回的数据都完整保存到数据库
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
   * 万无一失的数据保存函数
   * 确保所有Dify返回的字段都完整保存到数据库
   */
  const saveCompleteExecutionData = useCallback(async (
    executionId: string,
    finalResult: any,
    taskId: string | null,
    workflowRunId: string | null,
    nodeExecutionData: any[] = []
  ) => {
    console.log('[工作流执行] 开始万无一失的数据保存，executionId:', executionId)
    console.log('[工作流执行] finalResult:', JSON.stringify(finalResult, null, 2))
    console.log('[工作流执行] taskId:', taskId)
    console.log('[工作流执行] workflowRunId:', workflowRunId)
    console.log('[工作流执行] nodeExecutionData:', nodeExecutionData)
    
         try {
       const { updateCompleteExecutionData } = await import('@lib/db/app-executions')
      
      // 确定最终状态
      const finalStatus: ExecutionStatus = finalResult.status === 'succeeded' ? 'completed' : 'failed'
      const completedAt = new Date().toISOString()
      
      // --- 构建完整的metadata对象，包含所有可能的Dify数据 ---
      const completeMetadata = {
        // Dify原始响应数据
        dify_response: {
          workflow_id: finalResult.workflow_id || null,
          created_at: finalResult.created_at || null,
          finished_at: finalResult.finished_at || null,
          sequence_number: finalResult.sequence_number || null,
        },
        
        // 节点执行详情
        node_executions: nodeExecutionData.map(node => ({
          node_id: node.node_id,
          node_type: node.node_type || null,
          title: node.title || null,
          status: node.status,
          inputs: node.inputs || null,
          outputs: node.outputs || null,
          process_data: node.process_data || null,
          execution_metadata: node.execution_metadata || null,
          elapsed_time: node.elapsed_time || null,
          total_tokens: node.total_tokens || null,
          total_price: node.total_price || null,
          currency: node.currency || null,
          error: node.error || null,
          created_at: node.created_at || null,
          index: node.index || null,
          predecessor_node_id: node.predecessor_node_id || null
        })),
        
        // 执行环境信息
        execution_context: {
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          timestamp: new Date().toISOString(),
          instance_id: instanceId,
          execution_mode: 'streaming'
        },
        
        // 统计汇总
        statistics: {
          total_node_count: nodeExecutionData.length,
          successful_nodes: nodeExecutionData.filter(n => n.status === 'succeeded').length,
          failed_nodes: nodeExecutionData.filter(n => n.status === 'failed').length,
          total_node_tokens: nodeExecutionData.reduce((sum, n) => sum + (n.total_tokens || 0), 0),
          total_node_elapsed_time: nodeExecutionData.reduce((sum, n) => sum + (n.elapsed_time || 0), 0)
        }
      }
      
             console.log('[工作流执行] 准备保存的完整数据到数据库')
      
             // --- 执行数据库更新 ---
       const updateResult = await updateCompleteExecutionData(executionId, {
         status: finalStatus,
         external_execution_id: workflowRunId,
         task_id: taskId,
         outputs: finalResult.outputs,
         total_steps: finalResult.total_steps,
         total_tokens: finalResult.total_tokens,
         elapsed_time: finalResult.elapsed_time,
         error_message: finalResult.error,
         completed_at: completedAt,
         metadata: completeMetadata
       })
      
      if (updateResult.success) {
        console.log('[工作流执行] ✅ 数据库更新成功')
        
                 // 使用数据库返回的完整数据更新Store
         const completeExecution = updateResult.data
        
        // 更新Store状态
        getActions().updateCurrentExecution(completeExecution)
        getActions().addExecutionToHistory(completeExecution)
        
        return { success: true, data: completeExecution }
      } else {
        console.error('[工作流执行] ❌ 数据库更新失败:', updateResult.error)
        return { success: false, error: updateResult.error }
      }
      
    } catch (error) {
      console.error('[工作流执行] ❌ 保存完整数据时发生错误:', error)
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
    }
  }, [instanceId, getActions])

  /**
   * 核心执行流程：完整的工作流执行
   */
  const executeWorkflow = useCallback(async (formData: Record<string, any>) => {
    if (!userId) {
      getActions().setError('用户未登录，请先登录')
      return
    }
    
    console.log('[工作流执行] 开始执行流程，instanceId:', instanceId)
    
    // 用于收集节点执行数据
    const nodeExecutionData: any[] = []
    
    // 声明streamResponse变量以便在catch块中使用
    let streamResponse: any = null
    
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
        metadata: {
          execution_started_at: new Date().toISOString(),
          initial_form_data: formData
        }
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
      
      streamResponse = await streamDifyWorkflow(difyPayload, instanceId)
      
      console.log('[工作流执行] Dify流式响应启动成功')
      
      // --- 步骤6: 处理SSE事件流并收集所有数据 ---
      console.log('[工作流执行] 开始处理SSE事件流')
      
      // 处理进度事件并收集节点数据
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
          
          // 收集节点开始数据
          const existingNodeIndex = nodeExecutionData.findIndex(n => n.node_id === node_id)
          if (existingNodeIndex >= 0) {
            // 更新现有节点数据
            nodeExecutionData[existingNodeIndex] = {
              ...nodeExecutionData[existingNodeIndex],
              ...event.data,
              status: 'running'
            }
          } else {
            // 添加新节点数据
            nodeExecutionData.push({
              ...event.data,
              status: 'running'
            })
          }
          
        } else if (event.event === 'node_finished') {
          const { node_id, status, error } = event.data
          const success = status === 'succeeded'
          getActions().onNodeFinished(node_id, success, error)
          
          // 收集节点完成数据
          const existingNodeIndex = nodeExecutionData.findIndex(n => n.node_id === node_id)
          if (existingNodeIndex >= 0) {
            // 更新现有节点数据
            nodeExecutionData[existingNodeIndex] = {
              ...nodeExecutionData[existingNodeIndex],
              ...event.data
            }
          } else {
            // 添加新节点数据
            nodeExecutionData.push(event.data)
          }
        }
      }
      
      // --- 步骤7: 等待最终完成结果 ---
      const finalResult = await streamResponse.completionPromise
      
      console.log('[工作流执行] 工作流执行完成，最终结果:', JSON.stringify(finalResult, null, 2))
      
      // --- 步骤8: 获取最终的Dify标识符 ---
      const taskId = streamResponse.getTaskId()
      const workflowRunId = streamResponse.getWorkflowRunId()
      
      console.log('[工作流执行] 最终获取的标识符 - taskId:', taskId, 'workflowRunId:', workflowRunId)
      
      // --- 步骤9: 万无一失的完整数据保存 ---
      const saveResult = await saveCompleteExecutionData(
        dbExecution.id,
        finalResult,
        taskId,
        workflowRunId,
        nodeExecutionData
      )
      
      if (!saveResult.success) {
        throw new Error(`完整数据保存失败: ${saveResult.error?.message || '未知错误'}`)
      }
      
      // 完成执行
      getActions().stopExecution()
      getActions().unlockForm()
      
      console.log('[工作流执行] ✅ 执行流程完成，所有数据已完整保存')
      
    } catch (error) {
      console.error('[工作流执行] ❌ 执行失败:', error)
      
      // 错误处理：尝试保存错误状态和已收集的数据
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      getActions().setError(errorMessage, true)
      
      // 如果有当前执行记录，尝试保存错误状态和已收集的数据
      const current = useWorkflowExecutionStore.getState().currentExecution
      if (current?.id) {
        try {
          console.log('[工作流执行] 尝试保存错误状态和已收集的数据')
          
          // 获取可能的标识符（如果streamResponse存在的话）
          let taskId: string | null = null
          let workflowRunId: string | null = null
          
          try {
            // 尝试从可能存在的streamResponse获取标识符
            if (typeof streamResponse !== 'undefined' && streamResponse) {
              taskId = streamResponse.getTaskId() || null
              workflowRunId = streamResponse.getWorkflowRunId() || null
            }
          } catch (streamError) {
            console.warn('[工作流执行] 无法获取streamResponse标识符:', streamError)
          }
          
          // 构建错误状态的完整数据
          const errorMetadata = {
            error_details: {
              message: errorMessage,
              timestamp: new Date().toISOString(),
              collected_node_data: nodeExecutionData
            },
            execution_context: {
              user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
              instance_id: instanceId,
              execution_mode: 'streaming'
            }
          }
          
                     const { updateCompleteExecutionData } = await import('@lib/db/app-executions')
           await updateCompleteExecutionData(current.id, {
             status: 'failed',
             error_message: errorMessage,
             completed_at: new Date().toISOString(),
             external_execution_id: workflowRunId,
             task_id: taskId,
             metadata: errorMetadata
           })
          
          getActions().updateCurrentExecution({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
            external_execution_id: workflowRunId,
            task_id: taskId,
            metadata: errorMetadata
          })
          
          console.log('[工作流执行] ✅ 错误状态和数据已保存')
          
        } catch (updateError) {
          console.error('[工作流执行] ❌ 更新失败状态时出错:', updateError)
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
  }, [instanceId, userId, getActions, saveCompleteExecutionData])
  
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