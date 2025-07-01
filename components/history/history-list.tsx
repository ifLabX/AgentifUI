'use client';

import { ConfirmDialog, InputDialog } from '@components/ui';
import { DropdownMenu } from '@components/ui/dropdown-menu';
import { conversationEvents } from '@lib/hooks/use-combined-conversations';
import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { useTheme } from '@lib/hooks/use-theme';
import { useDropdownStore } from '@lib/stores/ui/dropdown-store';
import { Conversation } from '@lib/types/database';
import { cn } from '@lib/utils';
import {
  Clock,
  Edit,
  MessageSquare,
  MoreHorizontal,
  Pen,
  Search,
  Trash,
} from 'lucide-react';

import * as React from 'react';

import { useFormatter, useTranslations } from 'next-intl';

// --- BEGIN COMMENT ---
// 历史对话列表组件
// 显示对话列表，支持搜索、删除、重命名等功能和多选功能
// --- END COMMENT ---
interface HistoryListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onConversationClick: (id: string) => void;
  searchQuery: string;
  total: number;
  onDelete: (conversationId: string) => Promise<boolean>;
  onRename: (conversationId: string, newTitle: string) => Promise<boolean>;
  onRefresh: () => void;
  isSelectionMode?: boolean;
  selectedConversations?: Set<string>;
  onSelectConversation?: (id: string, selected: boolean) => void;
}

// --- BEGIN COMMENT ---
// 历史对话列表组件
// 确保组件正确返回 React 元素
// --- END COMMENT ---
export function HistoryList({
  conversations,
  isLoading,
  onConversationClick,
  searchQuery,
  total,
  onDelete,
  onRename,
  onRefresh,
  isSelectionMode = false,
  selectedConversations = new Set(),
  onSelectConversation,
}: HistoryListProps): React.ReactElement {
  const { isDark } = useTheme();
  const t = useTranslations('history');
  const format = useFormatter();
  const { formatDate } = useDateFormatter();

  // --- BEGIN COMMENT ---
  // Dialog状态管理
  // --- END COMMENT ---
  const [showRenameDialog, setShowRenameDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isOperating, setIsOperating] = React.useState(false);
  const [selectedConversation, setSelectedConversation] =
    React.useState<Conversation | null>(null);

  // --- BEGIN COMMENT ---
  // 移除滚动加载更多功能，因为现在加载所有对话
  // --- END COMMENT ---

  // --- BEGIN COMMENT ---
  // 处理重命名对话
  // --- END COMMENT ---
  const handleRename = async (conversation: Conversation) => {
    if (!conversation.id) return;

    setSelectedConversation(conversation);
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async (newTitle: string) => {
    if (!selectedConversation?.id) return;

    setIsOperating(true);
    try {
      const success = await onRename(selectedConversation.id, newTitle.trim());

      if (success) {
        // --- BEGIN COMMENT ---
        // 重命名成功后，刷新列表以显示新标题
        // 标题管理由DynamicTitle组件统一处理，无需手动设置
        // --- END COMMENT ---

        // 刷新列表以显示新标题
        onRefresh();
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        setShowRenameDialog(false);
      } else {
        alert(t('operations.renameFailed'));
      }
    } catch (error) {
      alert(t('operations.error'));
    } finally {
      setIsOperating(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理删除对话
  // --- END COMMENT ---
  const handleDelete = async (conversation: Conversation) => {
    if (!conversation.id) return;

    setSelectedConversation(conversation);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConversation?.id) return;

    setIsOperating(true);
    try {
      const success = await onDelete(selectedConversation.id);

      if (success) {
        // 刷新列表以更新显示
        onRefresh();
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        setShowDeleteDialog(false);
      } else {
        alert(t('operations.deleteFailed'));
      }
    } catch (error) {
      alert(t('operations.error'));
    } finally {
      setIsOperating(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理对话项点击，包含标题设置逻辑
  // --- END COMMENT ---
  const handleConversationItemClick = (conversation: Conversation) => {
    const conversationId = conversation.external_id || conversation.id || '';
    const title = conversation.title || t('newChat');
    const baseTitle = 'AgentifUI';
    const fullTitle = `${title} | ${baseTitle}`;

    // 调用父组件的点击处理函数
    onConversationClick(conversationId);
  };

  // --- BEGIN COMMENT ---
  // 渲染对话项
  // --- END COMMENT ---
  const renderConversationItem = (conversation: Conversation) => {
    const title = conversation.title || t('newChat');
    const preview = conversation.last_message_preview || t('noMessagePreview');
    const date = conversation.updated_at
      ? formatDate(conversation.updated_at, DateFormatPresets.dateTime)
      : '';
    const conversationId = conversation.id;
    const isSelected = conversationId
      ? selectedConversations.has(conversationId)
      : false;

    // --- BEGIN COMMENT ---
    // 处理选择复选框点击事件
    // --- END COMMENT ---
    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (conversationId && onSelectConversation) {
        onSelectConversation(conversationId, !isSelected);
      }
    };

    // --- BEGIN COMMENT ---
    // 处理项目点击事件，在选择模式下切换选择状态，否则正常跳转
    // --- END COMMENT ---
    const handleItemClick = () => {
      if (isSelectionMode && conversationId && onSelectConversation) {
        onSelectConversation(conversationId, !isSelected);
      } else {
        handleConversationItemClick(conversation);
      }
    };

    return (
      <div
        key={conversation.id}
        className={cn(
          'group relative flex cursor-pointer items-start rounded-lg p-4',
          'transition-all duration-200 ease-in-out',
          // 在选择模式下，选中的项目有不同的样式
          isSelectionMode &&
            isSelected &&
            (isDark
              ? 'border-stone-500 bg-stone-700/40'
              : 'border-stone-400 bg-stone-100'),
          // 普通悬停样式
          !isSelected &&
            (isDark
              ? 'border border-stone-600 hover:border-stone-500 hover:bg-stone-700/50'
              : 'border border-stone-300 hover:border-stone-400 hover:bg-stone-200/70'),
          // 选中状态的边框
          isSelected &&
            (isDark ? 'border border-stone-500' : 'border border-stone-400'),
          !isSelected &&
            (isDark ? 'border border-stone-600' : 'border border-stone-300'),
          'mb-3'
        )}
        onClick={handleItemClick}
      >
        {/* --- 左侧选择区域 --- */}
        {(isSelectionMode || isSelected) && (
          <div className="mt-1 mr-3 flex items-center">
            <button
              onClick={handleCheckboxClick}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border-2',
                'transition-all duration-200 ease-in-out',
                'hover:scale-110',
                isSelected
                  ? isDark
                    ? 'border-stone-600 bg-stone-600 text-white'
                    : 'border-stone-500 bg-stone-500 text-white'
                  : isDark
                    ? 'border-stone-600 hover:border-stone-500'
                    : 'border-stone-400 hover:border-stone-500'
              )}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* --- 右侧内容区域 --- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 标题和日期 */}
          <div className="mb-2 flex items-center justify-between">
            <h3
              className={cn(
                'truncate font-serif text-base font-medium',
                isDark ? 'text-stone-100' : 'text-stone-800'
              )}
            >
              {title}
            </h3>

            <div className="flex items-center">
              <span
                className={cn(
                  'font-serif text-xs',
                  isDark ? 'text-stone-500' : 'text-stone-500'
                )}
              >
                {date}
              </span>

              {/* 更多操作按钮 - 在选择模式下隐藏 */}
              {!isSelectionMode && (
                <div
                  className={cn('ml-2', 'transition-opacity duration-200')}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={e => {
                      const dropdownId = `history-dropdown-${conversation.id}`;
                      const buttonRect =
                        e.currentTarget.getBoundingClientRect();
                      // --- BEGIN COMMENT ---
                      // 调整下拉菜单的位置，向左偏移一点，确保完全可见
                      // --- END COMMENT ---
                      const position = {
                        top: buttonRect.bottom + 5, // 向下偏移5px，增加间距
                        left: buttonRect.left - 120, // 向左偏移，使菜单在按钮下方居中显示
                      };
                      useDropdownStore
                        .getState()
                        .toggleDropdown(dropdownId, position);
                    }}
                    className={cn(
                      'rounded-md p-1 transition-all duration-200 ease-in-out',
                      'cursor-pointer',
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/5',
                      'hover:scale-110',
                      isDark ? 'active:bg-white/20' : 'active:bg-black/10',
                      'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                    )}
                    data-more-button-id={`history-dropdown-${conversation.id}`}
                    aria-label={t('moreOptions')}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {/* 下拉菜单内容 */}
                  <DropdownMenu
                    id={`history-dropdown-${conversation.id}`}
                    minWidth={150}
                    className={cn(
                      isDark
                        ? 'border border-stone-700 bg-stone-800'
                        : 'border border-stone-200 bg-white',
                      'overflow-hidden rounded-md shadow-lg' // 增加阴影和圆角
                    )}
                  >
                    <DropdownMenu.Item
                      icon={<Pen className="h-3.5 w-3.5" />}
                      onClick={() => handleRename(conversation)}
                      className="cursor-pointer"
                    >
                      {t('rename')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      icon={<Trash className="h-3.5 w-3.5" />}
                      danger
                      onClick={() => handleDelete(conversation)}
                      className="cursor-pointer"
                    >
                      {t('delete')}
                    </DropdownMenu.Item>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {/* 预览内容 */}
          <p
            className={cn(
              'line-clamp-2 font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {preview}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 移除内部滚动容器，直接渲染内容 */}
      {isLoading && conversations.length === 0 ? (
        // 加载状态
        <div className="flex flex-col space-y-4 pt-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-24 animate-pulse rounded-lg',
                isDark ? 'bg-stone-800' : 'bg-stone-200'
              )}
            />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        // 空状态
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center py-16',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          {searchQuery ? (
            <>
              <Search className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">{t('noSearchResults')}</p>
              <p className="mt-2 text-sm">{t('searchHint')}</p>
            </>
          ) : (
            <>
              <MessageSquare className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">{t('noHistoryTitle')}</p>
              <p className="mt-2 text-sm">{t('noHistoryDesc')}</p>
            </>
          )}
        </div>
      ) : (
        // 对话列表
        <div className="flex flex-col pt-2 pb-6">
          {conversations.map(renderConversationItem)}

          {/* --- BEGIN COMMENT ---
          // 显示对话总数信息，在列表底部
          // --- END COMMENT --- */}
          {conversations.length > 0 && (
            <div
              className={cn(
                'mt-4 flex items-center justify-center border-t py-6',
                isDark
                  ? 'border-stone-600 text-stone-500'
                  : 'border-stone-300 text-stone-500'
              )}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span className="text-sm">
                {searchQuery
                  ? t('searchResults', { count: conversations.length })
                  : t('totalRecords', { total })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* --- BEGIN COMMENT ---
      重命名对话框
      --- END COMMENT --- */}
      <InputDialog
        isOpen={showRenameDialog}
        onClose={() => !isOperating && setShowRenameDialog(false)}
        onConfirm={handleRenameConfirm}
        title={t('renameDialog.title')}
        label={t('renameDialog.label')}
        placeholder={t('renameDialog.placeholder')}
        defaultValue={selectedConversation?.title || t('newChat')}
        confirmText={t('renameDialog.confirmText')}
        isLoading={isOperating}
        maxLength={50}
      />

      {/* --- BEGIN COMMENT ---
      删除确认对话框
      --- END COMMENT --- */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => !isOperating && setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', {
          title: selectedConversation?.title || t('newChat'),
        })}
        confirmText={t('deleteDialog.confirmText')}
        variant="danger"
        icon="delete"
        isLoading={isOperating}
      />
    </>
  );
}
