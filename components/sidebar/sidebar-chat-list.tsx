"use client"

import * as React from "react"
import { MessageSquare, ChevronDown, ChevronUp, Trash, Edit } from "lucide-react" // Removed Pin
import { SidebarButton } from "./sidebar-button"
import { SidebarChatIcon } from "./sidebar-chat-icon"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { MoreButton, DropdownMenu } from "@components/ui" // Removed PinButton
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
  // const pinnedChats = React.useMemo(() => { // Removed pinnedChats
  //   return conversations.filter(chat =>
  //     !chat.isPending && chat.metadata && typeof chat.metadata === 'object' && chat.metadata.isPinned === true
  //   );
  // }, [conversations]);
  
  const unpinnedChats = React.useMemo(() => { // This will now be all non-pending chats
    return conversations.filter(chat => !chat.isPending);
  }, [conversations]);
  
  const pendingChats = React.useMemo(() => {
    return conversations.filter(chat => chat.isPending === true);
  }, [conversations]);

  // Removed togglePin function
  
  // --- BEGIN COMMENT ---
  // 重命名会话
  // 显示一个简单的提示框让用户输入新名称
  // --- END COMMENT ---
  const handleRename = React.useCallback(async (chatId: string) => {
    const conversation = conversations.find(c => c.id === chatId); // chatId is Dify realId
    if (!conversation) return;

    const supabasePK = conversation.supabase_pk;

    // If supabase_pk is not available, it means the conversation isn't fully saved/synced yet for DB operations.
    // This check covers both pending items that haven't received their PK yet,
    // and potentially non-pending items if data is somehow inconsistent (though less likely).
    if (!supabasePK) {
      alert("对话数据正在同步中，请稍后再尝试重命名。");
      return;
    }
    
    // Now that we have supabasePK, we can proceed even if conversation.isPending might still be true
    // (due to UI cleanup lag for pending store). The operation targets the DB record.
    const newTitle = window.prompt('请输入新的会话名称', conversation.title || '新对话');
    if (!newTitle || newTitle.trim() === '') return;
    
    try {
      const { renameConversation } = await import('@lib/db/conversations');
      const success = await renameConversation(supabasePK, newTitle.trim()); // Use supabasePK
      if (success) {
        refresh();
      } else {
        console.error('重命名会话失败 for supabasePK:', supabasePK);
        alert('重命名会话失败。');
      }
    } catch (error) {
      console.error('重命名会话出错:', error);
      alert('操作出错，请稍后再试。');
    }
  }, [conversations, refresh]);
  
  // --- BEGIN COMMENT ---
  // 删除会话
  // 先进行确认，然后调用删除函数
  // --- END COMMENT ---
  const handleDelete = React.useCallback(async (chatId: string) => {
    const conversation = conversations.find(c => c.id === chatId); // chatId is Dify realId
    if (!conversation) return;

    const supabasePK = conversation.supabase_pk;

    if (!supabasePK) {
      alert("对话数据正在同步中，请稍后再尝试删除。");
      return;
    }
    
    // Proceed with supabasePK, even if conversation.isPending might be true.
    const confirmed = window.confirm(`确定要删除会话 "${conversation.title || '新对话'}" 吗？此操作无法撤销。`);
    if (!confirmed) return;
    
    try {
      const { deleteConversation } = await import('@lib/db/conversations');
      const success = await deleteConversation(supabasePK); // Use supabasePK
      if (success) {
        refresh();
        if (selectedId === chatId) { // chatId is Dify realId, selectedId is Dify realId
          const firstAvailableChat = conversations.find(c => c.id !== chatId && !c.isPending);
          if (firstAvailableChat) {
            onSelectChat(firstAvailableChat.id);
          } else {
            const anyOtherChat = conversations.find(c => c.id !== chatId);
            if (anyOtherChat) onSelectChat(anyOtherChat.id);
          }
        }
      } else {
        console.error('删除会话失败 for supabasePK:', supabasePK);
        alert('删除会话失败。');
      }
    } catch (error) {
      console.error('删除会话出错:', error);
      alert('操作出错，请稍后再试。');
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
              // Show MoreButton for pending chats that have a realId and are in a stable-ish state
              const showMoreButtonForPending = chat.id && !chat.id.startsWith('temp-') && !isLoading;
              
              return (
                <div className="flex items-center w-full group" key={chat.tempId || chat.id}>
                  <SidebarButton
                    icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                    text={chat.title || '新对话'}
                    active={isActive}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn("flex-1 mr-1", "truncate")} // Added truncate
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
                      {/* Display last message preview or relative time for more stable pending states */}
                      {(chat.pendingStatus === 'persisted_optimistic' || chat.pendingStatus === 'title_resolved' || chat.pendingStatus === 'failed') && chat.last_message_preview && (
                         <span className="text-xs text-stone-500 dark:text-stone-400 truncate w-full">
                           {chat.last_message_preview}
                         </span>
                      )}
                       <span className="text-xs text-stone-400 dark:text-stone-500">
                         {/* For pending items, created_at is 'now'. formatTime will show '刚刚' or similar */}
                         {formatTime(chat.created_at)}
                       </span>
                    </div>
                  </SidebarButton>
                  {showMoreButtonForPending && (
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreButton
                        id={`pending-chat-more-${chat.id}`}
                        tooltipText="更多选项"
                      />
                      <DropdownMenu id={`pending-chat-more-${chat.id}`}>
                        <DropdownMenu.Item
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => handleRename(chat.id)}
                          // Removed className that visually disables based on chat.isPending
                          // The handleRename function itself will alert if chat.isPending
                        >
                          重命名
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Item
                          icon={<Trash className="w-4 h-4" />}
                          danger
                          onClick={() => handleDelete(chat.id)}
                          // Removed className that visually disables based on chat.isPending
                          // The handleDelete function itself will alert if chat.isPending
                        >
                          删除聊天
                        </DropdownMenu.Item>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Removed Pinned Chats Section */}

      {/* "最近的会话" will now show all non-pending chats */}
      <div>
        <div className="space-y-1">
          {visibleUnpinnedChats.map(chat => (
            <div className="flex items-center w-full group" key={chat.id}>
              <SidebarButton
                icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                text={chat.title || '新对话'}
                active={chat.id === selectedId}
                onClick={() => onSelectChat(chat.id)}
                className={cn("flex-1 mr-1", "truncate")} // Added truncate
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
                  id={`unpinned-chat-more-${chat.id}`} // Changed id to be more specific
                  tooltipText="更多选项"
                />
                <DropdownMenu id={`unpinned-chat-more-${chat.id}`}>
                  {/* Removed Pin/Unpin Item */}
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