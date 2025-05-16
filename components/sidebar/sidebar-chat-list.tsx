"use client"

import * as React from "react"
import { MessageSquare, ChevronDown, ChevronUp, Trash, Edit } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { SidebarChatIcon } from "./sidebar-chat-icon"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useMobile } from "@lib/hooks/use-mobile"
import { useCombinedConversations, CombinedConversation } from "@lib/hooks/use-combined-conversations"
// formatDistanceToNow and zhCN are not needed if we only show title
// import { formatDistanceToNow } from "date-fns" 
// import { zhCN } from "date-fns/locale" 
import { MoreButtonV2 } from "@components/ui/more-button-v2" 
import { DropdownMenuV2 } from "@components/ui/dropdown-menu-v2"

interface SidebarChatListProps {
  isDark: boolean
  contentVisible: boolean
  selectedId: string | null
  onSelectChat: (chatId: string) => void
}

export function SidebarChatList({ 
  isDark, 
  contentVisible,
  selectedId,
  onSelectChat 
}: SidebarChatListProps) {
  const { isExpanded } = useSidebarStore() 
  const isMobile = useMobile()
  const [showAllChats, setShowAllChats] = React.useState(false)
  const { 
    conversations, 
    isLoading: isLoadingConversations, 
    error, 
    refresh 
  } = useCombinedConversations()
  
  const unpinnedChats = React.useMemo(() => {
    return conversations.filter(chat => !chat.isPending);
  }, [conversations]);
  
  const pendingChats = React.useMemo(() => {
    return conversations.filter(chat => chat.isPending === true);
  }, [conversations]);
  
  const handleRename = React.useCallback(async (chatId: string) => {
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    const supabasePK = conversation.supabase_pk;
    if (!supabasePK) {
      alert("对话数据正在同步中，请稍后再尝试重命名。");
      return;
    }
    const newTitle = window.prompt('请输入新的会话名称', conversation.title || '新对话');
    if (!newTitle || newTitle.trim() === '') return;
    try {
      const { renameConversation } = await import('@lib/db/conversations');
      const success = await renameConversation(supabasePK, newTitle.trim());
      if (success) {
        refresh();
      } else {
        alert('重命名会话失败。');
      }
    } catch (error) {
      alert('操作出错，请稍后再试。');
    }
  }, [conversations, refresh]);
  
  const handleDelete = React.useCallback(async (chatId: string) => {
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    const supabasePK = conversation.supabase_pk;
    if (!supabasePK) {
      alert("对话数据正在同步中，请稍后再尝试删除。");
      return;
    }
    const confirmed = window.confirm(`确定要删除会话 "${conversation.title || '新对话'}" 吗？此操作无法撤销。`);
    if (!confirmed) return;
    try {
      const { deleteConversation } = await import('@lib/db/conversations');
      const success = await deleteConversation(supabasePK);
      if (success) {
        refresh();
        if (selectedId === chatId) {
          const firstAvailableChat = conversations.find(c => c.id !== chatId && !c.isPending);
          if (firstAvailableChat) {
            onSelectChat(firstAvailableChat.id);
          } else {
            const anyOtherChat = conversations.find(c => c.id !== chatId);
            if (anyOtherChat) onSelectChat(anyOtherChat.id);
          }
        }
      } else {
        alert('删除会话失败。');
      }
    } catch (error) {
      alert('操作出错，请稍后再试。');
    }
  }, [conversations, refresh, selectedId, onSelectChat]);

  const visibleUnpinnedChats = React.useMemo(() => {
    return showAllChats ? unpinnedChats : unpinnedChats.slice(0, 5);
  }, [unpinnedChats, showAllChats]);

  const hasMoreChats = unpinnedChats.length > 5;

  if (!contentVisible) return null;
  
  const renderChatItemContent = (chat: CombinedConversation, isItemLoading: boolean) => {
    const title = chat.title || '新对话';
    
    // Only show skeleton if expanded and item is loading
    if (isItemLoading && isExpanded) { 
        return (
            // Simplified skeleton for a single line title
            <div className={cn("h-4 w-full animate-pulse rounded-md", isDark ? "bg-stone-600" : "bg-stone-400", "opacity-80")} />
        );
    }

    // Only show title, ensure it truncates
    return (
      <div className="overflow-hidden w-full"> {/* Added w-full here for better truncation control by parent */}
        <span className={cn("truncate w-full text-sm", isDark ? "text-gray-200" : "text-stone-700")}>{title}</span>
      </div>
    );
  };
  
  const createMoreActions = (chat: CombinedConversation, itemIsLoading: boolean) => {
    const canPerformActions = !!chat.supabase_pk;

    if (!chat.id || chat.id.startsWith('temp-')) return null;

    return (
      <DropdownMenuV2
        placement="bottom"
        alignToTriggerBottom={true}
        minWidth={150}
        contentClassName={cn(isDark ? "bg-stone-800" : "bg-white")}
        trigger={
          <MoreButtonV2
            aria-label="更多选项"
            disabled={itemIsLoading || !canPerformActions}
          />
        }
      >
        <DropdownMenuV2.Item
          icon={<Edit className="w-3.5 h-3.5" />}
          onClick={() => handleRename(chat.id)}
          disabled={itemIsLoading || !canPerformActions}
        >
          重命名
        </DropdownMenuV2.Item>
        <DropdownMenuV2.Divider />
        <DropdownMenuV2.Item
          icon={<Trash className="w-3.5 h-3.5" />}
          danger
          onClick={() => handleDelete(chat.id)}
          disabled={itemIsLoading || !canPerformActions}
        >
          删除聊天
        </DropdownMenuV2.Item>
      </DropdownMenuV2>
    );
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400">
        <MessageSquare size={14} className="mr-1.5" />
        近期对话
      </div>
      
      {pendingChats.length > 0 && (
        <div className="mb-2">
          <div className="space-y-1">
            {pendingChats.map(chat => {
              const itemIsLoading = chat.pendingStatus === 'creating' || 
                                 chat.pendingStatus === 'title_fetching' || 
                                 chat.pendingStatus === 'streaming_message';
              const isActive = chat.id === selectedId;
              
              return (
                <div className="group relative" key={chat.tempId || chat.id}> 
                  <SidebarButton
                    icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                    active={isActive}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn("w-full", !isExpanded && "justify-center")}
                    isLoading={itemIsLoading && !isExpanded}
                    moreActionsTrigger={
                       isExpanded ? (
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                           {createMoreActions(chat, itemIsLoading)}
                        </div>
                       ) : null
                    }
                  >
                    {isExpanded ? renderChatItemContent(chat, itemIsLoading) : null}
                  </SidebarButton>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div>
        <div className="space-y-1">
          {visibleUnpinnedChats.map(chat => {
            const isActive = chat.id === selectedId;
            const itemIsLoading = false; 

            return (
              <div className="group relative" key={chat.id}>
                <SidebarButton
                  icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                  active={isActive}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn("w-full", !isExpanded && "justify-center")}
                  isLoading={itemIsLoading && !isExpanded}
                  moreActionsTrigger={
                    isExpanded ? (
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {createMoreActions(chat, itemIsLoading)}
                      </div>
                    ) : null
                  }
                >
                  {isExpanded ? renderChatItemContent(chat, itemIsLoading) : null}
                </SidebarButton>
              </div>
            );
          })}
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
                <><ChevronUp size={14} className="mr-1.5" />显示更少</>
              ) : (
                <><ChevronDown size={14} className="mr-1.5" />显示更多 ({unpinnedChats.length - visibleUnpinnedChats.length})</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}