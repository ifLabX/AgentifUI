import { create } from 'zustand'

interface WorkflowHistoryState {
  showHistory: boolean
  setShowHistory: (show: boolean) => void
  toggleHistory: () => void
}

/**
 * 工作流历史记录状态管理
 * 
 * 用于在NavBar和工作流页面之间同步历史记录显示状态
 */
export const useWorkflowHistoryStore = create<WorkflowHistoryState>((set) => ({
  showHistory: false,
  setShowHistory: (show) => set({ showHistory: show }),
  toggleHistory: () => set((state) => ({ showHistory: !state.showHistory }))
})) 