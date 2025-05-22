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
}

/**
 * 整合数据库对话和临时对话的 Hook
 * 
 * @returns 整合后的对话列表、加载状态、错误信息和刷新函数
 */
export function useCombinedConversations() {
  // 获取数据库对话列表
  const {
    conversations: dbConversations,
    isLoading: isDbLoading,
    error: dbError,
    refresh: refreshDbConversations
  } = useSidebarConversations();

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
        org_id: null,
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

    return finalConversations;
  }, [dbConversations, pendingArray, currentUserId]);

  // 刷新函数
  const refresh = () => {
    refreshDbConversations();
    // 强制刷新 pendingArray
    setPendingArray(Array.from(pendingConversations.values()));
  };

  // Effect to clean up fully synced pending conversations from PendingConversationStore
  useEffect(() => {
    const dbRealIds = new Set(dbConversations.map(c => c.external_id || c.id));
    const { removePending } = usePendingConversationStore.getState();

    // --- BEGIN COMMENT ---
    // 延迟清理临时对话，确保消息已完全保存
    // 这是为了解决首次创建对话时助手消息被截断的问题
    // 通过延迟清理，确保流式响应完全结束并且消息已完整保存到数据库
    // --- END COMMENT ---
    const cleanupPendingConversations = () => {
      pendingArray.forEach(p => {
        if (p.realId && dbRealIds.has(p.realId) &&
            (p.status === 'persisted_optimistic' || p.status === 'title_resolved')) {
          console.log(`[useCombinedConversations] Cleaning up fully synced pending item from store: ${p.tempId} (realId: ${p.realId})`);
          removePending(p.tempId); // remove by tempId, as it's the key in pendingConversations Map
        }
      });
    };
    
    // 延迟2秒执行清理，确保消息已完全保存
    const timeoutId = setTimeout(cleanupPendingConversations, 2000);
    
    // 清理定时器
    return () => clearTimeout(timeoutId);
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
