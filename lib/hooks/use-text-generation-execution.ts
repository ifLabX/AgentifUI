import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store'
import type { AppExecution, ExecutionStatus } from '@lib/types/database'
import type { DifyCompletionRequestPayload } from '@lib/services/dify/types'
import { useProfile } from '@lib/hooks/use-profile'
import { useAutoAddFavoriteApp } from '@lib/stores/favorite-apps-store'

/**
 * 文本生成执行Hook - 复用workflow架构
 * 
 * 核心职责：
 * - 实现完整的文本生成执行流程
 * - 复用workflow的状态管理和数据保存机制
 * - 适配completion API的特点
 * - 提供流式文本生成支持
 */
export function useTextGenerationExecution(instanceId: string) {
  const { profile } = useProfile()
  const userId = profile?.id
  
  // --- 添加常用应用管理hook ---
  const { addToFavorites } = useAutoAddFavoriteApp()
  
  // --- 复用workflow的状态管理 ---
  const isExecuting = useWorkflowExecutionStore(state => state.isExecuting)
  const progress = useWorkflowExecutionStore(state => state.executionProgress)
  const error = useWorkflowExecutionStore(state => state.error)
  const canRetry = useWorkflowExecutionStore(state => state.canRetry)
  const currentExecution = useWorkflowExecutionStore(state => state.currentExecution)
  const executionHistory = useWorkflowExecutionStore(state => state.executionHistory)
  const formData = useWorkflowExecutionStore(state => state.formData)
  const formLocked = useWorkflowExecutionStore(state => state.formLocked)
  
  // --- 文本生成特有状态 ---
  const [generatedText, setGeneratedText] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  
  // --- 使用ref获取store actions ---
  const getActions = useCallback(() => useWorkflowExecutionStore.getState(), [])
  
  // --- 流式响应引用 ---
  const abortControllerRef = useRef<AbortController | null>(null)
  
  /**
   * 保存文本生成完整数据
   */
  const saveCompleteGenerationData = useCallback(async (
    executionId: string,
    finalResult: any,
    taskId: string | null,
    messageId: string | null,
    generatedText: string
  ) => {
    console.log('[文本生成] 开始保存完整数据，executionId:', executionId)
    
    try {
      const { updateCompleteExecutionData } = await import('@lib/db/app-executions')
      
      // 确定最终状态
      const finalStatus: ExecutionStatus = 'completed'
      const completedAt = new Date().toISOString()
      
      // --- 构建文本生成的metadata ---
      const completeMetadata = {
        // Dify原始响应数据
        dify_response: {
          message_id: messageId,
          created_at: finalResult.created_at || null,
          conversation_id: finalResult.conversation_id || null,
        },
        
        // 生成内容
        generation_data: {
          generated_text: generatedText,
          text_length: generatedText.length,
          word_count: generatedText.split(/\s+/).length,
        },
        
        // 执行环境信息
        execution_context: {
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          timestamp: new Date().toISOString(),
          instance_id: instanceId,
          execution_mode: 'streaming',
          api_type: 'completion'
        }
      }
      
      // --- 执行数据库更新 ---
      const updateResult = await updateCompleteExecutionData(executionId, {
        status: finalStatus,
        external_execution_id: messageId,
        task_id: taskId,
        outputs: { generated_text: generatedText },
        total_steps: 1, // 文本生成通常是单步
        total_tokens: finalResult.usage?.total_tokens || 0,
        elapsed_time: finalResult.elapsed_time || null,
        error_message: null,
        completed_at: completedAt,
        metadata: completeMetadata
      })
      
      if (updateResult.success) {
        console.log('[文本生成] ✅ 数据库更新成功')
        
        // 更新Store状态
        const completeExecution = updateResult.data
        getActions().updateCurrentExecution(completeExecution)
        getActions().addExecutionToHistory(completeExecution)
        
        return { success: true, data: completeExecution }
      } else {
        console.error('[文本生成] ❌ 数据库更新失败:', updateResult.error)
        return { success: false, error: updateResult.error }
      }
      
    } catch (error) {
      console.error('[文本生成] ❌ 保存完整数据时发生错误:', error)
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
    }
  }, [instanceId, getActions])

  /**
   * 核心执行流程：文本生成
   */
  const executeTextGeneration = useCallback(async (formData: Record<string, any>) => {
    if (!userId) {
      getActions().setError('用户未登录，请先登录')
      return
    }
    
    console.log('[文本生成] 开始执行流程，instanceId:', instanceId)
    
    let streamResponse: any = null
    
    try {
      // --- 步骤1: 设置初始执行状态 ---
      getActions().startExecution(formData)
      getActions().clearError()
      setGeneratedText('')
      setIsStreaming(true)
      
      // --- 步骤2: 获取应用信息 ---
      const { useAppListStore } = await import('@lib/stores/app-list-store')
      const appListState = useAppListStore.getState()
      
      if (appListState.apps.length === 0) {
        await appListState.fetchApps()
      }
      
      const currentApps = useAppListStore.getState().apps
      const targetApp = currentApps.find(app => app.instance_id === instanceId)
      
      if (!targetApp) {
        throw new Error(`未找到应用记录: ${instanceId}`)
      }
      
      // --- 步骤3: 创建数据库记录 ---
      const { createExecution } = await import('@lib/db/app-executions')
      
      const executionData: Omit<AppExecution, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        service_instance_id: targetApp.id,
        execution_type: 'text-generation',
        external_execution_id: null,
        task_id: null,
        title: `文本生成 - ${new Date().toLocaleString()}`,
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
      getActions().setCurrentExecution(dbExecution)
      
      // --- 步骤4: 更新状态为running ---
      const { updateExecutionStatus } = await import('@lib/db/app-executions')
      await updateExecutionStatus(dbExecution.id, 'running')
      getActions().updateCurrentExecution({ status: 'running' })
      
      // --- 步骤5: 准备Dify API调用 ---
      const difyPayload: DifyCompletionRequestPayload = {
        inputs: formData,
        response_mode: 'streaming' as const,
        user: userId
      }
      
      // --- 步骤6: 调用Dify流式API ---
      const { streamDifyCompletion } = await import('@lib/services/dify/completion-service')
      
      abortControllerRef.current = new AbortController()
      
             streamResponse = await streamDifyCompletion(targetApp.instance_id, difyPayload)
      
      let accumulatedText = ''
      let messageId: string | null = null
      let taskId: string | null = null
      
      // --- 步骤7: 处理流式响应 ---
      for await (const textChunk of streamResponse.answerStream) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('[文本生成] 检测到中断信号，停止处理')
          break
        }
        
        accumulatedText += textChunk
        setGeneratedText(accumulatedText)
        
        // 更新进度（基于文本长度估算）
        const estimatedProgress = Math.min(accumulatedText.length / 1000 * 100, 90)
        getActions().setExecutionProgress(estimatedProgress)
      }
      
      // --- 步骤8: 等待完成 ---
      const completionResult = await streamResponse.completionPromise
      messageId = streamResponse.getMessageId()
      taskId = streamResponse.getTaskId()
      
      // --- 步骤9: 保存完整数据 ---
      await saveCompleteGenerationData(
        dbExecution.id,
        completionResult,
        taskId,
        messageId,
        accumulatedText
      )
      
      // --- 步骤10: 更新最终状态 ---
      getActions().setExecutionProgress(100)
      setIsStreaming(false)
      
             // --- 自动添加到常用应用 ---
       addToFavorites(targetApp.instance_id)
      
      console.log('[文本生成] ✅ 执行完成')
      
    } catch (error) {
      console.error('[文本生成] ❌ 执行失败:', error)
      
      setIsStreaming(false)
      getActions().setError(
        error instanceof Error ? error.message : '文本生成失败',
        true // 允许重试
      )
      
      // 更新数据库状态为失败
      if (currentExecution?.id) {
        const { updateExecutionStatus } = await import('@lib/db/app-executions')
        await updateExecutionStatus(
          currentExecution.id, 
          'failed', 
          error instanceof Error ? error.message : '文本生成失败'
        )
      }
    } finally {
      // 清理资源
      abortControllerRef.current = null
    }
  }, [userId, instanceId, getActions, saveCompleteGenerationData, addToFavorites, currentExecution])

  /**
   * 停止文本生成
   */
  const stopTextGeneration = useCallback(async () => {
    console.log('[文本生成] 停止执行')
    
    try {
      // 中断流式响应
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // 如果有taskId，调用Dify停止API
      const taskId = getActions().difyTaskId
      if (taskId && currentExecution) {
        const { useAppListStore } = await import('@lib/stores/app-list-store')
        const apps = useAppListStore.getState().apps
        const targetApp = apps.find(app => app.instance_id === instanceId)
        
                 if (targetApp) {
           const { stopDifyCompletion } = await import('@lib/services/dify/completion-service')
           await stopDifyCompletion(targetApp.instance_id, taskId, userId!)
         }
      }
      
      // 更新状态
      getActions().stopExecution()
      setIsStreaming(false)
      
      // 更新数据库状态
      if (currentExecution?.id) {
        const { updateExecutionStatus } = await import('@lib/db/app-executions')
        await updateExecutionStatus(currentExecution.id, 'stopped')
      }
      
    } catch (error) {
      console.error('[文本生成] 停止执行失败:', error)
    }
  }, [instanceId, userId, currentExecution, getActions])

  /**
   * 重试文本生成
   */
  const retryTextGeneration = useCallback(async () => {
    console.log('[文本生成] 重试执行')
    
    if (formData) {
      getActions().clearError()
      await executeTextGeneration(formData)
    }
  }, [formData, executeTextGeneration, getActions])

  /**
   * 重置状态
   */
  const resetTextGeneration = useCallback(() => {
    console.log('[文本生成] 重置状态')
    getActions().reset()
    setGeneratedText('')
    setIsStreaming(false)
  }, [getActions])

  /**
   * 加载历史记录 - 与工作流保持一致的逻辑
   */
  const loadTextGenerationHistory = useCallback(async () => {
    if (!userId) return
    
    console.log('[文本生成] 加载历史记录，instanceId:', instanceId)
    
    try {
      // --- 获取正确的应用UUID ---
      const { useAppListStore } = await import('@lib/stores/app-list-store')
      const appListState = useAppListStore.getState()
      
      // 如果应用列表为空，先获取应用列表
      if (appListState.apps.length === 0) {
        console.log('[文本生成] 历史记录加载：应用列表为空，先获取应用列表')
        await appListState.fetchApps()
      }
      
      // 查找对应的应用记录
      const currentApps = useAppListStore.getState().apps
      const targetApp = currentApps.find(app => app.instance_id === instanceId)
      
      if (!targetApp) {
        console.warn('[文本生成] 未找到对应的应用记录，instanceId:', instanceId)
        getActions().setExecutionHistory([])
        return
      }
      
      console.log('[文本生成] 历史记录查询使用UUID:', targetApp.id)
      
      const { getExecutionsByServiceInstance } = await import('@lib/db/app-executions')
      const result = await getExecutionsByServiceInstance(targetApp.id, 20) // 使用UUID主键
      
      if (result.success) {
        console.log('[文本生成] 历史记录加载成功，数量:', result.data.length)
        getActions().setExecutionHistory(result.data)
      } else {
        console.error('[文本生成] 历史记录加载失败:', result.error)
      }
    } catch (error) {
      console.error('[文本生成] 加载历史记录时出错:', error)
    }
  }, [instanceId, userId, getActions])

  // --- 初始化时加载历史记录 ---
  useEffect(() => {
    loadTextGenerationHistory()
  }, [loadTextGenerationHistory])

  return {
    // 状态
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
    
    // 操作
    executeTextGeneration,
    stopTextGeneration,
    retryTextGeneration,
    resetTextGeneration,
    loadTextGenerationHistory
  }
} 