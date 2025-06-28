/**
 * 整合数据库对话和临时对话的 Hook
 * 
 * 将数据库中的对话和 pending-conversation-store 中的临时对话整合在一起
 * 
 * TODO: 数据库集成
 * 当数据库集成完成后，此 Hook 将从两个数据源获取对话：
 * 1. 数据库中的正式对话（通过 useSidebarConversations 获取）
 * 2. 前端存储中的临时对话（通过 usePendingConversationStore 获取）
 * 
 * 当对话创建完成并保存到数据库后，应该从 pendingConversationStore 中移除临时对话
 * 这样就可以使用数据库中的实际对话，而不是临时对话
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSidebarConversations } from './use-sidebar-conversations';
import { usePendingConversationStore, PendingConversation } from '@lib/stores/pending-conversation-store';
import { useSupabaseAuth } from '@lib/supabase/hooks'; // 引入 Supabase Auth Hook
import { Conversation } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 扩展 Conversation 类型，添加临时状态标志
// user_id 可以为 undefined，以适应匿名用户的临时对话，并与 Partial<Conversation> 兼容
// --- END COMMENT ---
export interface CombinedConversation extends Partial<Conversation> {
  id: string; // 必需字段
  title: string; // 必需字段
  user_id?: string; // 改为可选 string，即 string | undefined
  created_at: string; // 必需字段
  updated_at: string; // 必需字段
  isPending?: boolean; // 是否为临时对话
  pendingStatus?: PendingConversation['status']; // 临时对话状态
  tempId?: string; // 临时 ID
  supabase_pk?: string; // 数据库主键 (Supabase ID)
  
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

/**
 * 整合数据库对话和临时对话的 Hook
 * 
 * @returns 整合后的对话列表、加载状态、错误信息和刷新函数
 */
export function useCombinedConversations() {
  // --- BEGIN COMMENT ---
  // 🎯 挤出机制：获取20个数据库对话，这样当有新对话创建时，总数会超过20个，触发挤出逻辑
  // --- END COMMENT ---
  const {
    conversations: dbConversations,
    isLoading: isDbLoading,
    error: dbError,
    refresh: refreshDbConversations
  } = useSidebarConversations(20);

  // --- BEGIN COMMENT ---
  // 获取当前登录用户ID
  // --- END COMMENT ---
  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;

  // --- BEGIN COMMENT ---
  // 获取临时对话列表
  // 使用 useRef 和 useEffect 确保能够监听到 pendingConversationStore 的变化
  // --- END COMMENT ---
  const pendingConversations = usePendingConversationStore(state => state.pendingConversations);
  const [pendingArray, setPendingArray] = useState<PendingConversation[]>([]);
  
  // 监听 pendingConversations 的变化
  // 当 pendingConversations Map 实例从 store 更新时，直接用其内容更新 pendingArray
  useEffect(() => {
    setPendingArray(Array.from(pendingConversations.values()));
  }, [pendingConversations]);

  // --- BEGIN COMMENT ---
  // 保存上一次的合并对话列表，避免路由切换时闪烁
  // --- END COMMENT ---
  const [prevCombinedConversations, setPrevCombinedConversations] = useState<CombinedConversation[]>([]);
  
  // 整合数据库对话和临时对话
  const combinedConversations = useMemo(() => {
    const finalConversations: CombinedConversation[] = [];
    const dbConvsRealIds = new Set<string>();

    // --- BEGIN COMMENT ---
    // 如果数据库对话和临时对话都为空，但有上一次的合并对话列表，则直接返回上一次的列表
    // 这样可以避免在路由切换时侧边栏对话列表闪烁消失
    // --- END COMMENT ---
    if (dbConversations.length === 0 && pendingArray.length === 0 && prevCombinedConversations.length > 0) {
      console.log('[useCombinedConversations] 数据库和临时对话都为空，使用上一次的合并对话列表');
      return prevCombinedConversations;
    }

    // 1. 处理数据库中的对话
    dbConversations.forEach(dbConv => {
      const realId = dbConv.external_id || dbConv.id; // Prefer external_id as Dify realId
      if (realId) {
        dbConvsRealIds.add(realId);
      }
      finalConversations.push({
        ...dbConv,
        id: realId, // Use Dify realId as the primary ID for CombinedConversation
        supabase_pk: dbConv.id, // Store Supabase PK
        isPending: false,
        pendingStatus: undefined,
        tempId: undefined,
      });
    });

    // 2. 处理并添加尚未被数据库版本覆盖的临时对话
    pendingArray.forEach(pending => {
      // If temporary conversation has a realId and it's already covered by dbConversations, skip it.
      if (pending.realId && dbConvsRealIds.has(pending.realId)) {
        return;
      }

      const now = new Date().toISOString();
      finalConversations.push({
        // Inherited from Partial<Conversation> - provide defaults or map from pending
        ai_config_id: null,
        summary: null,
        settings: {},
        status: 'active', // Or map from pending.status if needed for display
        external_id: pending.realId || null, // This is the Dify ID
        app_id: null, // TODO: Consider if pending items need app_id context
        last_message_preview: pending.title.substring(0, 50), // Example preview
        metadata: {}, // TODO: Consider if pending items can have metadata

        // Required CombinedConversation fields
        id: pending.realId || pending.tempId, // Primary ID: Dify realId if available, else tempId
        title: pending.title,
        user_id: currentUserId || undefined,
        created_at: pending.createdAt, // Use timestamp from pending store
        updated_at: pending.updatedAt, // Use timestamp from pending store

        // Pending specific fields
        isPending: true,
        pendingStatus: pending.status,
        tempId: pending.tempId,
        supabase_pk: pending.supabase_pk, // Use supabase_pk from pending store if available
        
        // --- BEGIN COMMENT ---
        // 🎯 映射打字机效果状态
        // --- END COMMENT ---
        titleTypewriterState: pending.titleTypewriterState
      });
    });
    
    // 3. 排序
    finalConversations.sort((a, b) => {
      // Example: active pending items first, then by updated_at
      if (a.isPending && a.pendingStatus && ['creating', 'streaming_message', 'title_fetching'].includes(a.pendingStatus) &&
         !(b.isPending && b.pendingStatus && ['creating', 'streaming_message', 'title_fetching'].includes(b.pendingStatus))) {
        return -1;
      }
      if (!(a.isPending && a.pendingStatus && ['creating', 'streaming_message', 'title_fetching'].includes(a.pendingStatus)) &&
           b.isPending && b.pendingStatus && ['creating', 'streaming_message', 'title_fetching'].includes(b.pendingStatus)) {
        return 1;
      }
      // Fallback to updated_at, ensuring it's a valid date string
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });

    // --- BEGIN COMMENT ---
    // 🎯 新增：限制总对话数量为20个，实现"挤出"效果
    // 当有新的临时对话时，自动移除超出限制的最老对话
    // --- END COMMENT ---
    const MAX_CONVERSATIONS = 20;
    if (finalConversations.length > MAX_CONVERSATIONS) {
      // 保留前20个对话（包括活跃的临时对话）
      const keptConversations = finalConversations.slice(0, MAX_CONVERSATIONS);
      const evictedConversations = finalConversations.slice(MAX_CONVERSATIONS);
      
      console.log(`[useCombinedConversations] 🎯 挤出效果触发，保留${keptConversations.length}个对话，移除${evictedConversations.length}个对话`);
      evictedConversations.forEach(conv => {
        console.log(`[useCombinedConversations] 挤出对话: ${conv.title} (${conv.id})`);
      });
      
      return keptConversations;
    }

    return finalConversations;
  }, [dbConversations, pendingArray, currentUserId]);

  // 刷新函数
  const refresh = () => {
    refreshDbConversations();
    // 强制刷新 pendingArray
    setPendingArray(Array.from(pendingConversations.values()));
    // --- BEGIN COMMENT ---
    // 触发全局刷新事件，通知其他组件数据已更新
    // --- END COMMENT ---
    conversationEvents.emit();
  };

  // --- BEGIN COMMENT ---
  // 监听全局刷新事件
  // --- END COMMENT ---
  useEffect(() => {
    const unsubscribe = conversationEvents.subscribe(() => {
      refreshDbConversations();
      setPendingArray(Array.from(pendingConversations.values()));
    });
    
    return () => {
      unsubscribe();
    };
  }, [refreshDbConversations, pendingConversations]);

  // --- BEGIN COMMENT ---
  // 🎯 增强：安全的临时对话清理机制
  // 增加时间缓冲和更严格的清理条件，确保pending对话不会意外消失
  // 只清理满足以下所有条件的临时对话：
  // 1. 已存在超过15分钟（增加缓冲时间，确保所有操作完成）
  // 2. 已有对应的数据库记录
  // 3. 状态为已完成（persisted_optimistic 或 title_resolved）
  // 4. 必须有数据库主键（确保真正保存到数据库）
  // 5. 标题必须是最终确定的
  // --- END COMMENT ---
  useEffect(() => {
    const dbRealIds = new Set(dbConversations.map(c => c.external_id || c.id));
    const { removePending } = usePendingConversationStore.getState();

    const cleanupExpiredPendingConversations = () => {
      const now = Date.now();
      
      pendingArray.forEach(p => {
        // 检查对话年龄
        const createdTime = new Date(p.createdAt).getTime();
        const ageInMinutes = (now - createdTime) / (1000 * 60);
        
        // 🎯 增强：更严格的清理条件，避免竞态条件
        const shouldCleanup = (
          // 基本条件：超过15分钟（增加缓冲时间）
          ageInMinutes > 15 && 
          // 必须有真实ID
          p.realId && 
          // 数据库中存在对应记录
          dbRealIds.has(p.realId) &&
          // 状态必须是最终完成状态
          (p.status === 'persisted_optimistic' || p.status === 'title_resolved') &&
          // 🎯 新增：必须有数据库主键，确保真正保存到数据库
          p.supabase_pk &&
          // 🎯 新增：标题必须是最终确定的
          p.isTitleFinal
        );
        
        if (shouldCleanup) {
          console.log(`[useCombinedConversations] 清理已确认保存的临时对话: ${p.tempId} (realId: ${p.realId}, 年龄: ${ageInMinutes.toFixed(1)}分钟)`);
          removePending(p.tempId);
        } else if (p.realId && dbRealIds.has(p.realId)) {
          // 详细记录保留原因，便于调试
          const reasons = [];
          if (ageInMinutes <= 15) reasons.push(`年龄不足(${ageInMinutes.toFixed(1)}分钟)`);
          if (p.status !== 'persisted_optimistic' && p.status !== 'title_resolved') reasons.push(`状态未完成(${p.status})`);
          if (!p.supabase_pk) reasons.push('无数据库主键');
          if (!p.isTitleFinal) reasons.push('标题未确定');
          
          if (reasons.length > 0 && ageInMinutes > 5) { // 只记录超过5分钟的情况
            console.log(`[useCombinedConversations] 保留临时对话 ${p.tempId}: ${reasons.join(', ')}`);
          }
        }
      });
    };
    
    // 🎯 增强：延迟首次执行，避免初始化时误删
    const initialDelay = setTimeout(cleanupExpiredPendingConversations, 30000); // 30秒后首次执行
    
    // 每3分钟检查一次（降低频率，减少竞态风险）
    const intervalId = setInterval(cleanupExpiredPendingConversations, 3 * 60 * 1000);
    
    // 清理定时器
    return () => {
      clearTimeout(initialDelay);
      clearInterval(intervalId);
    };
  }, [dbConversations, pendingArray]);

  // --- BEGIN COMMENT ---
  // 当合并对话列表更新时，保存当前状态，用于路由切换时保持侧边栏稳定
  // --- END COMMENT ---
  useEffect(() => {
    if (combinedConversations.length > 0) {
      setPrevCombinedConversations(combinedConversations);
    }
  }, [combinedConversations]);
  
  return {
    conversations: combinedConversations,
    isLoading: isDbLoading,
    error: dbError,
    refresh
  };
}

// --- BEGIN COMMENT ---
// 全局事件系统，用于同步对话数据更新
// --- END COMMENT ---
class ConversationEventEmitter {
  private listeners: Set<() => void> = new Set();
  
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  emit() {
    this.listeners.forEach(callback => callback());
  }
}

export const conversationEvents = new ConversationEventEmitter();
