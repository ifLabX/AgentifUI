import { create } from 'zustand';

// --- BEGIN COMMENT ---
// 定义待处理会话的状态和结构
// --- END COMMENT ---
export interface PendingConversation {
  tempId: string; // 客户端生成的临时 ID
  realId?: string; // 从后端获取的真实对话 ID
  status: 'untitled' | 'resolved' | 'failed'; // 'untitled': 标题未知或加载中, 'resolved': 标题已获取, 'failed': 获取失败
  title: string; // "加载中...", "新对话...", "Untitled", 或真实标题
}

// --- BEGIN COMMENT ---
// 定义 Store 的 State 接口
// --- END COMMENT ---
interface PendingConversationState {
  // --- BEGIN COMMENT ---
  // 使用 Map 存储待处理会话，以便通过 tempId 或 realId 高效查找和更新
  // Key 可以是 tempId，value 是 PendingConversation 对象
  // --- END COMMENT ---
  pendingConversations: Map<string, PendingConversation>;

  // --- BEGIN COMMENT ---
  // Actions
  // --- END COMMENT ---
  addPending: (tempId: string, initialTitle?: string) => void;
  setRealId: (tempId: string, realId: string) => void; // 仅设置 realId，状态通常保持 'untitled'
  updateTitleAndStatus: (id: string, title: string, status: PendingConversation['status']) => void; // id 可以是 tempId 或 realId
  updateStatus: (id: string, status: PendingConversation['status']) => void; // id 可以是 tempId 或 realId. 主要用于设置为 'failed' 或特殊情况
  removePending: (id: string) => void; // id 可以是 tempId 或 realId
  
  // --- BEGIN COMMENT ---
  // Selectors / Getters (可选，但推荐，以便在 store 外部安全地访问状态)
  // --- END COMMENT ---
  getPendingByTempId: (tempId: string) => PendingConversation | undefined;
  getPendingByRealId: (realId: string) => PendingConversation | undefined;
}

// --- BEGIN COMMENT ---
// 创建 Zustand Store
// --- END COMMENT ---
export const usePendingConversationStore = create<PendingConversationState>((set, get) => ({
  pendingConversations: new Map(),

  addPending: (tempId, initialTitle = "加载中...") => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      if (newMap.has(tempId)) {
        console.warn(`[PendingConversationStore] Attempted to add existing tempId: ${tempId}`);
        return state; 
      }
      newMap.set(tempId, {
        tempId,
        status: 'untitled', // 初始状态为 'untitled'
        title: initialTitle,
      });
      return { pendingConversations: newMap };
    });
  },

  setRealId: (tempId: string, realId: string) => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      const entry = newMap.get(tempId);
      if (entry) {
        newMap.set(tempId, { ...entry, realId }); // 状态保持不变，通常是 'untitled'
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] tempId not found for setRealId: ${tempId}`);
      return state;
    });
  },

  updateTitleAndStatus: (id: string, title: string, status: PendingConversation['status']) => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      let entryKey: string | undefined = id;
      let entry = newMap.get(id); 

      if (!entry) { 
        for (const [key, value] of newMap.entries()) {
          if (value.realId === id) {
            entry = value;
            entryKey = key;
            break;
          }
        }
      }
      
      if (entry && entryKey) {
        newMap.set(entryKey, { ...entry, title, status });
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] ID not found for updateTitleAndStatus: ${id}`);
      return state;
    });
  },

  updateStatus: (id: string, status: PendingConversation['status']) => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      let entryKey: string | undefined = id;
      let entry = newMap.get(id); // 尝试按 tempId 查找

      if (!entry) { // 如果按 tempId 没找到，尝试按 realId 查找
        for (const [key, value] of newMap.entries()) {
          if (value.realId === id) {
            entry = value;
            entryKey = key;
            break;
          }
        }
      }
      
      if (entry && entryKey) {
        newMap.set(entryKey, { ...entry, status }); // 只更新 status
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] ID not found for updateStatus: ${id}`);
      return state;
    });
  },

  removePending: (id: string) => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      let keyToDelete: string | undefined = id;

      if (!newMap.has(id)) { // 如果 id 不是 tempId
        for (const [key, value] of newMap.entries()) {
          if (value.realId === id) {
            keyToDelete = key; // 找到了对应的 tempId
            break;
          }
        }
      }
      
      if (keyToDelete && newMap.has(keyToDelete)) {
        newMap.delete(keyToDelete);
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] ID not found for removePending: ${id}`);
      return state;
    });
  },

  getPendingByTempId: (tempId) => {
    return get().pendingConversations.get(tempId);
  },

  getPendingByRealId: (realId) => {
    for (const conversation of get().pendingConversations.values()) {
      if (conversation.realId === realId) {
        return conversation;
      }
    }
    return undefined;
  },
}));

// --- BEGIN COMMENT ---
// 可以在这里添加一些辅助 selector，如果需要的话
// 例如：selectIsAnyPending, selectPendingTitles, etc.
// --- END COMMENT ---
