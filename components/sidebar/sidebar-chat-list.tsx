"use client"

import * as React from "react"
import { MessageSquare, ChevronDown, ChevronUp, Trash, Edit } from "lucide-react"
import { SidebarListButton } from "./sidebar-list-button" // 使用新的 SidebarListButton 组件
import { SidebarChatIcon } from "./sidebar-chat-icon"
import { ChatSkeleton } from "./chat-skeleton"
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
  
  // --- BEGIN COMMENT ---
  // 使用数据库中的历史对话，默认已经限制为5个
  // 使用 useSidebarConversations 获取的对话列表已经限制为5个
  // --- END COMMENT ---
  const visibleUnpinnedChats = unpinnedChats;
  
  // --- BEGIN COMMENT ---
  // 判断是否有更多历史对话（超过5个）
  // 使用 useCombinedConversations 返回的 total 属性
  // --- END COMMENT ---
  const hasMoreChats = conversations.length === 5 || unpinnedChats.length === 5;
  
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



  // --- BEGIN COMMENT ---
  // 添加辅助函数，判断聊天项是否应该处于选中状态
  // 考虑临时ID和正式ID之间的转换情况
  // --- END COMMENT ---
  // --- BEGIN COMMENT ---
  // 判断聊天项是否处于选中状态
  // 1. 检查当前路由是否是聊天页面
  // 2. 检查ID是否匹配（直接ID或临时ID）
  // 这样可以确保从聊天页面切换到其他页面时，聊天项不会保持选中状态
  // --- END COMMENT ---
  const isChatActive = React.useCallback((chat: CombinedConversation) => {
    // 首先检查是否有选中的ID
    if (!selectedId) return false;
    
    // 获取当前路由路径
    const pathname = window.location.pathname;
    
    // 检查当前路由是否是聊天页面
    // 只有当路由以 /chat/ 开头时，才考虑聊天项的选中状态
    if (!pathname.startsWith('/chat/')) return false;
    
    // 直接ID匹配
    if (chat.id === selectedId) return true;
    
    // 临时ID匹配（处理从temp-xxx切换到正式ID的情况）
    if (chat.tempId && selectedId.includes(chat.tempId)) return true;
    
    // 确保不会有误匹配
    return false;
  }, [selectedId]);

  if (!contentVisible) return null;
  
  // --- BEGIN COMMENT ---
  // 修改渲染逻辑，确保骨架屏和标题状态下按钮尺寸一致
  // 使用统一的结构和高度，避免切换时的布局跳动
  // 考虑到右侧 more button 的占位，确保骨架屏宽度适当
  // 优化显示效果，使用更美观的样式
  // --- END COMMENT ---
  const renderChatItemContent = (chat: CombinedConversation, isItemLoading: boolean) => {
    const title = chat.title || '新对话';
    
    // 所有状态下使用相同的高度和结构，确保一致性
    return (
      <div className="flex items-center h-3.5 w-full"> {/* 减小高度为 h-3.5，使其更纤细 */}
        {isItemLoading ? (
          // 骨架屏 - 宽度设置为 w-[85%]，为右侧 more button 预留空间
          <div className={cn("h-3.5 w-[85%] animate-pulse rounded-md", isDark ? "bg-stone-600" : "bg-stone-400", "opacity-80")} />
        ) : (
          // 标题文本 - 使用更小的文本大小和行高，使其更纤细
          <span className={cn("truncate w-full text-xs leading-3.5 font-medium", isDark ? "text-gray-200" : "text-stone-700")}>{title}</span>
        )}
      </div>
    );
  };
  
  // --- BEGIN COMMENT ---
  // 修改 createMoreActions 函数，确保临时 ID 和真正对话 ID 之间切换时布局保持一致
  // 对于临时 ID 的对话，返回禁用状态的 more button 而不是 null，保持布局一致
  // 优化下拉菜单样式，使其与整体主题更加协调
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
        contentClassName={cn(isDark ? "bg-stone-800 border border-stone-700" : "bg-white border border-stone-200")}
        trigger={
          <MoreButtonV2
            aria-label="更多选项"
            disabled={itemIsLoading || !canPerformActions || isTempChat}
            className={cn(
              "transition-opacity",
              itemIsLoading || !canPerformActions || isTempChat ? "opacity-50" : "opacity-100"
            )}
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

  // --- BEGIN COMMENT ---
  // 判断是否显示骨架屏
  // --- END COMMENT ---
  const showSkeleton = isLoadingConversations && conversations.length === 0;

  return (
    <div className="flex flex-col space-y-1">
      {/* --- 响应式标题栏 --- */}
      {/* 移动端：更紧凑的布局 */}
      {/* 桌面端：标准间距 */}
      <div className={cn(
        "flex items-center px-2.5 py-1 text-xs font-medium", /* 减小内边距，使其更紧凑 */
        isDark ? "text-stone-400" : "text-stone-500"
      )}>
        <MessageSquare size={12} className="mr-1.5" /> {/* 减小图标大小 */}
        近期对话
      </div>
      
      {/* 显示骨架屏 */}
      {showSkeleton && <ChatSkeleton isDark={isDark} count={5} />}
      
      {/* --- 待处理对话列表 --- */}
      {pendingChats.length > 0 && (
        <div className="mb-1.5"> {/* 减小底部边距 */}
          <div className="space-y-0.5 px-2"> {/* 减小列表项之间的间距 */}
            {pendingChats.map(chat => {
              const itemIsLoading = chat.pendingStatus === 'creating' || 
                                 chat.pendingStatus === 'title_fetching' || 
                                 chat.pendingStatus === 'streaming_message';
              // --- BEGIN COMMENT ---
              // 使用辅助函数判断项目是否应该处于选中状态
              // 处理临时ID和正式ID之间的转换情况
              // --- END COMMENT ---
              const isActive = isChatActive(chat);
              
              return (
                <div className="group relative" key={chat.tempId || chat.id}> 
                  {/* 使用新的 SidebarListButton 替代 SidebarButton */}
                  <SidebarListButton
                    icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                    active={isActive}
                    onClick={() => onSelectChat(chat.id)}
                    isLoading={itemIsLoading}
                    moreActionsTrigger={
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
                    }
                  >
                    {renderChatItemContent(chat, itemIsLoading)}
                  </SidebarListButton>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* --- 已保存对话列表 --- */}
      <div>
        <div className="space-y-0.5 px-2"> {/* 减小列表项之间的间距 */}
          {visibleUnpinnedChats.map(chat => {
            // --- BEGIN COMMENT ---
            // 使用辅助函数判断项目是否应该处于选中状态
            // 处理已保存对话的选中逻辑，确保精确匹配
            // --- END COMMENT ---
            const isActive = isChatActive(chat);
            const itemIsLoading = false; 

            return (
              <div className="group relative" key={chat.id}>
                {/* 使用新的 SidebarListButton 替代 SidebarButton */}
                <SidebarListButton
                  icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                  active={isActive}
                  onClick={() => onSelectChat(chat.id)}
                  isLoading={itemIsLoading}
                  moreActionsTrigger={
                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {createMoreActions(chat, itemIsLoading)}
                    </div>
                  }
                >
                  {renderChatItemContent(chat, itemIsLoading)}
                </SidebarListButton>
              </div>
            );
          })}
          
          {/* --- 查看全部按钮 --- */}
          {hasMoreChats && (
            <div className="mt-1">
              <SidebarListButton
                icon={<ChevronDown size={12} />}
                onClick={() => window.location.href = '/chat/recents'} /* 跳转到 /chat/recents 路由 */
                className={cn(
                  "w-full",
                  isDark 
                    ? "text-stone-400 hover:text-stone-300 hover:bg-stone-700/50" 
                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                )}
              >
                <span className="text-xs font-medium">查看全部</span>
              </SidebarListButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}