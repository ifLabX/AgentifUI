/**
 * 侧边栏会话列表 Hook
 * 
 * 用于获取和管理侧边栏显示的会话列表
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserConversations } from '@lib/db/conversations';
import { Conversation } from '@lib/types/database';
import { createClient } from '@lib/supabase/client';

// 使用单例模式的Supabase客户端
const supabase = createClient();

/**
 * 侧边栏会话列表 Hook
 * 
 * @param limit 每页数量，默认20
 * @returns 会话列表、加载状态、错误信息和刷新函数
 */
export function useSidebarConversations(limit: number = 5) {
  // --- BEGIN COMMENT ---
  // 状态定义：
  // conversations: 会话列表
  // isLoading: 加载状态
  // error: 错误信息
  // total: 会话总数
  // hasMore: 是否有更多会话
  // --- END COMMENT ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
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
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 加载会话列表
  const loadConversations = useCallback(async (reset: boolean = false) => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      setTotal(0);
      setHasMore(false);
      return;
    }

    const newOffset = reset ? 0 : offset;
    
    // --- BEGIN COMMENT ---
    // 添加调试日志，查看获取对话列表的查询参数
    // --- END COMMENT ---
    console.log(`[获取对话列表] 开始获取对话列表，userId: ${userId}, limit: ${limit}, offset: ${newOffset}`);
    
    setIsLoading(true);
    try {
      const result = await getUserConversations(userId, limit, newOffset);
      
      setConversations(prev => 
        reset ? result.conversations : [...prev, ...result.conversations]
      );
      setTotal(result.total);
      setHasMore(newOffset + limit < result.total);
      setError(null);
      
      if (reset) {
        setOffset(limit);
      } else {
        setOffset(newOffset + limit);
      }
    } catch (err) {
      console.error('加载会话列表失败:', err);
      setError(err instanceof Error ? err : new Error('加载会话列表失败'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, offset]);

  // 加载更多会话
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadConversations(false);
    }
  }, [isLoading, hasMore, loadConversations]);

  // 刷新会话列表
  const refresh = useCallback(() => {
    loadConversations(true);
  }, [loadConversations]);

  // 初始加载和用户变化时重新加载
  useEffect(() => {
    if (userId) {
      loadConversations(true);
    }
  }, [userId, loadConversations]);

  // 实时订阅会话变化
  useEffect(() => {
    if (!userId) return;

    // 订阅会话表的变化
    const subscription = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // 当会话表有变化时刷新列表
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, refresh]);

  return {
    conversations,
    isLoading,
    error,
    total,
    hasMore,
    loadMore,
    refresh
  };
}
