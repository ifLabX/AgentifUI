"use client"

import * as React from "react"
import { MessageSquare, ChevronDown, ChevronUp, Pin, Trash, Edit } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { SidebarChatIcon } from "./sidebar-chat-icon"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { MoreButton, DropdownMenu, PinButton } from "@components/ui"
import { useMobile } from "@lib/hooks/use-mobile"
import { useCombinedConversations, CombinedConversation } from "@lib/hooks/use-combined-conversations"
import { Conversation } from "@lib/types/database"
import { format, formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface SidebarChatListProps {
  isDark: boolean
  contentVisible: boolean
  /** 当前选中的聊天ID */
  selectedId: string | null
  /** 选中聊天项的回调函数 */
  onSelectChat: (chatId: string) => void
}

/**
 * 侧边栏聊天列表组件
 * 
 * 显示用户的聊天历史记录，支持折叠/展开和项目选择
 */
export function SidebarChatList({ 
  isDark, 
  contentVisible,
  selectedId,
  onSelectChat 
}: SidebarChatListProps) {
  // 使用 useSidebarStore 获取侧边栏状态
  // 使用 useMobile 检测是否为移动设备
  // 使用 useCombinedConversations 获取整合后的会话列表（包含临时对话）
  const { lockExpanded } = useSidebarStore()
  const isMobile = useMobile()
  const [showAllChats, setShowAllChats] = React.useState(false)
  const { 
    conversations, 
    isLoading, 
    error, 
    refresh 
  } = useCombinedConversations()
  
  // --- BEGIN COMMENT ---
  // 将会话分类为固定、非固定和临时对话
  // 注意：
  // 1. 目前数据库中没有固定字段，我们使用元数据中的 isPinned 标记
  // 2. 临时对话通过 isPending 标记识别，不会被固定
  // --- END COMMENT ---
  const pinnedChats = React.useMemo(() => {
    return conversations.filter(chat => 
      !chat.isPending && chat.metadata && typeof chat.metadata === 'object' && chat.metadata.isPinned === true
    );
  }, [conversations]);
  
  const unpinnedChats = React.useMemo(() => {
    return conversations.filter(chat => 
      !chat.isPending && (!chat.metadata || typeof chat.metadata !== 'object' || chat.metadata.isPinned !== true)
    );
  }, [conversations]);
  
  const pendingChats = React.useMemo(() => {
    return conversations.filter(chat => chat.isPending === true);
  }, [conversations]);

  // --- BEGIN COMMENT ---
  // 切换会话的固定状态
  // 使用 updateConversationMetadata 函数更新会话的元数据
  // --- END COMMENT ---
  const togglePin = React.useCallback(async (chatId: string) => {
    // 查找当前会话
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    
    // 获取当前固定状态
    const isPinned = conversation.metadata?.isPinned === true;
    
    // 准备新的元数据
    const newMetadata = {
      ...conversation.metadata,
      isPinned: !isPinned
    };
    
    try {
      // 导入更新函数
      const { updateConversationMetadata } = await import('@lib/db/conversations');
      
      // 更新会话元数据
      const success = await updateConversationMetadata(chatId, newMetadata);
      
      if (success) {
        // 刷新会话列表
        refresh();
      } else {
        console.error('更新固定状态失败');
      }
    } catch (error) {
      console.error('切换固定状态出错:', error);
    }
  }, [conversations, refresh]);
  
  // --- BEGIN COMMENT ---
  // 重命名会话
  // 显示一个简单的提示框让用户输入新名称
  // --- END COMMENT ---
  const handleRename = React.useCallback(async (chatId: string) => {
    // 查找当前会话
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    
    // 显示提示框
    const newTitle = window.prompt('请输入新的会话名称', conversation.title || '新对话');
    
    // 如果用户取消或输入为空，则不进行操作
    if (!newTitle || newTitle.trim() === '') return;
    
    try {
      // 导入重命名函数
      const { renameConversation } = await import('@lib/db/conversations');
      
      // 重命名会话
      const success = await renameConversation(chatId, newTitle.trim());
      
      if (success) {
        // 刷新会话列表
        refresh();
      } else {
        console.error('重命名会话失败');
      }
    } catch (error) {
      console.error('重命名会话出错:', error);
    }
  }, [conversations, refresh]);
  
  // --- BEGIN COMMENT ---
  // 删除会话
  // 先进行确认，然后调用删除函数
  // --- END COMMENT ---
  const handleDelete = React.useCallback(async (chatId: string) => {
    // 查找当前会话
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    
    // 显示确认框
    const confirmed = window.confirm(`确定要删除会话 "${conversation.title || '新对话'}" 吗？此操作无法撤销。`);
    
    if (!confirmed) return;
    
    try {
      // 导入删除函数
      // 这里使用软删除函数，只是将状态改为 deleted
      const { deleteConversation } = await import('@lib/db/conversations');
      
      // 删除会话
      const success = await deleteConversation(chatId);
      
      if (success) {
        // 刷新会话列表
        refresh();
        
        // 如果当前选中的是这个会话，则选中第一个可用的会话
        if (selectedId === chatId) {
          const firstAvailableChat = conversations.find(c => c.id !== chatId);
          if (firstAvailableChat) {
            onSelectChat(firstAvailableChat.id);
          }
        }
      } else {
        console.error('删除会话失败');
      }
    } catch (error) {
      console.error('删除会话出错:', error);
    }
  }, [conversations, refresh, selectedId, onSelectChat]);

  // 显示有限的非固定会话
  const visibleUnpinnedChats = React.useMemo(() => {
    return showAllChats ? unpinnedChats : unpinnedChats.slice(0, 5);
  }, [unpinnedChats, showAllChats]);

  // 确定是否需要“显示更多”按钮
  const hasMoreChats = unpinnedChats.length > 5;

  // 如果内容不可见（侧边栏折叠），则不渲染任何内容
  if (!contentVisible) return null;

  // 即使正在加载或出错，也不显示特殊状态，保持界面简洁

  // 即使没有会话，也不显示空状态提示，而是直接显示标题

  // 格式化时间的辅助函数
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      {/* 近期对话标题 */}
      <div className="flex items-center px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400">
        <MessageSquare size={14} className="mr-1.5" />
        近期对话
      </div>
      
      {/* 临时对话部分 */}
      {pendingChats.length > 0 && (
        <div className="mb-2">
          <div className="space-y-1">
            {pendingChats.map(chat => {
              // --- BEGIN MODIFIED COMMENT ---
              // 根据 pendingStatus 确定是否显示骨架屏
              // 即使在加载状态下也保留悬停和选中效果
              // --- END MODIFIED COMMENT ---
              const isLoading = chat.pendingStatus === 'creating' || 
                               chat.pendingStatus === 'title_fetching' || 
                               chat.pendingStatus === 'streaming_message';
              
              // --- BEGIN MODIFIED COMMENT ---
              // 检查是否是当前选中的对话，或者是否应该显示为选中状态
              // --- END MODIFIED COMMENT ---
              const isActive = chat.id === selectedId;
              
              return (
                <div className="flex items-center w-full group" key={chat.tempId || chat.id}>
                  <SidebarButton
                    icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                    text={chat.title || '新对话'}
                    active={isActive}
                    onClick={() => onSelectChat(chat.id)}
                    className="flex-1 mr-1"
                    isLoading={isLoading}
                  >
                    <div className="flex flex-col items-start overflow-hidden ml-2">
                      {chat.pendingStatus === 'streaming_message' && (
                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate w-full">
                          正在生成回答...
                        </span>
                      )}
                      {chat.pendingStatus === 'title_fetching' && (
                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate w-full">
                          正在生成标题...
                        </span>
                      )}
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        刚刚
                      </span>
                    </div>
                  </SidebarButton>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 固定的会话部分 */}
      {pinnedChats.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Pin size={14} className="mr-1.5" />
            固定的聊天
          </div>
          <div className="space-y-1">
            {pinnedChats.map(chat => (
              <div className="flex items-center w-full group" key={chat.id}>
                <SidebarButton
                  icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                  text={chat.title || '新对话'}
                  active={chat.id === selectedId}
                  onClick={() => onSelectChat(chat.id)}
                  className="flex-1 mr-1"
                >
                  <div className="flex flex-col items-start overflow-hidden ml-2">
                    {chat.last_message_preview && (
                      <span className="text-xs text-stone-500 dark:text-stone-400 truncate w-full">
                        {chat.last_message_preview}
                      </span>
                    )}
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {formatTime(chat.updated_at)}
                    </span>
                  </div>
                </SidebarButton>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreButton
                    id={`pinned-chat-${chat.id}`}
                    tooltipText="更多选项"
                  />
                  <DropdownMenu id={`pinned-chat-${chat.id}`}>
                    <DropdownMenu.Item
                      icon={<Pin className="w-4 h-4" />}
                      onClick={() => togglePin(chat.id)}
                    >
                      取消固定
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => handleRename(chat.id)}
                    >
                      重命名
                    </DropdownMenu.Item>
                    <DropdownMenu.Divider />
                    <DropdownMenu.Item
                      icon={<Trash className="w-4 h-4" />}
                      danger
                      onClick={() => handleDelete(chat.id)}
                    >
                      删除聊天
                    </DropdownMenu.Item>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近的会话部分 */}
      <div>
        <div className="space-y-1">
          {visibleUnpinnedChats.map(chat => (
            <div className="flex items-center w-full group" key={chat.id}>
              <SidebarButton
                icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                text={chat.title || '新对话'}
                active={chat.id === selectedId}
                onClick={() => onSelectChat(chat.id)}
                className="flex-1 mr-1"
                isLoading={false}
              >
                <div className="flex flex-col items-start overflow-hidden ml-2">
                  {chat.last_message_preview && (
                    <span className="text-xs text-stone-500 dark:text-stone-400 truncate w-full">
                      {chat.last_message_preview}
                    </span>
                  )}
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {formatTime(chat.updated_at)}
                  </span>
                </div>
              </SidebarButton>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreButton
                  id={`pinned-chat-${chat.id}`}
                  tooltipText="更多选项"
                />
                <DropdownMenu id={`pinned-chat-${chat.id}`}>
                  <DropdownMenu.Item
                    icon={<Pin className="w-4 h-4" />}
                    onClick={() => togglePin(chat.id)}
                  >
                    取消固定
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => handleRename(chat.id)}
                  >
                    重命名
                  </DropdownMenu.Item>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    icon={<Trash className="w-4 h-4" />}
                    danger
                    onClick={() => handleDelete(chat.id)}
                  >
                    删除聊天
                  </DropdownMenu.Item>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {/* 显示更多/更少按钮 */}
          {hasMoreChats && (
            <button
              onClick={() => setShowAllChats(!showAllChats)}
              className={cn(
                "flex items-center justify-center w-full px-3 py-1.5 text-xs",
                "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100",
                "transition-colors"
              )}
            >
              {showAllChats ? (
                <>
                  <ChevronUp size={14} className="mr-1.5" />
                  显示更少
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="mr-1.5" />
                  显示更多 ({unpinnedChats.length - visibleUnpinnedChats.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}