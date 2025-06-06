import { create } from 'zustand'
import type { AppExecution } from '@lib/types/database'

/**
 * 工作流节点状态接口
 */
export interface WorkflowNode {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  description: string
  visible: boolean
  error?: string
}

/**
 * 工作流执行状态接口
 */
interface WorkflowExecutionState {
  // --- 执行状态 ---
  isExecuting: boolean
  executionProgress: number // 0-100
  
  // --- 节点跟踪 ---
  nodes: WorkflowNode[]
  currentNodeId: string | null
  
  // --- 表单管理 ---
  formData: Record<string, any>
  formLocked: boolean
  
  // --- 错误处理 ---
  error: string | null
  canRetry: boolean
  
  // --- 历史记录 ---
  executionHistory: AppExecution[]
  
  // --- Dify标识 ---
  difyTaskId: string | null
  difyWorkflowRunId: string | null
  
  // --- 当前执行记录 ---
  currentExecution: AppExecution | null
  
  // --- Actions ---
  startExecution: (formData: Record<string, any>) => void
  stopExecution: () => void
  setExecutionProgress: (progress: number) => void
  
  // --- 节点管理 ---
  addNode: (node: WorkflowNode) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onNodeStarted: (nodeId: string, title: string, description: string) => void
  onNodeFinished: (nodeId: string, success: boolean, error?: string) => void
  resetNodes: () => void
  
  // --- 表单管理 ---
  setFormData: (data: Record<string, any>) => void
  lockForm: () => void
  unlockForm: () => void
  resetFormData: () => void
  
  // --- 错误管理 ---
  setError: (error: string | null, canRetry?: boolean) => void
  clearError: () => void
  
  // --- 历史记录管理 ---
  setExecutionHistory: (history: AppExecution[]) => void
  addExecutionToHistory: (execution: AppExecution) => void
  
  // --- Dify标识管理 ---
  setDifyTaskId: (taskId: string | null) => void
  setDifyWorkflowRunId: (runId: string | null) => void
  
  // --- 当前执行记录管理 ---
  setCurrentExecution: (execution: AppExecution | null) => void
  updateCurrentExecution: (updates: Partial<AppExecution>) => void
  
  // --- 重置状态 ---
  reset: () => void
  clearAll: () => void // 完全清空所有状态，包括历史记录
  clearExecutionState: () => void // 仅清空执行相关状态，保留表单数据和历史记录
}

/**
 * 工作流执行状态管理Store
 * 
 * 核心职责：
 * - 管理工作流执行的完整生命周期状态
 * - 跟踪节点执行进度和状态变化
 * - 管理表单数据和锁定状态
 * - 处理错误和重试逻辑
 * - 维护执行历史记录
 * - 同步Dify API标识符
 * - 提供多种清空状态的方法
 */
export const useWorkflowExecutionStore = create<WorkflowExecutionState>((set, get) => ({
  // --- 初始状态 ---
  isExecuting: false,
  executionProgress: 0,
  nodes: [],
  currentNodeId: null,
  formData: {},
  formLocked: false,
  error: null,
  canRetry: false,
  executionHistory: [],
  difyTaskId: null,
  difyWorkflowRunId: null,
  currentExecution: null,
  
  // --- 执行控制 ---
  startExecution: (formData: Record<string, any>) => {
    console.log('[工作流Store] 开始执行，表单数据:', formData)
    set({
      isExecuting: true,
      executionProgress: 0,
      formData,
      formLocked: true,
      error: null,
      canRetry: false,
      nodes: [],
      currentNodeId: null,
      difyTaskId: null,
      difyWorkflowRunId: null
    })
  },
  
  stopExecution: () => {
    console.log('[工作流Store] 停止执行')
    set((state) => ({
      isExecuting: false,
      formLocked: false,
      currentNodeId: null,
      // 将所有运行中的节点标记为失败
      nodes: state.nodes.map(node => 
        node.status === 'running' 
          ? { ...node, status: 'failed', error: '执行已停止' }
          : node
      )
    }))
  },
  
  setExecutionProgress: (progress: number) => {
    set({ executionProgress: Math.max(0, Math.min(100, progress)) })
  },
  
  // --- 节点管理 ---
  addNode: (node: WorkflowNode) => {
    console.log('[工作流Store] 添加节点:', node)
    set((state) => ({
      nodes: [...state.nodes, node]
    }))
  },
  
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => {
    console.log('[工作流Store] 更新节点:', nodeId, updates)
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }))
  },
  
  onNodeStarted: (nodeId: string, title: string, description: string) => {
    console.log('[工作流Store] 节点开始:', nodeId, title)
    const now = Date.now()
    set((state) => {
      const existingNode = state.nodes.find(n => n.id === nodeId)
      if (existingNode) {
        // 更新现有节点
        return {
          currentNodeId: nodeId,
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, status: 'running', startTime: now, description, visible: true }
              : node
          )
        }
      } else {
        // 创建新节点
        const newNode: WorkflowNode = {
          id: nodeId,
          title,
          status: 'running',
          startTime: now,
          description,
          visible: true
        }
        return {
          currentNodeId: nodeId,
          nodes: [...state.nodes, newNode]
        }
      }
    })
  },
  
  onNodeFinished: (nodeId: string, success: boolean, error?: string) => {
    console.log('[工作流Store] 节点完成:', nodeId, success, error)
    const now = Date.now()
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              status: success ? 'completed' : 'failed',
              endTime: now,
              error: error || undefined,
              description: success 
                ? node.title + '完成' 
                : error || '执行失败'
            }
          : node
      ),
      currentNodeId: success ? null : state.currentNodeId
    }))
    
    // 计算执行进度
    const { nodes } = get()
    const completedNodes = nodes.filter(n => n.status === 'completed' || n.status === 'failed').length
    const progress = nodes.length > 0 ? (completedNodes / nodes.length) * 100 : 0
    set({ executionProgress: progress })
  },
  
  resetNodes: () => {
    console.log('[工作流Store] 重置节点')
    set({
      nodes: [],
      currentNodeId: null,
      executionProgress: 0
    })
  },
  
  // --- 表单管理 ---
  setFormData: (data: Record<string, any>) => {
    set({ formData: data })
  },
  
  lockForm: () => {
    set({ formLocked: true })
  },
  
  unlockForm: () => {
    set({ formLocked: false })
  },
  
  resetFormData: () => {
    console.log('[工作流Store] 重置表单数据')
    set({ 
      formData: {},
      formLocked: false
    })
  },
  
  // --- 错误管理 ---
  setError: (error: string | null, canRetry: boolean = false) => {
    console.log('[工作流Store] 设置错误:', error, '可重试:', canRetry)
    set({ 
      error, 
      canRetry,
      isExecuting: false,
      formLocked: false
    })
  },
  
  clearError: () => {
    set({ error: null, canRetry: false })
  },
  
  // --- 历史记录管理 ---
  setExecutionHistory: (history: AppExecution[]) => {
    set({ executionHistory: history })
  },
  
  addExecutionToHistory: (execution: AppExecution) => {
    console.log('[工作流Store] 添加执行记录到历史:', execution.id)
    set((state) => ({
      executionHistory: [execution, ...state.executionHistory]
    }))
  },
  
  // --- Dify标识管理 ---
  setDifyTaskId: (taskId: string | null) => {
    console.log('[工作流Store] 设置Dify任务ID:', taskId)
    set({ difyTaskId: taskId })
  },
  
  setDifyWorkflowRunId: (runId: string | null) => {
    console.log('[工作流Store] 设置Dify工作流运行ID:', runId)
    set({ difyWorkflowRunId: runId })
  },
  
  // --- 当前执行记录管理 ---
  setCurrentExecution: (execution: AppExecution | null) => {
    console.log('[工作流Store] 设置当前执行记录:', execution?.id)
    set({ currentExecution: execution })
  },
  
  updateCurrentExecution: (updates: Partial<AppExecution>) => {
    console.log('[工作流Store] 更新当前执行记录:', updates)
    set((state) => ({
      currentExecution: state.currentExecution
        ? { ...state.currentExecution, ...updates }
        : null
    }))
  },
  
  // --- 重置状态 ---
  reset: () => {
    console.log('[工作流Store] 重置所有状态（保留历史记录）')
    set({
      isExecuting: false,
      executionProgress: 0,
      nodes: [],
      currentNodeId: null,
      formData: {},
      formLocked: false,
      error: null,
      canRetry: false,
      difyTaskId: null,
      difyWorkflowRunId: null,
      currentExecution: null
      // 注意：不重置 executionHistory，保持历史记录
    })
  },
  
  clearAll: () => {
    console.log('[工作流Store] 完全清空所有状态')
    set({
      isExecuting: false,
      executionProgress: 0,
      nodes: [],
      currentNodeId: null,
      formData: {},
      formLocked: false,
      error: null,
      canRetry: false,
      executionHistory: [], // 清空历史记录
      difyTaskId: null,
      difyWorkflowRunId: null,
      currentExecution: null
    })
  },
  
  clearExecutionState: () => {
    console.log('[工作流Store] 清空执行状态（保留表单数据和历史记录）')
    set((state) => ({
      isExecuting: false,
      executionProgress: 0,
      nodes: [],
      currentNodeId: null,
      formLocked: false,
      error: null,
      canRetry: false,
      difyTaskId: null,
      difyWorkflowRunId: null,
      currentExecution: null
      // 保留：formData, executionHistory
    }))
  }
}))

// --- 选择器函数，用于优化组件重渲染 ---
export const workflowExecutionSelectors = {
  // 执行状态选择器
  executionStatus: (state: WorkflowExecutionState) => ({
    isExecuting: state.isExecuting,
    progress: state.executionProgress,
    error: state.error,
    canRetry: state.canRetry
  }),
  
  // 节点状态选择器  
  nodesStatus: (state: WorkflowExecutionState) => ({
    nodes: state.nodes,
    currentNodeId: state.currentNodeId
  }),
  
  // 表单状态选择器
  formStatus: (state: WorkflowExecutionState) => ({
    formData: state.formData,
    formLocked: state.formLocked
  }),
  
  // 当前执行选择器
  currentExecution: (state: WorkflowExecutionState) => state.currentExecution,
  
  // 历史记录选择器
  executionHistory: (state: WorkflowExecutionState) => state.executionHistory,
  
  // Dify标识选择器
  difyIds: (state: WorkflowExecutionState) => ({
    taskId: state.difyTaskId,
    workflowRunId: state.difyWorkflowRunId
  })
} 