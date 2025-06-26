"use client"

import * as React from "react"
import { MessageSquare, ChevronDown, ChevronUp, Trash, Edit, Clock, Pen } from "lucide-react"
import { SidebarListButton } from "./sidebar-list-button" // 使用新的 SidebarListButton 组件
import { SidebarChatIcon } from "./sidebar-chat-icon"
// import { ChatSkeleton } from "./chat-skeleton"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useMobile } from "@lib/hooks/use-mobile"
import { useCombinedConversations, CombinedConversation, conversationEvents } from "@lib/hooks/use-combined-conversations"
import { useRouter } from "next/navigation"
// formatDistanceToNow and zhCN are not needed if we only show title
// import { formatDistanceToNow } from "date-fns" 
// import { zhCN } from "date-fns/locale" 
import { MoreButtonV2 } from "@components/ui/more-button-v2" 
import { DropdownMenuV2 } from "@components/ui/dropdown-menu-v2"
import { TypeWriter } from "@components/ui/typewriter"
import { usePendingConversationStore } from "@lib/stores/pending-conversation-store"
import { ConfirmDialog, InputDialog } from '@components/ui'
import { useThemeColors } from '@lib/hooks/use-theme-colors'

interface SidebarChatListProps {
  isDark: boolean
  contentVisible: boolean
  selectedId: string | null
  onSelectChat: (chatId: string) => void
  clickingChatId?: string | null
}

export function SidebarChatList({ 
  isDark, 
  contentVisible,
  selectedId,
  onSelectChat,
  clickingChatId = null
}: SidebarChatListProps) {
  const { isExpanded } = useSidebarStore() 
  const isMobile = useMobile()
  const router = useRouter()
  const { colors } = useThemeColors()
  const { 
    conversations, 
    isLoading: isLoadingConversations, 
    error, 
    refresh 
  } = useCombinedConversations()
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：打字机效果相关Actions
  // --- END COMMENT ---
  const updateTypewriterDisplay = usePendingConversationStore((state) => state.updateTypewriterDisplay);
  const completeTitleTypewriter = usePendingConversationStore((state) => state.completeTitleTypewriter);
  
  // --- BEGIN COMMENT ---
  // Dialog状态管理
  // --- END COMMENT ---
  const [showRenameDialog, setShowRenameDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isOperating, setIsOperating] = React.useState(false);
  const [selectedConversation, setSelectedConversation] = React.useState<CombinedConversation | null>(null);
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：下拉菜单状态管理
  // 记录当前打开的下拉菜单对应的对话ID
  // --- END COMMENT ---
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
  
  const [prevLoadedConversations, setPrevLoadedConversations] = React.useState<CombinedConversation[]>([]);
  
  // --- BEGIN COMMENT ---
  // 当对话列表成功加载时，保存当前状态
  // --- END COMMENT ---
  React.useEffect(() => {
    if (!isLoadingConversations && conversations.length > 0) {
      setPrevLoadedConversations(conversations);
    }
  }, [isLoadingConversations, conversations]);
  
  // --- BEGIN COMMENT ---
  // 🎯 检测对话列表变化，识别被挤出的对话（瞬间消失效果）
  // --- END COMMENT ---
  React.useEffect(() => {
    const prevIds = new Set(prevLoadedConversations.map(conv => conv.id));
    const currentIds = new Set(conversations.map(conv => conv.id));
    
    // 找出在之前列表中存在但在当前列表中不存在的对话ID
    const disappearedIds = Array.from(prevIds).filter(id => !currentIds.has(id));
    
    if (disappearedIds.length > 0) {
      console.log(`[SidebarChatList] 🎯 检测到${disappearedIds.length}个对话被挤出:`, disappearedIds);
      // 瞬间挤出效果：对话直接从列表中消失
    }
  }, [conversations, prevLoadedConversations]);
  
  // --- BEGIN COMMENT ---
  // 🎯 显示逻辑：直接显示当前对话列表（瞬间挤出效果）
  // --- END COMMENT ---
  const displayConversations = React.useMemo(() => {
    return (isLoadingConversations && conversations.length === 0 && prevLoadedConversations.length > 0) 
      ? prevLoadedConversations 
      : conversations;
  }, [isLoadingConversations, conversations, prevLoadedConversations]);
  
  const unpinnedChats = React.useMemo(() => {
    return displayConversations.filter(chat => !chat.isPending);
  }, [displayConversations]);
  
  const pendingChats = React.useMemo(() => {
    return displayConversations.filter(chat => chat.isPending === true);
  }, [displayConversations]);
  
  // --- BEGIN COMMENT ---
  // 使用数据库中的历史对话，默认已经限制为20个
  // 使用 useSidebarConversations 获取的对话列表已经限制为20个
  // --- END COMMENT ---
  const visibleUnpinnedChats = unpinnedChats;
  
  // --- BEGIN COMMENT ---
  // 判断是否有更多历史对话（超过20个）
  // 使用 useCombinedConversations 返回的 total 属性
  // --- END COMMENT ---
  const hasMoreChats = displayConversations.length === 20 || unpinnedChats.length === 20;
  
  const handleRename = React.useCallback(async (chatId: string) => {
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    
    setSelectedConversation(conversation);
    setShowRenameDialog(true);
  }, [conversations]);
  
  const handleRenameConfirm = React.useCallback(async (newTitle: string) => {
    if (!selectedConversation) return;
    
    const supabasePK = selectedConversation.supabase_pk;
    if (!supabasePK) {
      alert("对话数据正在同步中，请稍后再尝试重命名。");
      setShowRenameDialog(false);
      return;
    }
    
    setIsOperating(true);
    try {
      const { renameConversation } = await import('@lib/db/conversations');
      const result = await renameConversation(supabasePK, newTitle.trim());
      
      if (result.success) {
        // --- BEGIN COMMENT ---
        // 重命名成功后直接更新页面标题，无需刷新页面
        // --- END COMMENT ---
        if (selectedId === selectedConversation.id) {
          const baseTitle = 'AgentifUI';
          document.title = `${newTitle.trim()} | ${baseTitle}`;
        }
        
        refresh();
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        setShowRenameDialog(false);
      } else {
        console.error('重命名对话失败:', result.error);
        alert('重命名会话失败。');
      }
    } catch (error) {
      console.error('重命名对话操作出错:', error);
      alert('操作出错，请稍后再试。');
    } finally {
      setIsOperating(false);
    }
  }, [selectedConversation, selectedId, refresh]);
  
  const handleDelete = React.useCallback(async (chatId: string) => {
    const conversation = conversations.find(c => c.id === chatId);
    if (!conversation) return;
    
    setSelectedConversation(conversation);
    setShowDeleteDialog(true);
  }, [conversations]);
  
  const handleDeleteConfirm = React.useCallback(async () => {
    if (!selectedConversation) return;
    
    const supabasePK = selectedConversation.supabase_pk;
    if (!supabasePK) {
      alert("对话数据正在同步中，请稍后再尝试删除。");
      setShowDeleteDialog(false);
      return;
    }
    
    setIsOperating(true);
    try {
      const { deleteConversation } = await import('@lib/db/conversations');
      const result = await deleteConversation(supabasePK);
      
      if (result.success) {
        refresh();
        // --- BEGIN COMMENT ---
        // 删除对话后直接路由到 /chat/new
        // --- END COMMENT ---
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        if (selectedId === selectedConversation.id) {
          window.location.href = '/chat/new';
        }
        setShowDeleteDialog(false);
      } else {
        console.error('删除对话失败:', result.error);
        alert('删除会话失败。');
      }
    } catch (error) {
      console.error('删除对话操作出错:', error);
      alert('操作出错，请稍后再试。');
    } finally {
      setIsOperating(false);
    }
  }, [selectedConversation, selectedId, refresh]);



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
    // 当路由以 /chat/ 开头时，才考虑聊天项的选中状态
    // 当路由是 /chat/history 时，不考虑聊天项的选中状态
    if (!pathname.startsWith('/chat/')) return false;
    if (pathname === '/chat/history') return false;
    
    // 直接ID匹配
    if (chat.id === selectedId) return true;
    
    // 临时ID匹配（处理从temp-xxx切换到正式ID的情况）
    if (chat.tempId && selectedId.includes(chat.tempId)) return true;
    
    // 确保不会有误匹配
    return false;
  }, [selectedId]);

  // --- BEGIN COMMENT ---
  // 🎯 处理侧边栏不可见时的打字机效果
  // 如果侧边栏内容不可见，但有待处理的打字机效果，直接完成它们
  // --- END COMMENT ---
  React.useEffect(() => {
    if (!contentVisible) {
      // 查找所有需要打字机效果的对话
      const chatsNeedingTypewriter = pendingChats.filter(chat => 
        chat.titleTypewriterState?.shouldStartTyping && 
        chat.titleTypewriterState?.targetTitle
      );
      
      // 直接完成所有打字机效果
      chatsNeedingTypewriter.forEach(chat => {
        completeTitleTypewriter(chat.id);
      });
    }
  }, [contentVisible, pendingChats, completeTitleTypewriter]);

  if (!contentVisible) return null;
  
  // --- BEGIN COMMENT ---
  // 🎯 修改渲染逻辑，集成TypeWriter组件实现打字机效果
  // 使用统一的结构和高度，避免切换时的布局跳动
  // 考虑到右侧 more button 的占位，确保骨架屏宽度适当
  // --- END COMMENT ---
  const renderChatItemContent = (chat: CombinedConversation, isItemLoading: boolean) => {
    const title = chat.title || '新对话';
    
    // --- BEGIN COMMENT ---
    // 🎯 检查是否需要使用打字机效果
    // --- END COMMENT ---
    const shouldUseTypewriter = chat.isPending && 
                               chat.titleTypewriterState?.shouldStartTyping && 
                               chat.titleTypewriterState?.targetTitle;
    
    // 所有状态下使用相同的高度和结构，确保一致性
    return (
      <div className="flex items-center h-4 w-full"> {/* 增加高度为 h-4，防止字母下降部被裁切 */}
        {isItemLoading ? (
          // 骨架屏 - 宽度设置为 w-[85%]，为右侧 more button 预留空间
          <div className={cn("h-4 w-[85%] animate-pulse rounded-md", isDark ? "bg-stone-600" : "bg-stone-400", "opacity-80")} />
        ) : shouldUseTypewriter ? (
          // --- BEGIN COMMENT ---
          // 🎯 使用TypeWriter组件显示打字机效果，包装在h4标签中以应用装饰字体
          // --- END COMMENT ---
          <h4 className={cn("truncate w-full text-xs leading-4 font-medium font-serif", isDark ? "text-gray-200" : "text-stone-700")}>
            <TypeWriter
              text={chat.titleTypewriterState!.targetTitle}
              speed={30} // 较快的打字速度
              delay={200} // 短暂延迟
              className="font-serif text-xs leading-4 font-medium"
              onComplete={() => {
                // --- BEGIN COMMENT ---
                // 🎯 打字完成后更新store状态
                // --- END COMMENT ---
                completeTitleTypewriter(chat.id);
              }}
            />
          </h4>
        ) : (
          // 标题文本 - 使用h4标签以应用装饰字体，与历史对话页面保持一致
          <h4 className={cn("truncate w-full text-xs leading-4 font-medium font-serif", isDark ? "text-gray-200" : "text-stone-700")}>{title}</h4>
        )}
      </div>
    );
  };
  
  // --- BEGIN COMMENT ---
  // 修改 createMoreActions 函数，确保临时 ID 和真正对话 ID 之间切换时布局保持一致
  // 对于临时 ID 的对话，返回禁用状态的 more button 而不是 null，保持布局一致
  // 优化下拉菜单样式，使其与整体主题更加协调
  // 🎯 新增：集成下拉菜单状态管理，实现解构效果
  // --- END COMMENT ---
  const createMoreActions = (chat: CombinedConversation, itemIsLoading: boolean) => {
    const canPerformActions = !!chat.supabase_pk;
    const isTempChat = !chat.id || chat.id.startsWith('temp-');
    const isMenuOpen = openDropdownId === chat.id;
    const isItemSelected = isChatActive(chat);
    
    // --- BEGIN COMMENT ---
    // 🎯 处理下拉菜单状态变化
    // --- END COMMENT ---
    const handleMenuOpenChange = (isOpen: boolean) => {
      setOpenDropdownId(isOpen ? chat.id : null);
    };
    
    return (
      <DropdownMenuV2
        placement="bottom"
        minWidth={120}
        isOpen={isMenuOpen}
        onOpenChange={handleMenuOpenChange}
        trigger={
          <MoreButtonV2
            aria-label="更多选项"
            disabled={itemIsLoading || !canPerformActions || isTempChat}
            isMenuOpen={isMenuOpen}
            isItemSelected={isItemSelected}
            disableHover={!!openDropdownId && !isMenuOpen}
            className={cn(
              "transition-opacity",
              itemIsLoading || !canPerformActions || isTempChat ? "opacity-50" : ""
            )}
          />
        }
      >
        <DropdownMenuV2.Item
          icon={<Pen className="w-3.5 h-3.5" />}
          onClick={() => handleRename(chat.id)}
          disabled={itemIsLoading || !canPerformActions || isTempChat}
        >
          重命名
        </DropdownMenuV2.Item>
        <DropdownMenuV2.Item
          icon={<Trash className="w-3.5 h-3.5" />}
          danger
          onClick={() => handleDelete(chat.id)}
          disabled={itemIsLoading || !canPerformActions || isTempChat}
        >
          删除对话
        </DropdownMenuV2.Item>
      </DropdownMenuV2>
    );
  };

  // --- BEGIN COMMENT ---
  // 判断是否显示骨架屏
  // 只有在首次加载或强制刷新时才显示骨架屏
  // 如果有上一次成功加载的对话列表，则使用缓存的列表，避免闪烁
  // --- END COMMENT ---
  // const showSkeleton = isLoadingConversations && conversations.length === 0 && prevLoadedConversations.length === 0;
  // const showSkeleton = false;

  // --- BEGIN COMMENT ---
  // 🎯 修复：当没有对话时完全隐藏，与常用应用保持一致
  // --- END COMMENT ---
  const hasAnyConversations = pendingChats.length > 0 || visibleUnpinnedChats.length > 0
  
  if (!isLoadingConversations && !hasAnyConversations) {
    return null
  }

  return (
    <>
      <div className="flex flex-col space-y-1">
        {/* --- BEGIN COMMENT ---
        // 近期对话粘性标题栏：模仿常用应用的样式，添加粘性定位
        // --- END COMMENT --- */}
        <div className={cn(
          "sticky top-0 z-40 flex items-center px-2 py-1 ml-[6px] text-xs font-medium font-serif",
          // --- BEGIN COMMENT ---
          // 使用与sidebar相同的背景色，确保粘性效果完美
          // 确保z-index足够高，完全覆盖下方内容
          // --- END COMMENT ---
          colors.sidebarBackground.tailwind
        )}>
          <span className={cn(
            "text-xs font-medium font-serif leading-none",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            近期对话
          </span>
        </div>
        
        {/* 显示骨架屏 */}
        {/* {showSkeleton && <ChatSkeleton isDark={isDark} count={5} />} */}
        
        {/* --- 待处理对话列表 --- */}
        {pendingChats.length > 0 && (
          <div className="mb-1.5 pt-1"> {/* 减小底部边距，添加顶部间距 */}
            <div className="space-y-0.5 px-3"> {/* 减小列表项之间的间距 */}
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
                  <div 
                    className="group relative"
                    key={chat.tempId || chat.id}
                  > 
                    {/* 使用新的 SidebarListButton 替代 SidebarButton */}
                    <SidebarListButton
                      icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                      active={isActive}
                      onClick={() => onSelectChat(chat.id)}
                      isLoading={itemIsLoading}
                      hasOpenDropdown={openDropdownId === chat.id}
                      disableHover={!!openDropdownId}
                      moreActionsTrigger={
                        <div className={cn(
                          "transition-opacity",
                          // --- BEGIN COMMENT ---
                          // 🎯 当有菜单打开时，禁用group-hover效果，避免其他item的more button在悬停时显示
                          // 但当前打开菜单的item的more button应该保持显示
                          // --- END COMMENT ---
                          itemIsLoading 
                            ? "pointer-events-none" // 禁用交互但保持占位
                            : openDropdownId === chat.id
                              ? "opacity-100" // 当前打开菜单的item，more button保持显示
                              : openDropdownId 
                                ? "opacity-0" // 有其他菜单打开时，此item的more button不显示
                                : "opacity-0 group-hover:opacity-100 focus-within:opacity-100" // 正常状态下的悬停显示
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
        <div className="pt-1"> {/* 添加顶部间距，与粘性标题分离 */}
          <div className="space-y-0.5 px-3"> {/* 减小列表项之间的间距 */}
            {visibleUnpinnedChats.map(chat => {
              // --- BEGIN COMMENT ---
              // 使用辅助函数判断项目是否应该处于选中状态
              // 处理已保存对话的选中逻辑，确保精确匹配
              // --- END COMMENT ---
              const isActive = isChatActive(chat);
              // 🎯 新增：检查当前对话是否正在点击中
              const isClicking = clickingChatId === chat.id;
              // 🎯 修复：点击状态不应该影响内容渲染，只影响图标显示
              const itemIsLoading = false; 

                                            return (
                <div 
                  className="group relative"
                  key={chat.id}
                >
                    {/* 使用新的 SidebarListButton 替代 SidebarButton */}
                    <SidebarListButton
                      icon={<SidebarChatIcon size="sm" isDark={isDark} />}
                      active={isActive}
                      onClick={() => onSelectChat(chat.id)}
                      isLoading={isClicking}
                      hasOpenDropdown={openDropdownId === chat.id}
                      disableHover={!!openDropdownId || isClicking}
                      moreActionsTrigger={
                        <div className={cn(
                          "transition-opacity",
                          // --- BEGIN COMMENT ---
                          // 🎯 当有菜单打开时，禁用group-hover效果，避免其他item的more button在悬停时显示
                          // 但当前打开菜单的item的more button应该保持显示
                          // --- END COMMENT ---
                          isClicking
                            ? "opacity-0 pointer-events-none" // 🎯 点击时隐藏more button，避免干扰
                            : openDropdownId === chat.id
                              ? "opacity-100" // 当前打开菜单的item，more button保持显示
                              : openDropdownId 
                                ? "opacity-0" // 有其他菜单打开时，此item的more button不显示
                                : "opacity-0 group-hover:opacity-100 focus-within:opacity-100" // 正常状态下的悬停显示
                        )}>
                        {createMoreActions(chat, itemIsLoading)}
                      </div>
                    }
                    >
                      {renderChatItemContent(chat, itemIsLoading)}
                    </SidebarListButton>
                  </div>
                );
            })}
            
            {/* --- BEGIN COMMENT ---
            🎯 移除查看全部历史按钮，已提升到Header区域
            --- END COMMENT --- */}
          </div>
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      重命名对话框
      --- END COMMENT --- */}
      <InputDialog
        isOpen={showRenameDialog}
        onClose={() => !isOperating && setShowRenameDialog(false)}
        onConfirm={handleRenameConfirm}
        title="重命名对话"
        label="对话名称"
        placeholder="输入新的对话名称"
        defaultValue={selectedConversation?.title || '新对话'}
        confirmText="确认重命名"
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
        title="删除对话"
        message={`确定要删除会话 "${selectedConversation?.title || '新对话'}" 吗？此操作无法撤销。`}
        confirmText="确认删除"
        variant="danger"
        icon="delete"
        isLoading={isOperating}
      />
    </>
  );
}