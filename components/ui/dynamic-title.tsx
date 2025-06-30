'use client';

import { useCombinedConversations } from '@lib/hooks/use-combined-conversations';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useChatStore } from '@lib/stores/chat-store';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

/**
 * 动态标题组件 - 重构版本
 *
 * 采用稳定的标题管理策略，防止状态冲突导致的标题回退问题
 * 核心原则：
 * 1. 优先级管理：明确不同数据源的优先级
 * 2. 防抖机制：避免频繁的标题更新
 * 3. 状态缓存：保留上一次有效的标题作为fallback
 * 4. 分离关注点：将标题计算逻辑与状态监听分离
 */
export function DynamicTitle() {
  // --- 国际化翻译 ---
  const t = useTranslations('dynamicTitle');

  // --- 状态获取 ---
  const pathname = usePathname();
  const currentConversationId = useChatStore(
    state => state.currentConversationId
  );
  const { conversations, isLoading: isConversationsLoading } =
    useCombinedConversations();
  const { apps, isLoading: isAppsLoading } = useAppListStore();

  // --- 本地状态管理 ---
  const [currentTitle, setCurrentTitle] = useState<string>('AgentifUI');
  const [isUpdating, setIsUpdating] = useState(false);

  // --- 状态缓存 ---
  const stableStateRef = useRef<{
    lastValidConversationTitle: string | null;
    lastValidAppTitle: string | null;
    lastKnownConversationId: string | null;
    titleUpdateCount: number;
  }>({
    lastValidConversationTitle: null,
    lastValidAppTitle: null,
    lastKnownConversationId: null,
    titleUpdateCount: 0,
  });

  // --- 防抖定时器 ---
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 基础应用名称
  const baseTitle = t('base');

  // --- 辅助函数：获取设置页面标题 ---
  const getSettingsTitle = useCallback(
    (path: string): string => {
      if (path === '/settings') return `${t('settings.main')} | ${baseTitle}`;
      if (path === '/settings/profile')
        return `${t('settings.profile')} | ${baseTitle}`;
      if (path === '/settings/account')
        return `${t('settings.account')} | ${baseTitle}`;
      if (path === '/settings/appearance')
        return `${t('settings.appearance')} | ${baseTitle}`;
      if (path === '/settings/language')
        return `${t('settings.language')} | ${baseTitle}`;

      const settingName = path.split('/').pop() || '';
      const formattedName =
        settingName.charAt(0).toUpperCase() + settingName.slice(1);
      return `${t('settings.main')} - ${formattedName} | ${baseTitle}`;
    },
    [baseTitle, t]
  );

  // --- 辅助函数：获取管理页面标题 ---
  const getAdminTitle = useCallback(
    (path: string): string => {
      if (path === '/admin') return `${t('admin.main')} | ${baseTitle}`;
      if (path === '/admin/users') return `${t('admin.users')} | ${baseTitle}`;
      if (path === '/admin/api-config')
        return `${t('admin.apiConfig')} | ${baseTitle}`;
      if (path === '/admin/security')
        return `${t('admin.security')} | ${baseTitle}`;
      if (path === '/admin/analytics')
        return `${t('admin.analytics')} | ${baseTitle}`;
      if (path === '/admin/content')
        return `${t('admin.content')} | ${baseTitle}`;

      const adminSection = path.split('/').pop() || '';
      const formattedName =
        adminSection.charAt(0).toUpperCase() + adminSection.slice(1);
      return `${t('admin.main')} - ${formattedName} | ${baseTitle}`;
    },
    [baseTitle, t]
  );

  // --- 辅助函数：获取应用标题 ---
  const getAppTitle = useCallback(
    (
      path: string,
      appsList: any[],
      isLoading: boolean
    ): { title: string; isStable: boolean } => {
      const pathSegments = path.split('/');
      if (pathSegments.length >= 4) {
        const instanceId = pathSegments[3];

        const targetApp = appsList.find(app => app.instance_id === instanceId);
        if (targetApp) {
          const appDisplayName =
            targetApp.display_name || targetApp.name || instanceId;
          return {
            title: `${appDisplayName} | ${baseTitle}`,
            isStable: true,
          };
        }

        if (isLoading) {
          return {
            title: `${t('apps.loading')} | ${baseTitle}`,
            isStable: false,
          };
        }
      }

      return { title: baseTitle, isStable: false };
    },
    [baseTitle, t]
  );

  // --- 辅助函数：获取聊天标题 ---
  const getChatTitle = useCallback(
    (
      conversationId: string,
      conversationsList: any[],
      isLoading: boolean
    ): { title: string; isStable: boolean } => {
      const currentChat = conversationsList.find(
        chat => chat.id === conversationId || chat.tempId === conversationId
      );

      if (currentChat) {
        const chatTitle = currentChat.title || t('chat.new');
        return {
          title: `${chatTitle} | ${baseTitle}`,
          isStable: true,
        };
      }

      if (isLoading) {
        return {
          title: `${t('chat.loading')} | ${baseTitle}`,
          isStable: false,
        };
      }

      return { title: baseTitle, isStable: false };
    },
    [baseTitle, t]
  );

  // --- 标题计算逻辑 ---
  const calculateTitle = useCallback(
    (
      currentPath: string | null,
      conversationId: string | null,
      conversationsList: any[],
      appsList: any[],
      isConvLoading: boolean,
      isAppsDataLoading: boolean
    ): { title: string; priority: number; isStable: boolean } => {
      // 优先级说明：数值越小优先级越高
      // 1-10: 确定性强的标题（路由相关）
      // 11-20: 动态内容标题（对话、应用）
      // 90+: fallback标题

      try {
        // --- 静态路由标题（最高优先级，最稳定）---
        if (currentPath?.startsWith('/settings')) {
          const settingsTitle = getSettingsTitle(currentPath);
          return { title: settingsTitle, priority: 1, isStable: true };
        }

        if (currentPath?.startsWith('/login')) {
          return {
            title: `${t('auth.login')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        if (currentPath?.startsWith('/register')) {
          return {
            title: `${t('auth.register')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        if (currentPath?.startsWith('/phone-login')) {
          return {
            title: `${t('auth.phoneLogin')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        if (currentPath?.startsWith('/admin')) {
          const adminTitle = getAdminTitle(currentPath);
          return { title: adminTitle, priority: 1, isStable: true };
        }

        if (currentPath?.startsWith('/reset-password')) {
          return {
            title: `${t('auth.resetPassword')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        if (currentPath?.startsWith('/about')) {
          return {
            title: `${t('about')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        if (currentPath?.startsWith('/forgot-password')) {
          return {
            title: `${t('auth.forgotPassword')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        if (currentPath?.startsWith('/sso/processing')) {
          return {
            title: `${t('auth.ssoProcessing')} | ${baseTitle}`,
            priority: 1,
            isStable: true,
          };
        }

        // --- 应用相关标题 ---
        if (currentPath?.startsWith('/apps')) {
          if (currentPath === '/apps') {
            return {
              title: `${t('apps.market')} | ${baseTitle}`,
              priority: 2,
              isStable: true,
            };
          }

          // 应用详情页面 - 增强匹配逻辑
          const appTitle = getAppTitle(
            currentPath,
            appsList,
            isAppsDataLoading
          );
          if (appTitle.title !== baseTitle) {
            // 成功获取到应用标题，缓存它
            stableStateRef.current.lastValidAppTitle = appTitle.title;
            return {
              title: appTitle.title,
              priority: 11,
              isStable: appTitle.isStable,
            };
          }

          // 如果无法获取当前应用标题，但有缓存的应用标题，使用缓存
          if (stableStateRef.current.lastValidAppTitle) {
            return {
              title: stableStateRef.current.lastValidAppTitle,
              priority: 85,
              isStable: false,
            };
          }

          // 根据应用类型提供更具体的fallback标题
          if (currentPath.includes('/agent/')) {
            return {
              title: `${t('apps.agent')} | ${baseTitle}`,
              priority: 90,
              isStable: false,
            };
          } else if (currentPath.includes('/chatbot/')) {
            return {
              title: `${t('apps.chatbot')} | ${baseTitle}`,
              priority: 90,
              isStable: false,
            };
          } else if (currentPath.includes('/chatflow/')) {
            return {
              title: `${t('apps.chatflow')} | ${baseTitle}`,
              priority: 90,
              isStable: false,
            };
          } else if (currentPath.includes('/workflow/')) {
            return {
              title: `${t('apps.workflow')} | ${baseTitle}`,
              priority: 90,
              isStable: false,
            };
          } else if (currentPath.includes('/text-generation/')) {
            return {
              title: `${t('apps.textGeneration')} | ${baseTitle}`,
              priority: 90,
              isStable: false,
            };
          }

          return {
            title: `${t('apps.details')} | ${baseTitle}`,
            priority: 95,
            isStable: false,
          };
        }

        // --- 聊天相关标题 ---
        if (currentPath?.startsWith('/chat')) {
          if (currentPath === '/chat/new') {
            return {
              title: `${t('chat.new')} | ${baseTitle}`,
              priority: 2,
              isStable: true,
            };
          }

          if (currentPath === '/chat/history') {
            return {
              title: `${t('chat.history')} | ${baseTitle}`,
              priority: 2,
              isStable: true,
            };
          }

          if (conversationId) {
            const chatTitle = getChatTitle(
              conversationId,
              conversationsList,
              isConvLoading
            );

            if (
              chatTitle.title !== baseTitle &&
              !chatTitle.title.includes(t('chat.loading'))
            ) {
              // 成功获取到对话标题，缓存它
              stableStateRef.current.lastValidConversationTitle =
                chatTitle.title;
              stableStateRef.current.lastKnownConversationId = conversationId;
              return {
                title: chatTitle.title,
                priority: 12,
                isStable: chatTitle.isStable,
              };
            }

            // 如果当前对话ID和上次已知的相同，且有缓存标题，使用缓存
            if (
              conversationId ===
                stableStateRef.current.lastKnownConversationId &&
              stableStateRef.current.lastValidConversationTitle
            ) {
              return {
                title: stableStateRef.current.lastValidConversationTitle,
                priority: 80,
                isStable: false,
              };
            }

            // 对话数据仍在加载中，使用温和的加载提示
            if (isConvLoading) {
              return {
                title: `${t('chat.loading')} | ${baseTitle}`,
                priority: 95,
                isStable: false,
              };
            }

            // 完全找不到对话
            return {
              title: `${t('chat.notFound')} | ${baseTitle}`,
              priority: 98,
              isStable: false,
            };
          }

          // 在聊天页面但没有具体对话ID，默认情况
          if (currentPath === '/chat') {
            return {
              title: `${t('chat.main')} | ${baseTitle}`,
              priority: 3,
              isStable: true,
            };
          }

          // 其他聊天子页面
          return {
            title: `${t('chat.main')} | ${baseTitle}`,
            priority: 4,
            isStable: true,
          };
        }

        // --- 默认首页 ---
        return { title: baseTitle, priority: 99, isStable: true };
      } catch (error) {
        console.error('计算标题时出错:', error);
        return { title: baseTitle, priority: 100, isStable: false };
      }
    },
    [baseTitle, getSettingsTitle, getAdminTitle, getAppTitle, getChatTitle]
  );

  // --- 防抖更新标题 ---
  const debouncedUpdateTitle = useCallback(
    (newTitle: string, priority: number, isStable: boolean) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // 如果是稳定的高优先级标题，立即更新
      if (isStable && priority <= 10) {
        setCurrentTitle(newTitle);
        document.title = newTitle;
        stableStateRef.current.titleUpdateCount++;
        return;
      }

      // 其他情况使用防抖
      updateTimeoutRef.current = setTimeout(
        () => {
          setCurrentTitle(newTitle);
          document.title = newTitle;
          stableStateRef.current.titleUpdateCount++;
        },
        isStable ? 50 : 200
      ); // 稳定标题延迟更短
    },
    []
  );

  // --- 智能标题更新逻辑 ---
  const titleInfo = useMemo(
    () =>
      calculateTitle(
        pathname,
        currentConversationId,
        conversations,
        apps,
        isConversationsLoading,
        isAppsLoading
      ),
    [
      pathname,
      currentConversationId,
      conversations,
      apps,
      isConversationsLoading,
      isAppsLoading,
      calculateTitle,
    ]
  );

  // --- 主要副作用：监听标题变化 ---
  useEffect(() => {
    setIsUpdating(true);

    const { title: newTitle, priority, isStable } = titleInfo;

    // 只有在标题真正改变时才更新
    if (newTitle !== currentTitle) {
      console.log(
        `[DynamicTitle] 标题更新: "${currentTitle}" -> "${newTitle}" (优先级: ${priority}, 稳定: ${isStable})`
      );
      debouncedUpdateTitle(newTitle, priority, isStable);
    }

    setIsUpdating(false);
  }, [titleInfo, currentTitle, debouncedUpdateTitle]);

  // --- 清理副作用 ---
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // --- 组件卸载时重置标题 ---
  useEffect(() => {
    return () => {
      if (
        document.title.includes(t('chat.loading')) ||
        document.title.includes(t('apps.loading'))
      ) {
        document.title = baseTitle;
      }
    };
  }, [baseTitle, t]);

  return null;
}
