'use client';

import { ConfirmDialog } from '@components/ui';
import { useAllConversations } from '@lib/hooks/use-all-conversations';
import { useChatInterface } from '@lib/hooks/use-chat-interface';
import { useChatWidth } from '@lib/hooks/use-chat-width';
import { conversationEvents } from '@lib/hooks/use-combined-conversations';
import { useTheme } from '@lib/hooks/use-theme';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatTransitionStore } from '@lib/stores/chat-transition-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';
import { Edit, Search, Trash2 } from 'lucide-react';

import * as React from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { HistoryList } from './history-list';
import { HistorySelectionBar } from './history-selection-bar';

// 历史对话页面组件
// 显示所有历史对话，支持搜索功能和多选删除功能
export function History() {
  const { isDark } = useTheme();
  const { colors } = useThemeColors();
  const t = useTranslations('history');
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();
  const { widthClass, paddingClass } = useChatWidth();

  // 多选功能状态管理
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedConversations, setSelectedConversations] = React.useState<
    Set<string>
  >(new Set());
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] =
    React.useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = React.useState(false);

  // 搜索框引用，用于自动聚焦
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // 获取所有历史对话列表，不限制数量
  const {
    conversations,
    isLoading,
    error,
    total,
    refresh,
    deleteConversation,
    renameConversation,
  } = useAllConversations();

  // 监听全局对话数据更新事件
  React.useEffect(() => {
    const unsubscribe = conversationEvents.subscribe(() => {
      refresh();
    });

    return () => {
      unsubscribe();
    };
  }, [refresh]);

  // 组件挂载时自动聚焦搜索框
  React.useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 当对话列表发生变化时，清理无效的选中项
  React.useEffect(() => {
    if (selectedConversations.size > 0) {
      const validIds = new Set(
        conversations.map(c => c.id).filter(Boolean) as string[]
      );
      const validSelectedIds = new Set(
        Array.from(selectedConversations).filter(id => validIds.has(id))
      );

      if (validSelectedIds.size !== selectedConversations.size) {
        setSelectedConversations(validSelectedIds);
      }

      // 如果没有有效选中项，退出选择模式
      if (validSelectedIds.size === 0) {
        setIsSelectionMode(false);
      }
    }
  }, [conversations, selectedConversations]);

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 过滤对话列表，根据搜索查询
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase().trim();
    return conversations.filter(
      conversation =>
        conversation.title?.toLowerCase().includes(query) ||
        conversation.last_message_preview?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // 多选功能处理函数
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedConversations(new Set());
    }
  };

  const handleSelectConversation = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedConversations);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedConversations(newSelected);

    // 如果选中了项目但不在选择模式，自动进入选择模式
    if (newSelected.size > 0 && !isSelectionMode) {
      setIsSelectionMode(true);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredConversations
      .map(c => c.id)
      .filter(Boolean) as string[];
    setSelectedConversations(new Set(allIds));
    setIsSelectionMode(true);
  };

  const handleDeselectAll = () => {
    setSelectedConversations(new Set());
  };

  const handleCancelSelection = () => {
    setSelectedConversations(new Set());
    setIsSelectionMode(false);
  };

  const handleBatchDelete = () => {
    if (selectedConversations.size === 0) return;
    setShowBatchDeleteDialog(true);
  };

  const handleBatchDeleteConfirm = async () => {
    setIsBatchDeleting(true);
    try {
      const deletePromises = Array.from(selectedConversations).map(id =>
        deleteConversation(id)
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;

      if (successCount > 0) {
        // 刷新列表
        refresh();
        // 触发全局同步事件
        conversationEvents.emit();

        // 清理选择状态
        setSelectedConversations(new Set());
        setIsSelectionMode(false);

        if (successCount < selectedConversations.size) {
          alert(
            t('operations.batchDeleteSuccess', {
              success: successCount,
              failed: selectedConversations.size - successCount,
            })
          );
        }
      } else {
        alert(t('operations.batchDeleteFailed'));
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      alert(t('operations.operationError'));
    } finally {
      setIsBatchDeleting(false);
      setShowBatchDeleteDialog(false);
    }
  };

  // 🎯 新增：新对话处理函数，统一管理状态清理
  const { clearConversationState } = useChatInterface();

  const handleNewChat = () => {
    // 跳转到新对话页面
    router.push('/chat/new');

    // 重置状态
    setTimeout(() => {
      // 清理消息和重置状态
      useChatStore.getState().clearMessages();
      useChatStore.getState().setCurrentConversationId(null);

      // 🎯 新增：清理use-chat-interface中的对话状态
      // 这确保difyConversationId、dbConversationUUID、conversationAppId都被正确清理
      clearConversationState();

      // 清理其他UI状态
      useChatInputStore.getState().setIsWelcomeScreen(true);
      useChatTransitionStore.getState().setIsTransitioningToWelcome(true);
      useChatStore.getState().setIsWaitingForResponse(false);

      // 设置侧边栏选中状态 - 保持当前展开状态
      useSidebarStore.getState().selectItem('chat', null, true);

      // 设置标题
      // 标题管理由DynamicTitle组件统一处理，无需手动设置
    }, 100);
  };

  // 处理对话项点击
  const handleConversationClick = (id: string) => {
    // 如果在选择模式下，不跳转，而是切换选择状态
    if (isSelectionMode) {
      const isSelected = selectedConversations.has(id);
      handleSelectConversation(id, !isSelected);
      return;
    }

    router.push(`/chat/${id}`);
  };

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden',
        colors.mainBackground.tailwind
      )}
    >
      {/* 固定头部区域 - 不滚动 */}
      <div className="flex-shrink-0">
        {/* 标题和新对话按钮 - 居中显示 */}
        <div
          className={cn('mx-auto mb-6 w-full pt-4', widthClass, paddingClass)}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1
                className={cn(
                  'font-serif text-2xl font-bold',
                  isDark ? 'text-stone-100' : 'text-stone-800'
                )}
              >
                {t('title')}
              </h1>
              {/* Display conversation count with elegant styling */}

              <div
                className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {total > 0 ? t('totalCount', { total }) : t('noRecords')}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* 批量选择按钮 */}
              {total > 0 && (
                <button
                  onClick={handleToggleSelectionMode}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 font-serif text-sm font-medium',
                    'transition-all duration-200 ease-in-out',
                    'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
                    isSelectionMode
                      ? isDark
                        ? 'border border-stone-500 bg-stone-600 text-white shadow-md hover:bg-stone-500'
                        : 'border border-stone-400 bg-stone-200 text-stone-800 shadow-md hover:bg-stone-300'
                      : isDark
                        ? 'border border-stone-600 bg-stone-700 text-white hover:bg-stone-600'
                        : 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isSelectionMode ? t('exitSelection') : t('batchDelete')}
                </button>
              )}

              {/* 新对话按钮 */}
              <button
                onClick={handleNewChat}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 font-serif text-sm font-medium',
                  'transition-all duration-200 ease-in-out',
                  'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
                  isDark
                    ? 'border border-stone-600 bg-stone-700 text-white hover:bg-stone-600'
                    : 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('newChat')}
              </button>
            </div>
          </div>
        </div>

        {/* 搜索框 - 居中显示 */}
        <div className={cn('mx-auto mb-4 w-full', widthClass, paddingClass)}>
          <div className="relative w-full">
            <div
              className={cn(
                'absolute top-1/2 left-3 -translate-y-1/2 transform',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            >
              <Search className="h-4 w-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className={cn(
                'w-full rounded-lg py-2 pr-4 pl-10 font-serif text-sm',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                isDark
                  ? 'border border-stone-700 bg-stone-800 text-stone-200 focus:ring-stone-600 focus:ring-offset-stone-900'
                  : 'border border-stone-300 bg-white text-stone-800 focus:ring-stone-400 focus:ring-offset-stone-50'
              )}
            />
          </div>
        </div>

        {/* 选择操作栏 - 居中显示 */}
        <div className={cn('mx-auto w-full', widthClass, paddingClass)}>
          <HistorySelectionBar
            isSelectionMode={isSelectionMode}
            selectedCount={selectedConversations.size}
            totalCount={filteredConversations.length}
            onToggleSelectionMode={handleToggleSelectionMode}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBatchDelete={handleBatchDelete}
            onCancelSelection={handleCancelSelection}
            isDeleting={isBatchDeleting}
          />
        </div>
      </div>

      {/* 可滚动列表区域 - 独立滚动 */}
      <div className="flex-1 overflow-hidden">
        {/* 对话列表容器 */}
        <div
          className={cn(
            'h-full overflow-y-auto',
            widthClass,
            'mx-auto',
            paddingClass
          )}
        >
          <HistoryList
            conversations={filteredConversations}
            isLoading={isLoading}
            onConversationClick={handleConversationClick}
            searchQuery={searchQuery}
            total={total}
            onDelete={deleteConversation}
            onRename={renameConversation}
            onRefresh={refresh}
            isSelectionMode={isSelectionMode}
            selectedConversations={selectedConversations}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </div>

      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        isOpen={showBatchDeleteDialog}
        onClose={() => setShowBatchDeleteDialog(false)}
        onConfirm={handleBatchDeleteConfirm}
        title={t('batchDeleteDialog.title')}
        message={t('batchDeleteDialog.message', {
          count: selectedConversations.size,
        })}
        confirmText={t('batchDeleteDialog.confirmText')}
        cancelText={t('batchDeleteDialog.cancelText')}
        variant="danger"
        isLoading={isBatchDeleting}
      />
    </div>
  );
}
