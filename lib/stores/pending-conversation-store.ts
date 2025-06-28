import { create } from 'zustand';

// --- BEGIN COMMENT ---
// 定义待处理会话的状态和结构
// --- END COMMENT ---
export interface PendingConversation {
  tempId: string; // 客户端生成的临时 ID
  realId?: string; // 从后端获取的真实对话 ID
  status: 'creating' | 'title_fetching' | 'streaming_message' | 'stream_completed_title_pending' | 'title_resolved' | 'persisted_optimistic' | 'failed'; // 会话状态
  title: string; // 当前显示的标题 (可能是 "创建中...", "新对话...", "Untitled", 或真实标题)
  isTitleFinal: boolean; // 标题是否已最终确定从 /name API 获取
  createdAt: string; // 创建时间
  updatedAt: string; // 最后更新时间
  supabase_pk?: string; // 数据库主键 (Supabase ID)，当已存入DB但仍在pending状态时使用
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：打字机效果相关状态
  // --- END COMMENT ---
  titleTypewriterState?: {
    isTyping: boolean; // 是否正在打字
    targetTitle: string; // 目标标题（完整标题）
    displayTitle: string; // 当前显示的标题（可能是部分标题）
    shouldStartTyping: boolean; // 是否应该开始打字效果
  };
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
  // --- BEGIN COMMENT ---
  // 🎯 新增：智能添加临时对话，支持"挤出"第五个对话的动态效果
  // --- END COMMENT ---
  addPendingWithLimit: (tempId: string, initialTitle?: string, maxConversations?: number, onNeedEviction?: (evictedCount: number) => void) => void;
  setRealIdAndStatus: (tempId: string, realId: string, status: PendingConversation['status']) => void;
  updateStatus: (id: string, status: PendingConversation['status']) => void; // id 可以是 tempId 或 realId
  updateTitle: (id: string, title: string, isFinal: boolean) => void; // 更新标题并设置是否为最终标题
  removePending: (id: string) => void; // id 可以是 tempId 或 realId
  markAsOptimistic: (id: string) => void; // 将对话标记为乐观持久化状态
  setSupabasePK: (id: string, supabasePK: string) => void; // 设置已存入DB的pending对话的Supabase PK
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：打字机效果相关Actions
  // --- END COMMENT ---
  startTitleTypewriter: (id: string, targetTitle: string) => void; // 开始标题打字机效果
  updateTypewriterDisplay: (id: string, displayTitle: string) => void; // 更新打字机显示的标题
  completeTitleTypewriter: (id: string) => void; // 完成标题打字机效果
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：原子性状态更新，避免竞态条件
  // --- END COMMENT ---
  markAsPersistedComplete: (id: string, supabasePK: string, finalTitle?: string) => void; // 原子性标记为完全持久化状态
  
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

  addPending: (tempId, initialTitle = "Creating...") => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      if (newMap.has(tempId)) {
        console.warn(`[PendingConversationStore] 尝试添加已存在的临时ID: ${tempId}`);
        return state; 
      }
      newMap.set(tempId, {
        tempId,
        status: 'creating', // 初始状态为 'creating'
        title: initialTitle,
        isTitleFinal: false, // 初始标题不是最终标题
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { pendingConversations: newMap };
    });
  },

  setRealIdAndStatus: (tempId: string, realId: string, status: PendingConversation['status']) => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      const entry = newMap.get(tempId);
      if (entry) {
        newMap.set(tempId, { ...entry, realId, status, updatedAt: new Date().toISOString() });
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] 未找到临时ID: ${tempId}`);
      return state;
    });
  },

  updateTitle: (id: string, title: string, isFinal: boolean) => {
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
        // 更新标题和 isTitleFinal 标志
        // 如果 isFinal 为 true 且当前状态是 'title_fetching'，则同时更新状态为 'title_resolved'
        const newStatus = isFinal && entry.status === 'title_fetching' ? 'title_resolved' : entry.status;
        newMap.set(entryKey, { ...entry, title, isTitleFinal: isFinal, status: newStatus, updatedAt: new Date().toISOString() });
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] 未找到ID: ${id}`);
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
        newMap.set(entryKey, { ...entry, status, updatedAt: new Date().toISOString() });
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] 未找到ID: ${id}`);
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
      console.warn(`[PendingConversationStore] 未找到要删除的ID: ${id}`);
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

  markAsOptimistic: (id: string) => {
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
        // 确保对话至少有 realId 才能标记为 optimistic
        if (entry.realId) {
          newMap.set(entryKey, { ...entry, status: 'persisted_optimistic', updatedAt: new Date().toISOString() });
          // console.log(`[PendingConversationStore] Marked ${entryKey} (realId: ${entry.realId}) as persisted_optimistic`);
          return { pendingConversations: newMap };
        } else {
          console.warn(`[PendingConversationStore] Cannot mark ${entryKey} as persisted_optimistic without a realId.`);
          return state;
        }
      }
      console.warn(`[PendingConversationStore] markAsOptimistic: 未找到ID: ${id}`);
      return state;
    });
  },

  setSupabasePK: (id: string, supabasePK: string) => {
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
        newMap.set(entryKey, { ...entry, supabase_pk: supabasePK, updatedAt: new Date().toISOString() });
        // console.log(`[PendingConversationStore] Set supabase_pk for ${entryKey} (realId: ${entry.realId}) to ${supabasePK}`);
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] setSupabasePK: 未找到ID: ${id}`);
      return state;
    });
  },

  // --- BEGIN COMMENT ---
  // 🎯 实现打字机效果相关Actions
  // --- END COMMENT ---
  startTitleTypewriter: (id: string, targetTitle: string) => {
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
        newMap.set(entryKey, { 
          ...entry, 
          titleTypewriterState: {
            isTyping: true,
            targetTitle,
            displayTitle: entry.title, // 从当前标题开始
            shouldStartTyping: true
          },
          updatedAt: new Date().toISOString() 
        });
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] startTitleTypewriter: 未找到ID: ${id}`);
      return state;
    });
  },

  updateTypewriterDisplay: (id: string, displayTitle: string) => {
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
      
      if (entry && entryKey && entry.titleTypewriterState) {
        newMap.set(entryKey, { 
          ...entry, 
          titleTypewriterState: {
            ...entry.titleTypewriterState,
            displayTitle,
            shouldStartTyping: false // 已经开始打字，不需要再次触发
          },
          updatedAt: new Date().toISOString() 
        });
        return { pendingConversations: newMap };
      }
      return state;
    });
  },

  completeTitleTypewriter: (id: string) => {
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
      
      if (entry && entryKey && entry.titleTypewriterState) {
        const finalTitle = entry.titleTypewriterState.targetTitle;
        newMap.set(entryKey, { 
          ...entry, 
          title: finalTitle, // 更新最终标题
          titleTypewriterState: {
            ...entry.titleTypewriterState,
            isTyping: false,
            displayTitle: finalTitle,
            shouldStartTyping: false
          },
          updatedAt: new Date().toISOString() 
        });
        return { pendingConversations: newMap };
      }
      return state;
    });
  },

  // --- BEGIN COMMENT ---
  // 🎯 新增：智能添加临时对话，支持"挤出"第五个对话的动态效果
  // 当对话总数达到限制时，自动移除最老的对话
  // --- END COMMENT ---
    addPendingWithLimit: (tempId: string, initialTitle = "Creating...", maxConversations = 20, onNeedEviction) => {
    set((state) => {
      const newMap = new Map(state.pendingConversations);
      
      if (newMap.has(tempId)) {
        console.warn(`[PendingConversationStore] 尝试添加已存在的临时ID: ${tempId}`);
        return state; 
      }
      
      // 创建新的临时对话
      const newPending: PendingConversation = {
        tempId,
        title: initialTitle,
        status: 'creating',
        isTitleFinal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // --- BEGIN COMMENT ---
        // 🎯 初始化打字机效果状态
        // --- END COMMENT ---
        titleTypewriterState: {
          isTyping: false,
          targetTitle: initialTitle,
          displayTitle: initialTitle,
          shouldStartTyping: false
        }
      };
      
      // 添加新对话
      newMap.set(tempId, newPending);
      
      // --- BEGIN COMMENT ---
      // 🎯 注意：由于此store只管理临时对话，真正的"挤出"逻辑
      // 需要在整合数据的地方（useCombinedConversations）处理
      // 这里先通知回调函数，让上层决定如何处理
      // --- END COMMENT ---
      if (onNeedEviction && typeof onNeedEviction === 'function') {
        // 计算当前临时对话数量，如果超过限制则通知
        const pendingCount = newMap.size;
        if (pendingCount > 1) { // 新对话已经添加，检查是否需要挤出
          onNeedEviction(1); // 简单通知需要挤出1个对话
        }
      }
      
      return { pendingConversations: newMap };
    });
  },

  // --- BEGIN COMMENT ---
  // 🎯 新增：原子性状态更新，避免竞态条件
  // --- END COMMENT ---
  markAsPersistedComplete: (id: string, supabasePK: string, finalTitle?: string) => {
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
        newMap.set(entryKey, { 
          ...entry, 
          status: 'title_resolved',
          isTitleFinal: true,
          title: finalTitle || entry.title,
          supabase_pk: supabasePK,
          updatedAt: new Date().toISOString() 
        });
        return { pendingConversations: newMap };
      }
      console.warn(`[PendingConversationStore] markAsPersistedComplete: 未找到ID: ${id}`);
      return state;
    });
  },
}));

// --- BEGIN COMMENT ---
// 可以在这里添加一些辅助 selector，如果需要的话
// 例如：selectIsAnyPending, selectPendingTitles, etc.
// --- END COMMENT ---
