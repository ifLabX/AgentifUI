"use client"

import { useCallback, useEffect } from "react"
import { useChatInterface } from "./use-chat-interface"
import { useChatflowExecutionStore } from "@lib/stores/chatflow-execution-store"

/**
 * Chatflow 接口 Hook
 * 
 * 功能特点：
 * - 扩展 useChatInterface 的功能
 * - 处理表单数据转换为聊天消息
 * - 保持与现有聊天逻辑的兼容性
 * - 支持表单数据的结构化处理
 * - 集成节点执行跟踪功能
 */
export function useChatflowInterface() {
  // 获取节点跟踪相关的方法
  const { startExecution, handleNodeEvent, resetExecution } = useChatflowExecutionStore()
  
  // 使用基础的聊天接口，传递节点事件处理器
  const chatInterface = useChatInterface(handleNodeEvent)
  
  /**
   * 处理 Chatflow 提交
   * 将查询和表单数据构建为正确的 chat-messages API payload
   */
  const handleChatflowSubmit = useCallback(async (
    query: string, 
    inputs: Record<string, any>, 
    files?: any[]
  ) => {
    console.log('[useChatflowInterface] 处理 Chatflow 提交', { query, inputs, files })
    
    try {
      // --- 步骤1: 启动节点跟踪 ---
      startExecution()
      
      // --- 步骤2: 构建用户消息内容 ---
      // 显示给用户看的消息内容，包含查询和表单数据摘要
      const userMessage = formatChatflowMessage(query, inputs)
      
      // --- 步骤3: 准备文件数据 ---
      const difyFiles = files ? formatFilesForDify(files) : undefined
      
      // --- 步骤4: 使用修改后的handleSubmit传递inputs ---
      // 现在handleSubmit支持第三个参数inputs
      await chatInterface.handleSubmit(userMessage, difyFiles, inputs)
      
      console.log('[useChatflowInterface] Chatflow 数据已成功发送')
      
    } catch (error) {
      console.error('[useChatflowInterface] Chatflow 提交失败:', error)
      // 发生错误时停止执行跟踪
      useChatflowExecutionStore.getState().setError(error instanceof Error ? error.message : '提交失败')
      throw error
    }
  }, [chatInterface, startExecution])

  // --- 监听 SSE 事件并更新节点状态 ---
  useEffect(() => {
    // 这里我们需要监听来自 useChatInterface 的 SSE 事件
    // 由于 useChatInterface 可能没有直接暴露 SSE 事件监听器，
    // 我们可能需要通过其他方式来获取节点状态更新
    
    // 临时方案：监听消息状态变化来推断节点状态
    const { isWaitingForResponse } = chatInterface
    
    // 当开始等待响应时，添加一个通用的处理节点
    if (isWaitingForResponse) {
      const executionStore = useChatflowExecutionStore.getState()
      
      // 如果还没有节点，添加一个默认的处理节点
      if (executionStore.nodes.length === 0) {
        executionStore.addNode({
          id: 'chatflow-processing',
          title: 'Chatflow 处理',
          status: 'running',
          startTime: Date.now(),
          description: '正在处理您的请求...',
          type: 'chatflow'
        })
      }
    } else {
      // 当响应完成时，更新节点状态
      const executionStore = useChatflowExecutionStore.getState()
      const processingNode = executionStore.nodes.find(n => n.id === 'chatflow-processing')
      
      if (processingNode && processingNode.status === 'running') {
        executionStore.updateNode('chatflow-processing', {
          status: 'completed',
          endTime: Date.now(),
          description: '处理完成'
        })
        
        // 延迟停止执行状态
        setTimeout(() => {
          executionStore.stopExecution()
        }, 1000)
      }
    }
  }, [chatInterface.isWaitingForResponse])

  // 返回扩展的接口
  return {
    ...chatInterface,
    handleChatflowSubmit,
    // 暴露节点跟踪相关的状态和方法
    nodeTracker: {
      nodes: useChatflowExecutionStore(state => state.nodes),
      isExecuting: useChatflowExecutionStore(state => state.isExecuting),
      executionProgress: useChatflowExecutionStore(state => state.executionProgress),
      error: useChatflowExecutionStore(state => state.error),
      resetExecution
    }
  }
}

/**
 * 格式化 Chatflow 消息内容
 */
function formatChatflowMessage(query: string, inputs: Record<string, any>): string {
  const messageParts: string[] = [query]
  
  // 如果有表单数据，添加摘要
  if (Object.keys(inputs).length > 0) {
    messageParts.push("")
    messageParts.push("📋 **附加信息：**")
    
    Object.entries(inputs).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return // 跳过空值
      }
      
      if (Array.isArray(value)) {
        if (value.length > 0) {
          if (value[0] && typeof value[0] === 'object' && value[0].name) {
            const fileNames = value.map(file => file.name).join(', ')
            messageParts.push(`• **${key}**: ${fileNames}`)
          } else {
            messageParts.push(`• **${key}**: ${value.join(', ')}`)
          }
        }
      } else if (typeof value === 'object') {
        if (value.name) {
          messageParts.push(`• **${key}**: ${value.name}`)
        } else {
          messageParts.push(`• **${key}**: ${JSON.stringify(value)}`)
        }
      } else {
        messageParts.push(`• **${key}**: ${value}`)
      }
    })
  }
  
  return messageParts.join('\n')
}

/**
 * 格式化文件为 Dify 格式
 */
function formatFilesForDify(files: any[]): any[] {
  return files.map(file => {
    if (file.upload_file_id) {
      return {
        type: file.type || 'document',
        transfer_method: 'local_file',
        upload_file_id: file.upload_file_id,
        name: file.name,
        size: file.size,
        mime_type: file.mime_type
      }
    }
    return file
  })
}

/**
 * 将表单数据格式化为用户友好的消息内容（保留用于兼容性）
 */
function formatFormDataToMessage(formData: Record<string, any>): string {
  const messageParts: string[] = []
  
  // 遍历表单数据，构建结构化消息
  Object.entries(formData).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return // 跳过空值
    }
    
    // 处理不同类型的值
    if (Array.isArray(value)) {
      // 文件数组或其他数组类型
      if (value.length > 0) {
        // 对于文件，我们只显示文件名，实际文件通过 files 参数传递
        if (value[0] && typeof value[0] === 'object' && value[0].name) {
          const fileNames = value.map(file => file.name).join(', ')
          messageParts.push(`**${key}**: ${fileNames}`)
        } else {
          messageParts.push(`**${key}**: ${value.join(', ')}`)
        }
      }
    } else if (typeof value === 'object') {
      // 对象类型（如文件对象）
      if (value.name) {
        messageParts.push(`**${key}**: ${value.name}`)
      } else {
        messageParts.push(`**${key}**: ${JSON.stringify(value)}`)
      }
    } else {
      // 基本类型
      messageParts.push(`**${key}**: ${value}`)
    }
  })
  
  // 如果没有有效数据，返回默认消息
  if (messageParts.length === 0) {
    return "开始对话"
  }
  
  // 构建最终消息
  const formattedMessage = [
    "我已填写了以下信息：",
    "",
    ...messageParts,
    "",
    "请基于这些信息为我提供帮助。"
  ].join('\n')
  
  return formattedMessage
}

/**
 * 从表单数据中提取文件
 */
function extractFilesFromFormData(formData: Record<string, any>): any[] {
  const files: any[] = []
  
  Object.values(formData).forEach(value => {
    if (Array.isArray(value)) {
      // 检查是否是文件数组
      value.forEach(item => {
        if (item && typeof item === 'object' && (item.file || item.name)) {
          files.push(item)
        }
      })
    } else if (value && typeof value === 'object' && (value.file || value.name)) {
      // 单个文件对象
      files.push(value)
    }
  })
  
  return files
}

/**
 * 检查表单数据是否包含文件
 */
export function hasFilesInFormData(formData: Record<string, any>): boolean {
  return extractFilesFromFormData(formData).length > 0
}

/**
 * 获取表单数据的摘要信息
 */
export function getFormDataSummary(formData: Record<string, any>): {
  fieldCount: number
  hasFiles: boolean
  nonEmptyFields: string[]
} {
  const nonEmptyFields: string[] = []
  let hasFiles = false
  
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      nonEmptyFields.push(key)
      
      // 检查是否包含文件
      if (Array.isArray(value)) {
        if (value.some(item => item && typeof item === 'object' && (item.file || item.name))) {
          hasFiles = true
        }
      } else if (value && typeof value === 'object' && (value.file || value.name)) {
        hasFiles = true
      }
    }
  })
  
  return {
    fieldCount: nonEmptyFields.length,
    hasFiles,
    nonEmptyFields
  }
} 