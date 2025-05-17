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
        // --- BEGIN COMMENT ---
        // 重命名成功后直接更新页面标题，无需刷新页面
        // --- END COMMENT ---
        if (selectedId === chatId) {
          const baseTitle = 'if-agent-ui';
          document.title = `${newTitle.trim()} | ${baseTitle}`;
        }
        
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
        // --- BEGIN COMMENT ---
        // 删除对话后直接路由到 /chat/new
        // --- END COMMENT ---
        if (selectedId === chatId) {
          window.location.href = '/chat/new';
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
  
  // --- BEGIN COMMENT ---
  // 修改渲染逻辑，确保骨架屏和标题状态下按钮尺寸一致
  // 使用统一的结构和高度，避免切换时的布局跳动
  // 考虑到右侧 more button 的占位，确保骨架屏宽度适当
  // --- END COMMENT ---
  const renderChatItemContent = (chat: CombinedConversation, isItemLoading: boolean) => {
    const title = chat.title || '新对话';
    
    // 所有状态下使用相同的高度和结构，确保一致性
    return (
      <div className="flex items-center h-4 w-full"> {/* 固定高度为 h-4，宽度为 w-full */}
        {isItemLoading && isExpanded ? (
          // 骨架屏 - 宽度设置为 w-[85%]，为右侧 more button 预留空间
          <div className={cn("h-4 w-[85%] animate-pulse rounded-md", isDark ? "bg-stone-600" : "bg-stone-400", "opacity-80")} />
        ) : (
          // 标题文本 - 使用 text-xs 和 leading-4 确保文本高度合适
          <span className={cn("truncate w-full text-xs leading-4", isDark ? "text-gray-200" : "text-stone-700")}>{title}</span>
        )}
      </div>
    );
  };
  
  // --- BEGIN COMMENT ---
  // 修改 createMoreActions 函数，确保临时 ID 和真正对话 ID 之间切换时布局保持一致
  // 对于临时 ID 的对话，返回禁用状态的 more button 而不是 null，保持布局一致
  // --- END COMMENT ---
  const createMoreActions = (chat: CombinedConversation, itemIsLoading: boolean) => {
    const canPerformActions = !!chat.supabase_pk;
    const isTempChat = !chat.id || chat.id.startsWith('temp-');
    
    // 无论是临时 ID 还是真正的对话 ID，都返回 more button 组件，保持布局一致
    return (
      <DropdownMenuV2
        placement="bottom"
        alignToTriggerBottom={true}
        minWidth={150}
        contentClassName={cn(isDark ? "bg-stone-800" : "bg-white")}
        trigger={
          <MoreButtonV2
            aria-label="更多选项"
            disabled={itemIsLoading || !canPerformActions || isTempChat}
          />
        }
      >
        <DropdownMenuV2.Item
          icon={<Edit className="w-3.5 h-3.5" />}
          onClick={() => handleRename(chat.id)}
          disabled={itemIsLoading || !canPerformActions || isTempChat}
        >
          重命名
        </DropdownMenuV2.Item>
        <DropdownMenuV2.Divider />
        <DropdownMenuV2.Item
          icon={<Trash className="w-3.5 h-3.5" />}
          danger
          onClick={() => handleDelete(chat.id)}
          disabled={itemIsLoading || !canPerformActions || isTempChat}
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
                        <div className={cn(
                          "transition-opacity",
                          // 加载状态下显示占位，但禁用交互
                          itemIsLoading 
                            ? "pointer-events-none" // 禁用交互但保持占位
                            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100" // 非加载状态下正常显示
                        )}>
                           {/* 无论是否加载，都显示 more button，确保布局一致 */}
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