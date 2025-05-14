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
import { Conversation } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 扩展 Conversation 类型，添加临时状态标志
// --- END COMMENT ---
export interface CombinedConversation extends Partial<Conversation> {
  id: string; // 必需字段
  title: string; // 必需字段
  user_id: string; // 必需字段
  created_at: string; // 必需字段
  updated_at: string; // 必需字段
  isPending?: boolean; // 是否为临时对话
  pendingStatus?: PendingConversation['status']; // 临时对话状态
  tempId?: string; // 临时 ID
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
  // 获取临时对话列表
  // 使用 useRef 和 useEffect 确保能够监听到 pendingConversationStore 的变化
  // --- END COMMENT ---
  const pendingConversations = usePendingConversationStore(state => state.pendingConversations);
  const [pendingArray, setPendingArray] = useState<PendingConversation[]>([]);
  
  // 使用 ref 跟踪上一次的 pendingConversations 大小
  const prevSizeRef = useRef(0);
  const prevMapRef = useRef(new Map<string, PendingConversation>());
  
  // 监听 pendingConversations 的变化
  useEffect(() => {
    const currentSize = pendingConversations.size;
    let hasChanged = currentSize !== prevSizeRef.current;
    
    // 如果大小相同，检查内容是否变化
    if (!hasChanged && currentSize > 0) {
      // 检查每个元素的状态是否变化
      for (const [key, value] of pendingConversations.entries()) {
        const prevValue = prevMapRef.current.get(key);
        if (!prevValue || 
            prevValue.status !== value.status || 
            prevValue.title !== value.title || 
            prevValue.isTitleFinal !== value.isTitleFinal ||
            prevValue.realId !== value.realId) {
          hasChanged = true;
          break;
        }
      }
    }
    
    if (hasChanged) {
      const newArray = Array.from(pendingConversations.values());
      setPendingArray(newArray);
      prevSizeRef.current = currentSize;
      prevMapRef.current = new Map(pendingConversations);
    }
  }, [pendingConversations]);

  // 整合数据库对话和临时对话
  const combinedConversations = useMemo(() => {
    // 创建一个 Set 来存储已经存在于数据库中的对话 ID
    const existingIds = new Set(dbConversations.map(conv => conv.id));
    
    // 将临时对话转换为 CombinedConversation 格式
    const pendingConvsFormatted: CombinedConversation[] = pendingArray
      .filter(pending => {
        // 对于没有 realId 的临时对话，始终显示
        // 对于有 realId 的临时对话，只有当它不在数据库中时才显示
        return !pending.realId || (pending.realId && !existingIds.has(pending.realId));
      })
      .map(pending => {
        // 将临时对话转换为 CombinedConversation 格式
        
        // --- BEGIN COMMENT ---
        // TODO: 数据库集成后的状态处理
        // 当数据库集成完成后，我们应该在此处添加逻辑，判断临时对话是否已经保存到数据库
        // 如果已保存，则应该从 pendingConversationStore 中移除该临时对话
        // 如果数据库中已存在相同 realId 的对话，则不应该再显示临时对话
        // 示例:
        // if (databaseConversations.some(dbConv => dbConv.id === pending.realId)) {
        //   // 如果数据库中已存在相同 realId 的对话，则跳过该临时对话
        //   return null;
        // }
        // --- END COMMENT ---
        
        // 创建时间和更新时间使用当前时间，因为 PendingConversation 没有这些字段
        const now = new Date().toISOString();
        
        return {
          id: pending.realId || pending.tempId, // 优先使用 realId
          title: pending.title,
          user_id: 'temp-user', // 临时用户 ID，满足 CombinedConversation 类型要求
          created_at: now,
          updated_at: now,
          org_id: null,
          ai_config_id: null,
          summary: null,
          settings: {},
          status: 'active',
          external_id: pending.realId || null,
          app_id: null,
          last_message_preview: null,
          metadata: {},
          isPending: true, // 始终将临时对话显示为临时状态，直到数据库集成完成
          pendingStatus: pending.status,
          tempId: pending.tempId
        };
      })
      .filter(Boolean) // 过滤掉可能的 null 值
    
    // 将数据库对话标记为非临时对话
    const dbConvsFormatted: CombinedConversation[] = dbConversations.map(conv => ({
      ...conv,
      isPending: false
    }));
    
    // 合并两个数组，并按更新时间排序
    return [...dbConvsFormatted, ...pendingConvsFormatted].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [dbConversations, pendingArray]);

  // 刷新函数
  const refresh = () => {
    refreshDbConversations();
    // 强制刷新 pendingArray
    setPendingArray(Array.from(pendingConversations.values()));
  };

  return {
    conversations: combinedConversations,
    isLoading: isDbLoading,
    error: dbError,
    refresh
  };
}
