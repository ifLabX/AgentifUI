import { useCallback, useEffect, useState } from 'react';

import { Session, User } from '@supabase/supabase-js';

import { createClient } from './client';
import type { Database } from './types';

/**
 * 用户认证钩子
 * 提供用户登录状态和会话信息
 */
export const useSupabaseAuth = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error fetching session:', error);
      }

      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, session, loading };
};

/**
 * 用户资料钩子
 * 提供用户资料信息和更新方法
 */
export const useProfile = () => {
  const { user } = useSupabaseAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<
    Database['public']['Tables']['profiles']['Row'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    getProfile();
  }, [user, supabase]);

  const updateProfile = useCallback(
    async (updates: Database['public']['Tables']['profiles']['Update']) => {
      if (!user) return { error: new Error('No user logged in') };

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProfile(data);
      return { data };
    },
    [user, supabase]
  );

  return { profile, loading, updateProfile };
};

/**
 * 群组钩子
 * 提供用户所属群组信息
 */
export const useOrganizations = () => {
  const { user } = useSupabaseAuth();
  const supabase = createClient();
  const [organizations, setOrganizations] = useState<
    Database['public']['Tables']['organizations']['Row'][]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getOrganizations = async () => {
      if (!user) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select(
          `
          *,
          org_members!inner(*)
        `
        )
        .eq('org_members.user_id', user.id);

      if (error) {
        console.error('Error fetching organizations:', error);
      } else {
        setOrganizations(data || []);
      }

      setLoading(false);
    };

    getOrganizations();
  }, [user, supabase]);

  return { organizations, loading };
};

/**
 * 对话钩子
 * 提供用户对话列表
 */
export const useConversations = (limit = 10) => {
  const { user } = useSupabaseAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<
    Database['public']['Tables']['conversations']['Row'][]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getConversations = async () => {
      if (!user) {
        setConversations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }

      setLoading(false);
    };

    getConversations();
  }, [user, supabase, limit]);

  return { conversations, loading };
};

/**
 * 消息钩子
 * 提供特定对话的消息列表和发送消息方法
 */
export const useMessages = (conversationId: string | null) => {
  const supabase = createClient();
  const [messages, setMessages] = useState<
    Database['public']['Tables']['messages']['Row'][]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMessages = async () => {
      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }

      setLoading(false);
    };

    getMessages();

    // 设置实时订阅
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          setMessages(current => [
            ...current,
            payload.new as Database['public']['Tables']['messages']['Row'],
          ]);
        }
      )
      .subscribe();

    getMessages();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, supabase]);

  const sendMessage = useCallback(
    async (content: string, role: 'user' | 'system' = 'user') => {
      if (!conversationId)
        return { error: new Error('No conversation selected') };

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          user_id:
            role === 'user'
              ? (await supabase.auth.getUser()).data.user?.id
              : null,
        })
        .select()
        .single();

      return { data, error };
    },
    [conversationId, supabase]
  );

  return { messages, loading, sendMessage };
};
