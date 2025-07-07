'use client';

import { KeyCombination } from '@components/ui/adaptive-key-badge';
import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { useChatInterface } from '@lib/hooks/use-chat-interface';
import {
  COMMON_SHORTCUTS,
  useFormattedShortcut,
} from '@lib/hooks/use-platform-keys';
import { useTheme } from '@lib/hooks/use-theme';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatTransitionStore } from '@lib/stores/chat-transition-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  CirclePlus,
  Clock,
  Edit,
  Edit3,
  Feather,
  LayoutGrid,
  MessageCirclePlus,
  Pen,
  SquarePen,
} from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

import { SidebarButton } from './sidebar-button';

interface SidebarHeaderProps {
  isHovering?: boolean;
}

export function SidebarHeader({ isHovering = false }: SidebarHeaderProps) {
  const { isExpanded, toggleSidebar } = useSidebarStore();
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('sidebar');

  // 🎯 路由激活状态检测
  const isNewChatActive = pathname === '/chat/new';
  const isHistoryActive = pathname === '/chat/history';
  const isAppsActive = pathname === '/apps';

  // 🎯 使用正确的快捷键映射
  const newChatShortcut = useFormattedShortcut('NEW_CHAT');
  const recentChatsShortcut = useFormattedShortcut('RECENT_CHATS');
  const appsMarketShortcut = useFormattedShortcut('APPS_MARKET');

  // 🎯 点击状态管理 - 用于控制点击时的立即切换效果
  const [isClicking, setIsClicking] = React.useState(false);

  const setCurrentConversationId = useChatStore(
    state => state.setCurrentConversationId
  );
  const clearMessages = useChatStore(state => state.clearMessages);
  const setIsWaitingForResponse = useChatStore(
    state => state.setIsWaitingForResponse
  );
  const { setIsWelcomeScreen } = useChatInputStore();
  const { setIsTransitioningToWelcome } = useChatTransitionStore();
  const { clearConversationState } = useChatInterface();

  // 🎯 自定义拉宽版PanelLeft图标 - 让右侧区域更宽
  const WidePanelLeft = ({ className }: { className?: string }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 28 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 拉宽的PanelLeft路径 - 右侧区域更宽 */}
      <rect width="22" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="9" x2="9" y1="5" y2="19" />
    </svg>
  );

  // 🎯 新增：新对话处理函数
  const handleNewChat = () => {
    const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
    if (isAlreadyOnNewChat) {
      return;
    }

    console.log('[SidebarHeader] 开始新对话，清理所有状态');

    // 立即路由到新对话页面
    router.push('/chat/new');

    // 延迟清理状态，确保路由完成
    setTimeout(() => {
      // 清理chatStore状态
      useChatStore.getState().clearMessages();
      clearMessages();
      setCurrentConversationId(null);

      // 🎯 新增：清理use-chat-interface中的对话状态
      // 这确保difyConversationId、dbConversationUUID、conversationAppId都被正确清理
      clearConversationState();

      // 清理其他UI状态
      setIsWelcomeScreen(true);
      setIsTransitioningToWelcome(true);
      setIsWaitingForResponse(false);

      const { selectItem } = useSidebarStore.getState();
      selectItem('chat', null, true);

      console.log('[SidebarHeader] 状态清理完成');
    }, 100);
  };

  return (
    <div className={cn('flex flex-col gap-2 px-3 py-4')}>
      {/* Layout container - horizontal arrangement of buttons and text when expanded */}
      <div className={cn('flex items-center', isExpanded ? 'gap-2' : '')}>
        {/* Sidebar control button - fixed size, shows window icon by default, fades to arrow icon on hover */}
        {/* Shows right-side tooltip in slim state */}
        {!isExpanded ? (
          <TooltipWrapper
            content={t('expand')}
            id="sidebar-header-expand-tooltip"
            placement="right"
            size="sm"
            showArrow={false}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={e => {
                // 立即移除focus，避免影响父容器的cursor显示
                e.currentTarget.blur();

                // 🎯 设置点击状态，确保立即显示目标箭头
                setIsClicking(true);
                toggleSidebar();

                // 延迟重置点击状态，让过渡动画完成
                setTimeout(() => {
                  setIsClicking(false);
                }, 200);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
              aria-label={t('expand')}
              className={cn(
                'group relative flex items-center justify-center px-2 py-2 text-sm font-medium',
                // 使用resize cursor表示可以调整sidebar宽度：展开时向右箭头，收起时向左箭头
                'cursor-e-resize',
                'transition-all duration-150 ease-in-out',
                'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'select-none', // 防止文字选中
                isDark
                  ? 'focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900'
                  : 'focus-visible:ring-primary focus-visible:ring-offset-background',
                'border border-transparent',
                'h-10 w-10', // 正方形固定大小
                'text-gray-200', // 基础文字颜色
                '[margin-left:1px]' // 整个按钮向右移动一点点
              )}
            >
              {/* 🎨 内部背景 - 收起状态仅悬停显示 */}
              <div
                className={cn(
                  'absolute inset-1 rounded-md transition-all duration-150 ease-in-out',
                  isDark
                    ? 'group-hover:bg-stone-600/60'
                    : 'group-hover:bg-stone-300/80'
                )}
              />

              {/* Icon container - contains default icon and hover icon overlay effects */}
              <span
                className={cn(
                  'relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center',
                  isDark
                    ? 'text-gray-400 group-hover:text-white'
                    : 'text-gray-500 group-hover:text-stone-800'
                )}
              >
                {/* 默认图标 - 拉宽版窗口图标，只在非悬停且非点击状态下显示 */}
                <WidePanelLeft
                  className={cn(
                    'absolute h-5 w-5 transition-all duration-150 ease-out',
                    // 收起状态：sidebar悬停时隐藏窗口图标并放大
                    isHovering && 'scale-110 opacity-0',
                    // 按钮悬停时隐藏窗口图标并添加更大的放大效果
                    'group-hover:scale-125 group-hover:opacity-0',
                    // 点击时立即隐藏窗口图标
                    isClicking && 'scale-110 opacity-0'
                  )}
                />

                {/* 悬停图标 - 右箭头，收起状态下悬停或点击时显示 */}
                <ArrowRightToLine
                  className={cn(
                    'absolute h-4 w-4 transition-all duration-150 ease-out',
                    // 收起状态：sidebar悬停、按钮悬停或点击时显示箭头
                    isHovering || isClicking
                      ? 'scale-110 opacity-100'
                      : 'scale-102 opacity-0',
                    'group-hover:opacity-100' // 🎨 移除放大效果
                  )}
                />
              </span>
            </div>
          </TooltipWrapper>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={e => {
              // 立即移除focus，避免影响父容器的cursor显示
              e.currentTarget.blur();

              // 🎯 设置点击状态，确保立即显示目标箭头
              setIsClicking(true);
              toggleSidebar();

              // 延迟重置点击状态，让过渡动画完成
              setTimeout(() => {
                setIsClicking(false);
              }, 200);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
              }
            }}
            aria-label={t('collapse')}
            className={cn(
              'group relative flex items-center justify-center px-2 py-2 text-sm font-medium',
              // 使用resize cursor表示可以调整sidebar宽度：展开时向左箭头，收起时向右箭头
              'cursor-w-resize',
              'transition-all duration-150 ease-in-out',
              'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'select-none', // 防止文字选中
              isDark
                ? 'focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900'
                : 'focus-visible:ring-primary focus-visible:ring-offset-background',
              'border border-transparent',
              'h-10 w-10', // 正方形固定大小
              '[margin-left:1px]' // 整个按钮向右移动一点点
            )}
          >
            {/* 🎨 内部背景 - 展开状态默认显示，悬停时增强 */}
            <div
              className={cn(
                'absolute inset-1 rounded-md transition-all duration-150 ease-in-out',
                // 展开状态：默认有背景色，悬停时增强
                isDark
                  ? 'bg-stone-600/50 group-hover:bg-stone-600/70'
                  : 'bg-stone-300/50 group-hover:bg-stone-300/80'
              )}
            />

            {/* Icon container - contains default icon and hover icon overlay effects */}
            <span
              className={cn(
                'relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center',
                isDark
                  ? 'text-gray-400 group-hover:text-white'
                  : 'text-gray-500 group-hover:text-stone-800'
              )}
            >
              {/* 默认图标 - 拉宽版窗口图标，只在非悬停且非点击状态下显示 */}
              <WidePanelLeft
                className={cn(
                  'absolute h-5 w-5 transition-all duration-150 ease-out',
                  // 按钮悬停时隐藏窗口图标并添加更大的放大效果
                  'group-hover:scale-125 group-hover:opacity-0',
                  // 点击时立即隐藏窗口图标
                  isClicking && 'scale-110 opacity-0'
                )}
              />

              {/* 悬停图标 - 左箭头，展开状态下悬停或点击时显示 */}
              <ArrowLeftToLine
                className={cn(
                  'absolute h-4 w-4 transition-all duration-150 ease-out',
                  // 展开状态：按钮悬停或点击时显示箭头
                  isClicking ? 'scale-110 opacity-100' : 'scale-102 opacity-0',
                  'group-hover:opacity-100' // 🎨 移除放大效果
                )}
              />
            </span>
          </div>
        )}

        {/* Project name - displayed as independent text when expanded, style consistent with buttons */}
        {isExpanded && (
          <div
            className={cn(
              'min-w-0 flex-1 truncate',
              'flex items-center leading-none',
              'font-display text-base font-bold tracking-wide',
              '-mt-0.5 -ml-2', // 微调：稍微往上移一点，进一步左移与下方按钮对齐
              isDark ? 'text-gray-100' : 'text-stone-700'
            )}
          >
            <span
              className={cn(
                'bg-gradient-to-r bg-clip-text text-transparent',
                isDark
                  ? ['from-gray-100 via-gray-200 to-gray-300']
                  : ['from-stone-700 via-stone-800 to-stone-900']
              )}
            >
              {t('appName')}
            </span>
          </div>
        )}
      </div>

      {/* 🎯 新对话按钮 - 重要功能，响应式设计突出显示 */}
      {isExpanded ? (
        <SidebarButton
          icon={
            <Edit
              className={cn(
                'h-5 w-5 transition-all duration-150 ease-out',
                isDark
                  ? 'text-gray-300 group-hover:text-white'
                  : 'text-stone-600 group-hover:text-stone-800'
              )}
            />
          }
          active={isNewChatActive}
          disableLockBehavior={true}
          onClick={handleNewChat}
          aria-label={t('newChat')}
          variant="transparent"
          className={cn(
            'group font-medium transition-all duration-150 ease-out',
            'flex w-full items-center justify-between'
          )}
        >
          <span className="font-serif">{t('newChat')}</span>
          {/* 悬停时显示的快捷键 */}
          <div
            className={cn(
              'opacity-0 transition-opacity duration-200 group-hover:opacity-60',
              'ml-auto'
            )}
          >
            <KeyCombination
              keys={newChatShortcut.symbols}
              size="md"
              isDark={isDark}
            />
          </div>
        </SidebarButton>
      ) : (
        <TooltipWrapper
          content={
            <div className="flex items-center gap-2.5">
              <span>{t('newChat')}</span>
              <KeyCombination keys={newChatShortcut.symbols} size="sm" />
            </div>
          }
          id="sidebar-header-new-chat-tooltip"
          placement="right"
          size="sm"
          showArrow={false}
        >
          <SidebarButton
            icon={
              <Edit
                className={cn(
                  'h-5 w-5 transition-all duration-150 ease-out',
                  isDark
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-stone-600 group-hover:text-stone-800'
                )}
              />
            }
            active={isNewChatActive}
            disableLockBehavior={true}
            onClick={handleNewChat}
            aria-label={t('newChat')}
            variant="transparent"
            className={cn(
              'group font-medium transition-all duration-150 ease-out'
            )}
          >
            <span className="font-serif">{t('newChat')}</span>
          </SidebarButton>
        </TooltipWrapper>
      )}

      {/* 🎯 历史对话按钮 - 提升重要性，与新对话按钮并列 */}
      {isExpanded ? (
        <SidebarButton
          icon={
            <Clock
              className={cn(
                'h-5 w-5 transition-all duration-150 ease-out',
                isDark
                  ? 'text-gray-300 group-hover:text-white'
                  : 'text-stone-600 group-hover:text-stone-800'
              )}
            />
          }
          active={isHistoryActive}
          disableLockBehavior={true}
          onClick={() => {
            router.push('/chat/history');
          }}
          aria-label={t('historyChats')}
          variant="transparent"
          className={cn(
            'group font-medium transition-all duration-150 ease-out',
            'flex w-full items-center justify-between'
          )}
        >
          <span className="font-serif">{t('historyChats')}</span>
          {/* 悬停时显示的快捷键 */}
          <div
            className={cn(
              'opacity-0 transition-opacity duration-200 group-hover:opacity-60',
              'ml-auto'
            )}
          >
            <KeyCombination
              keys={recentChatsShortcut.symbols}
              size="md"
              isDark={isDark}
            />
          </div>
        </SidebarButton>
      ) : (
        <TooltipWrapper
          content={
            <div className="flex items-center gap-2.5">
              <span>{t('historyChats')}</span>
              <KeyCombination keys={recentChatsShortcut.symbols} size="sm" />
            </div>
          }
          id="sidebar-header-history-tooltip"
          placement="right"
          size="sm"
          showArrow={false}
        >
          <SidebarButton
            icon={
              <Clock
                className={cn(
                  'h-5 w-5 transition-all duration-150 ease-out',
                  isDark
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-stone-600 group-hover:text-stone-800'
                )}
              />
            }
            active={isHistoryActive}
            disableLockBehavior={true}
            onClick={() => {
              router.push('/chat/history');
            }}
            aria-label={t('historyChats')}
            variant="transparent"
            className={cn(
              'group font-medium transition-all duration-150 ease-out'
            )}
          >
            <span className="font-serif">{t('historyChats')}</span>
          </SidebarButton>
        </TooltipWrapper>
      )}

      {/* 🎯 应用市场按钮 - 与新对话按钮样式完全一致 */}
      {isExpanded ? (
        <SidebarButton
          icon={
            <LayoutGrid
              className={cn(
                'h-5 w-5 transition-all duration-150 ease-out',
                isDark
                  ? 'text-gray-300 group-hover:text-white'
                  : 'text-stone-600 group-hover:text-stone-800'
              )}
            />
          }
          active={isAppsActive}
          disableLockBehavior={true}
          onClick={() => {
            router.push('/apps');
          }}
          aria-label={t('appsMarket')}
          variant="transparent"
          className={cn(
            'group font-medium transition-all duration-150 ease-out',
            'flex w-full items-center justify-between'
          )}
        >
          <span className="font-serif">{t('appsMarket')}</span>
          {/* 悬停时显示的快捷键 */}
          <div
            className={cn(
              'opacity-0 transition-opacity duration-200 group-hover:opacity-60',
              'ml-auto'
            )}
          >
            <KeyCombination
              keys={appsMarketShortcut.symbols}
              size="md"
              isDark={isDark}
            />
          </div>
        </SidebarButton>
      ) : (
        <TooltipWrapper
          content={
            <div className="flex items-center gap-2.5">
              <span>{t('appsMarket')}</span>
              <KeyCombination keys={appsMarketShortcut.symbols} size="sm" />
            </div>
          }
          id="sidebar-header-apps-tooltip"
          placement="right"
          size="sm"
          showArrow={false}
        >
          <SidebarButton
            icon={
              <LayoutGrid
                className={cn(
                  'h-5 w-5 transition-all duration-150 ease-out',
                  isDark
                    ? 'text-gray-300 group-hover:text-white'
                    : 'text-stone-600 group-hover:text-stone-800'
                )}
              />
            }
            active={isAppsActive}
            disableLockBehavior={true}
            onClick={() => {
              router.push('/apps');
            }}
            aria-label={t('appsMarket')}
            variant="transparent"
            className={cn(
              'group font-medium transition-all duration-150 ease-out'
            )}
          >
            <span className="font-serif">{t('appsMarket')}</span>
          </SidebarButton>
        </TooltipWrapper>
      )}
    </div>
  );
}
