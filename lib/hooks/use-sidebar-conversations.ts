/**
 * 侧边栏会话列表 Hook（优化版本）
 * 
 * 使用统一数据服务和实时订阅管理，提供更好的性能和错误处理
 */

import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@lib/services/data-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/services/realtime-service';
import { cacheService, CacheKeys } from '@lib/services/cache-service';
import { Conversation } from '@lib/types/database';
import { createClient } from '@lib/supabase/client';

// 使用单例模式的Supabase客户端
const supabase = createClient();

/**
 * 侧边栏会话列表 Hook
 * 
 * @param limit 每页数量，默认20
 * @returns 会话列表、加载状态、错误信息和操作函数
 */
export function useSidebarConversations(limit: number = 5) {
  // --- BEGIN COMMENT ---
  // 状态定义，使用更简化的状态管理
  // --- END COMMENT ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取当前用户ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    };

    fetchUserId();

    // 订阅认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          setUserId(null);
          // 用户登出时清理状态
          setConversations([]);
          setTotal(0);
          setHasMore(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- BEGIN COMMENT ---
  // 加载会话列表的优化版本
  // 使用统一数据服务，支持缓存和错误处理
  // --- END COMMENT ---
  const loadConversations = useCallback(async (reset: boolean = false) => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      setTotal(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // --- BEGIN COMMENT ---
      // 使用统一数据服务获取对话列表
      // 支持缓存、排序和分页
      // --- END COMMENT ---
      const result = await dataService.findMany<Conversation>(
        'conversations',
        { 
          user_id: userId, 
          status: 'active' 
        },
        { column: 'updated_at', ascending: false },
        { offset: 0, limit },
        {
          cache: true,
          cacheTTL: 2 * 60 * 1000, // 2分钟缓存
          subscribe: true,
          subscriptionKey: SubscriptionKeys.userConversations(userId),
          onUpdate: (payload) => {
            // 实时更新处理
            console.log('[实时更新] 对话变化:', payload);
            
            // 清除缓存并重新加载
            cacheService.deletePattern(`conversations:*${userId}*`);
            
            // 延迟重新加载，避免频繁更新
            setTimeout(() => {
              loadConversations(true);
            }, 500);
          }
        }
      );

      if (result.success) {
        const conversations = result.data;
        
        setConversations(conversations);
        setTotal(conversations.length);
        setHasMore(conversations.length === limit); // 简化的hasMore判断
        setError(null);
      } else {
        console.error('加载会话列表失败:', result.error);
        setError(result.error);
        setConversations([]);
        setTotal(0);
        setHasMore(false);
      }
    } catch (err) {
      console.error('加载会话列表异常:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setConversations([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  // --- BEGIN COMMENT ---
  // 加载更多会话（可扩展功能）
  // --- END COMMENT ---
  const loadMore = useCallback(async () => {
    if (!userId || isLoading || !hasMore) {
      return;
    }

    // 目前使用简单的实现，后续可以扩展为真正的分页
    console.log('[加载更多] 当前实现暂不支持分页加载');
  }, [userId, isLoading, hasMore]);

  // 刷新会话列表
  const refresh = useCallback(() => {
    if (userId) {
      // 清除缓存
      cacheService.deletePattern(`conversations:*${userId}*`);
      loadConversations(true);
    }
  }, [userId, loadConversations]);

  // 初始加载和用户变化时重新加载
  useEffect(() => {
    if (userId) {
      loadConversations(true);
    }
  }, [userId, loadConversations]);

  // --- BEGIN COMMENT ---
  // 清理函数：组件卸载时清理订阅
  // --- END COMMENT ---
  useEffect(() => {
    return () => {
      if (userId) {
        realtimeService.unsubscribe(SubscriptionKeys.userConversations(userId));
      }
    };
  }, [userId]);

  // --- BEGIN COMMENT ---
  // 删除对话的辅助函数
  // --- END COMMENT ---
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await dataService.softDelete<Conversation>('conversations', conversationId);
      
      if (result.success) {
        // 立即从本地状态中移除
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        setTotal(prev => prev - 1);
        
        // 清除相关缓存
        cacheService.deletePattern(`conversations:*${userId}*`);
        cacheService.delete(CacheKeys.conversation(conversationId));
        
        return true;
      } else {
        console.error('删除对话失败:', result.error);
        setError(result.error);
        return false;
      }
    } catch (err) {
      console.error('删除对话异常:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [userId]);

  // --- BEGIN COMMENT ---
  // 重命名对话的辅助函数
  // --- END COMMENT ---
  const renameConversation = useCallback(async (
    conversationId: string, 
    newTitle: string
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await dataService.update<Conversation>(
        'conversations',
        conversationId,
        { title: newTitle }
      );
      
      if (result.success) {
        // 更新本地状态
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: newTitle, updated_at: result.data.updated_at }
            : conv
        ));
        
        // 清除相关缓存
        cacheService.deletePattern(`conversations:*${userId}*`);
        cacheService.delete(CacheKeys.conversation(conversationId));
        
        return true;
      } else {
        console.error('重命名对话失败:', result.error);
        setError(result.error);
        return false;
      }
    } catch (err) {
      console.error('重命名对话异常:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [userId]);

  return {
    conversations,
    isLoading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
    // 新增的辅助函数
    deleteConversation,
    renameConversation,
    // 缓存控制
    clearCache: () => {
      if (userId) {
        cacheService.deletePattern(`conversations:*${userId}*`);
      }
    }
  };
}
