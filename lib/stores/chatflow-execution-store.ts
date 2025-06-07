import { create } from 'zustand'

export interface ChatflowNode {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  description?: string
  type?: string
  visible?: boolean
}

interface ChatflowExecutionState {
  // 节点状态
  nodes: ChatflowNode[]
  currentNodeId: string | null
  isExecuting: boolean
  
  // 执行进度
  executionProgress: {
    current: number
    total: number
    percentage: number
  }
  
  // 错误状态
  error: string | null
  canRetry: boolean
  
  // Actions
  startExecution: () => void
  stopExecution: () => void
  resetExecution: () => void
  
  addNode: (node: ChatflowNode) => void
  updateNode: (nodeId: string, updates: Partial<ChatflowNode>) => void
  setCurrentNode: (nodeId: string | null) => void
  
  setError: (error: string | null) => void
  setCanRetry: (canRetry: boolean) => void
  
  // 从 SSE 事件更新状态
  handleNodeEvent: (event: any) => void
}

export const useChatflowExecutionStore = create<ChatflowExecutionState>((set, get) => ({
  // 初始状态
  nodes: [],
  currentNodeId: null,
  isExecuting: false,
  
  executionProgress: {
    current: 0,
    total: 0,
    percentage: 0
  },
  
  error: null,
  canRetry: false,
  
  // Actions
  startExecution: () => {
    console.log('[ChatflowExecution] 开始执行')
    set({
      isExecuting: true,
      error: null,
      canRetry: false,
      nodes: [],
      currentNodeId: null,
      executionProgress: { current: 0, total: 0, percentage: 0 }
    })
  },
  
  stopExecution: () => {
    const { nodes } = get()
    const updatedNodes = nodes.map(node => 
      node.status === 'running' 
        ? { ...node, status: 'failed' as const, endTime: Date.now() }
        : node
    )
    
    set({
      isExecuting: false,
      nodes: updatedNodes,
      currentNodeId: null,
      canRetry: true
    })
  },
  
  resetExecution: () => {
    set({
      nodes: [],
      currentNodeId: null,
      isExecuting: false,
      executionProgress: { current: 0, total: 0, percentage: 0 },
      error: null,
      canRetry: false
    })
  },
  
  addNode: (node: ChatflowNode) => {
    set(state => ({
      nodes: [...state.nodes, node]
    }))
  },
  
  updateNode: (nodeId: string, updates: Partial<ChatflowNode>) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }))
    
    // 更新进度
    const { nodes } = get()
    const completedNodes = nodes.filter(n => n.status === 'completed').length
    const totalNodes = nodes.length
    
    set({
      executionProgress: {
        current: completedNodes,
        total: totalNodes,
        percentage: totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0
      }
    })
  },
  
  setCurrentNode: (nodeId: string | null) => {
    set({ currentNodeId: nodeId })
  },
  
  setError: (error: string | null) => {
    set({ error, canRetry: !!error })
  },
  
  setCanRetry: (canRetry: boolean) => {
    set({ canRetry })
  },
  
  // 处理 SSE 事件
  handleNodeEvent: (event: any) => {
    const { nodes } = get()
    
    console.log('[ChatflowExecution] 🎯 收到节点事件:', event.event)
    console.log('[ChatflowExecution] 节点数据:', event.data)
    console.log('[ChatflowExecution] 当前节点数量:', nodes.length)
    
    switch (event.event) {
      case 'node_started':
        // 添加或更新节点为运行状态
        const { node_id, title, node_type } = event.data
        const nodeTitle = title || node_type || `节点 ${nodes.length + 1}`
        
        const existingNodeIndex = nodes.findIndex(n => n.id === node_id)
        
        if (existingNodeIndex >= 0) {
          // 更新现有节点
          get().updateNode(node_id, {
            status: 'running',
            startTime: Date.now(),
            description: '正在执行...',
            type: node_type
          })
        } else {
          // 添加新节点
          get().addNode({
            id: node_id,
            title: nodeTitle,
            status: 'running',
            startTime: Date.now(),
            description: '正在执行...',
            type: node_type,
            visible: true
          })
        }
        
        get().setCurrentNode(node_id)
        break
        
      case 'node_finished':
        // 更新节点为完成状态
        const { node_id: finishedNodeId, status, error } = event.data
        const nodeStatus = status === 'succeeded' ? 'completed' : 'failed'
        
        get().updateNode(finishedNodeId, {
          status: nodeStatus,
          endTime: Date.now(),
          description: nodeStatus === 'completed' ? '执行完成' : (error || '执行失败')
        })
        break
        
      case 'node_failed':
        // 更新节点为失败状态
        get().updateNode(event.data.node_id, {
          status: 'failed',
          endTime: Date.now(),
          description: event.data.error || '执行失败'
        })
        
        get().setError(event.data.error || '节点执行失败')
        break
        
      case 'workflow_started':
        get().startExecution()
        break
        
      case 'workflow_finished':
        set({ isExecuting: false, currentNodeId: null })
        break
        
      case 'workflow_interrupted':
        get().stopExecution()
        get().setError('工作流被中断')
        break
        
      default:
        console.log('[ChatflowExecution] 未知事件类型:', event.event)
        break
    }
  }
})) 