import { create } from 'zustand';

interface WorkflowHistoryState {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  toggleHistory: () => void;
}

/**
 * Workflow history state management
 *
 * Used to synchronize the display state of history between NavBar and workflow pages
 */
export const useWorkflowHistoryStore = create<WorkflowHistoryState>(set => ({
  showHistory: false,
  setShowHistory: show => set({ showHistory: show }),
  toggleHistory: () => set(state => ({ showHistory: !state.showHistory })),
}));
