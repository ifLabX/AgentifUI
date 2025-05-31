"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useChatStore } from '@lib/stores/chat-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { useCombinedConversations, CombinedConversation, conversationEvents } from '@lib/hooks/use-combined-conversations';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Edit, Trash, Star, Blocks } from 'lucide-react';
import { ConfirmDialog, InputDialog } from '@components/ui';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useFavoriteAppsStore } from '@lib/stores/favorite-apps-store';

interface ConversationTitleButtonProps {
  className?: string;
}

export function ConversationTitleButton({ className }: ConversationTitleButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { currentConversationId } = useChatStore();
  const { isExpanded, isLocked, isHovering } = useSidebarStore();
  const { conversations, refresh } = useCombinedConversations();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  
  // --- BEGIN COMMENT ---
  // 应用相关状态
  // --- END COMMENT ---
  const { apps } = useAppListStore();
  const { favoriteApps, addFavoriteApp, removeFavoriteApp, isFavorite } = useFavoriteAppsStore();
  
  // --- BEGIN COMMENT ---
  // 模态框状态管理
  // --- END COMMENT ---
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // --- BEGIN COMMENT ---
  // 检查是否为历史对话页面：必须是 /chat/[conversationId] 格式，且不是 /chat/new
  // --- END COMMENT ---
  const isHistoricalChatPage = React.useMemo(() => {
    if (!pathname) return false;
    
    const chatMatch = pathname.match(/^\/chat\/(.+)$/);
    if (!chatMatch) return false;
    
    const conversationId = chatMatch[1];
    // 排除 /chat/new 页面
    return conversationId !== 'new' && conversationId !== 'recents';
  }, [pathname]);

  // --- BEGIN COMMENT ---
  // 检查是否为应用详情页面：/apps/[instanceId]/[appType] 格式
  // appType 可以是: agent, chatbot, text-generation, chatflow, workflow
  // --- END COMMENT ---
  const isAppDetailPage = React.useMemo(() => {
    if (!pathname) return false;
    const validAppTypes = ['agent', 'chatbot', 'text-generation', 'chatflow', 'workflow'];
    const match = pathname.match(/^\/apps\/([^\/]+)\/([^\/]+)$/);
    return match && validAppTypes.includes(match[2]);
  }, [pathname]);

  // --- BEGIN COMMENT ---
  // 获取当前应用信息（应用详情页面使用）
  // --- END COMMENT ---
  const currentApp = React.useMemo(() => {
    if (!isAppDetailPage || !params.instanceId) return null;
    return apps.find(app => app.instance_id === params.instanceId);
  }, [isAppDetailPage, params.instanceId, apps]);

  // --- BEGIN COMMENT ---
  // 获取当前对话信息 - 使用与sidebar相同的数据源，但添加备用机制
  // --- END COMMENT ---
  const currentConversation = React.useMemo(() => {
    if (!currentConversationId) return null;
    
    // 首先尝试从Combined Conversations中找到
    const foundInCombined = conversations.find(conv => 
      conv.id === currentConversationId || 
      conv.external_id === currentConversationId
    );
    
    if (foundInCombined) {
      return foundInCombined;
    }
    
    // --- BEGIN COMMENT ---
    // 如果在Combined Conversations中找不到，尝试从document.title中提取标题
    // 这样可以避免不必要的API调用，特别是从recents页面点击进来的情况
    // --- END COMMENT ---
    const getTitleFromDocument = () => {
      const docTitle = document.title;
      const baseTitle = 'AgentifUI';
      if (docTitle.includes(' | ') && docTitle.endsWith(` | ${baseTitle}`)) {
        return docTitle.replace(` | ${baseTitle}`, '');
      }
      return '对话'; // 默认标题
    };
    
    // 返回一个基础的对话对象，标题从document.title中获取
    return {
      id: currentConversationId,
      title: getTitleFromDocument(),
      external_id: currentConversationId,
      user_id: undefined,
      created_at: '',
      updated_at: '',
      isPending: false,
      supabase_pk: undefined // 这意味着无法进行重命名和删除操作，直到获取到真实数据
    } as CombinedConversation;
  }, [conversations, currentConversationId]);

  // --- BEGIN COMMENT ---
  // 当找到的对话没有supabase_pk时，静默在后台获取完整的对话信息（不显示loading）
  // --- END COMMENT ---
  const [fullConversationData, setFullConversationData] = React.useState<CombinedConversation | null>(null);
  
  React.useEffect(() => {
    if (currentConversation && !currentConversation.supabase_pk && currentConversationId) {
      // 静默在后台获取完整的对话信息，不显示loading状态
      const fetchFullConversation = async () => {
        try {
          const { getConversationByExternalId } = await import('@lib/db/conversations');
          const result = await getConversationByExternalId(currentConversationId);
          
          if (result.success && result.data) {
            const dbConversation = result.data;
            setFullConversationData({
              ...currentConversation,
              title: dbConversation.title || currentConversation.title, // 保留已有标题作为备选
              supabase_pk: dbConversation.id,
              user_id: dbConversation.user_id,
              created_at: dbConversation.created_at,
              updated_at: dbConversation.updated_at,
              org_id: dbConversation.org_id,
              ai_config_id: dbConversation.ai_config_id,
              summary: dbConversation.summary,
              settings: dbConversation.settings,
              status: dbConversation.status,
              app_id: dbConversation.app_id,
              last_message_preview: dbConversation.last_message_preview,
              metadata: dbConversation.metadata
            });
          }
        } catch (error) {
          console.error('获取对话信息失败:', error);
          // 失败时保持当前状态，不影响用户体验
        }
      };
      
      fetchFullConversation();
    } else {
      setFullConversationData(null);
    }
  }, [currentConversation, currentConversationId]);

  // 使用完整的对话数据（如果可用），否则使用基础对话数据
  const finalConversation = fullConversationData || currentConversation;
  const conversationTitle = finalConversation?.title || '新对话';
  
  // --- BEGIN COMMENT ---
  // 动态隐藏策略：当sidebar悬停展开时隐藏，锁定展开时不隐藏
  // --- END COMMENT ---
  const shouldHide = isHovering && !isLocked;

  // --- BEGIN COMMENT ---
  // 处理重命名功能 - 使用InputDialog组件
  // --- END COMMENT ---
  const handleRename = () => {
    setIsOpen(false);
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async (newTitle: string) => {
    if (!currentConversationId || !finalConversation) return;
    
    const supabasePK = finalConversation.supabase_pk;
    if (!supabasePK) {
      alert("正在获取对话详细信息，请稍后再尝试重命名。");
      setShowRenameDialog(false);
      return;
    }
    
    setIsOperating(true);
    try {
      const { renameConversation } = await import('@lib/db/conversations');
      const result = await renameConversation(supabasePK, newTitle.trim());
      
      if (result.success) {
        // --- BEGIN COMMENT ---
        // 重命名成功后更新页面标题
        // --- END COMMENT ---
        const baseTitle = 'AgentifUI';
        document.title = `${newTitle.trim()} | ${baseTitle}`;
        
        // 更新本地完整对话数据
        if (fullConversationData) {
          setFullConversationData({
            ...fullConversationData,
            title: newTitle.trim()
          });
        }
        
        // 刷新对话列表
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
  };

  // --- BEGIN COMMENT ---
  // 处理删除功能 - 使用ConfirmDialog组件
  // --- END COMMENT ---
  const handleDelete = () => {
    setIsOpen(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentConversationId || !finalConversation) return;
    
    const supabasePK = finalConversation.supabase_pk;
    if (!supabasePK) {
      alert("正在获取对话详细信息，请稍后再尝试删除。");
      setShowDeleteDialog(false);
      return;
    }
    
    setIsOperating(true);
    try {
      const { deleteConversation } = await import('@lib/db/conversations');
      const result = await deleteConversation(supabasePK);
      
      if (result.success) {
        // --- BEGIN COMMENT ---
        // 删除成功后跳转到新对话页面 - 与sidebar逻辑一致
        // --- END COMMENT ---
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        window.location.href = '/chat/new';
      } else {
        console.error('删除对话失败:', result.error);
        alert('删除会话失败。');
      }
    } catch (error) {
      console.error('删除对话操作出错:', error);
      alert('操作出错，请稍后再试。');
    } finally {
      setIsOperating(false);
      setShowDeleteDialog(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理应用收藏操作（应用详情页面使用）
  // --- END COMMENT ---
  const handleToggleFavorite = async () => {
    if (!currentApp) return;
    
    try {
      const instanceId = currentApp.instance_id;
      const appMetadata = currentApp.config?.app_metadata;
      
      if (isFavorite(instanceId)) {
        removeFavoriteApp(instanceId);
      } else {
        await addFavoriteApp({
          instanceId: currentApp.instance_id,
          displayName: currentApp.display_name || currentApp.instance_id,
          description: appMetadata?.brief_description || currentApp.description,
          iconUrl: appMetadata?.icon_url,
          appType: appMetadata?.app_type || 'marketplace'
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  // --- BEGIN COMMENT ---
  // 条件渲染：在历史对话页面显示对话标题，在应用详情页面显示应用信息
  // --- END COMMENT ---
  if (isAppDetailPage && currentApp) {
    // 应用详情页面渲染
    const appMetadata = currentApp.config?.app_metadata;
    const instanceId = currentApp.instance_id;
    
    return (
      <div className={cn(
        "flex items-center gap-3 transition-all duration-300 ease-in-out",
        shouldHide ? "opacity-0 -translate-x-2 pointer-events-none" : "opacity-100 translate-x-0",
        className
      )}>
        
        {/* 应用信息 */}
        <div className="min-w-0 flex-1">
          <h1 className={cn(
            "font-medium font-serif truncate text-sm",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            {currentApp.display_name || currentApp.instance_id}
          </h1>
          {appMetadata?.brief_description && (
            <p className={cn(
              "text-xs font-serif truncate",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              {appMetadata.brief_description}
            </p>
          )}
        </div>
        
        {/* 标签 */}
        {appMetadata?.tags && appMetadata.tags.length > 0 && (
          <div className="hidden lg:flex gap-1 flex-shrink-0">
            {appMetadata.tags.slice(0, 2).map((tag: string, index: number) => (
              <span
                key={index}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-serif",
                  isDark 
                    ? "bg-stone-700 text-stone-300" 
                    : "bg-stone-100 text-stone-700"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* 收藏按钮 */}
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "p-1.5 rounded-md transition-colors flex-shrink-0",
            isFavorite(instanceId)
              ? isDark
                ? "bg-stone-700 text-stone-300"
                : "bg-stone-200 text-stone-700"
              : isDark
                ? "hover:bg-stone-700 text-stone-500 hover:text-stone-300"
                : "hover:bg-stone-200 text-stone-400 hover:text-stone-600"
          )}
        >
          <Star className={cn(
            "w-3.5 h-3.5",
            isFavorite(instanceId) && "fill-current"
          )} />
        </button>
        
        {/* 应用市场按钮 */}
        <button
          onClick={() => router.push('/apps')}
          className={cn(
            "px-2 py-1 rounded-md transition-colors text-xs font-serif flex-shrink-0",
            isDark 
              ? "hover:bg-stone-700 text-stone-400 hover:text-stone-200" 
              : "hover:bg-stone-200 text-stone-600 hover:text-stone-900"
          )}
        >
          应用市场
        </button>
      </div>
    );
  }

  // --- BEGIN COMMENT ---
  // 历史对话页面渲染：只在历史对话页面且有当前对话ID时显示
  // --- END COMMENT ---
  if (!isHistoricalChatPage || !currentConversationId || !finalConversation) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "relative transition-all duration-300 ease-in-out",
        // --- BEGIN COMMENT ---
        // 动态隐藏策略：悬停时透明度降为0并稍微向左移动
        // --- END COMMENT ---
        shouldHide ? "opacity-0 -translate-x-2 pointer-events-none" : "opacity-100 translate-x-0",
        className
      )}>
        {/* --- BEGIN COMMENT ---
        主按钮：优化样式，移除左侧图标，添加cursor控制逻辑
        --- END COMMENT --- */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isOperating}
          className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-serif",
            "transition-all duration-200 ease-in-out",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "h-8 min-h-[2rem]",
            // --- BEGIN MODIFIED COMMENT ---
            // cursor控制：只有在下拉框关闭且未操作时显示pointer
            // --- END MODIFIED COMMENT ---
            !isOpen && !isOperating ? "cursor-pointer" : "",
            isDark 
              ? "hover:bg-stone-700/50 hover:shadow-stone-800/20 hover:shadow-sm text-stone-300 active:bg-stone-600/50" 
              : "hover:bg-stone-200/80 hover:shadow-stone-300/50 hover:shadow-sm text-stone-600 active:bg-stone-300/50"
          )}
        >
          {/* --- BEGIN MODIFIED COMMENT ---
          对话标题：显示标题文本，只在操作时显示loading状态
          --- END MODIFIED COMMENT --- */}
          <span className={cn(
            "font-serif whitespace-nowrap",
            "flex items-center leading-none"
          )}>
            {isOperating ? (
              <>
                <div className={cn(
                  "w-3 h-3 rounded-full animate-pulse mr-2 inline-block",
                  isDark ? "bg-stone-500" : "bg-stone-400"
                )} />
                加载中...
              </>
            ) : (
              conversationTitle
            )}
          </span>
          
          {/* --- BEGIN COMMENT ---
          右侧图标区域：显示v/反v
          --- END COMMENT --- */}
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </div>
        </button>

        {/* --- BEGIN COMMENT ---
        下拉菜单：完全模仿app-selector的样式
        --- END COMMENT --- */}
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 z-[90]" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* --- BEGIN MODIFIED COMMENT ---
            下拉选项：改为左侧对齐，避免与sidebar冲突，缩小横向宽度
            --- END MODIFIED COMMENT --- */}
            <div className={cn(
              "absolute top-full left-0 mt-1 min-w-[8rem] max-w-[12rem]",
              "rounded-md shadow-lg z-[95] overflow-hidden",
              "border",
              isDark 
                ? "bg-stone-700/95 border-stone-600/80 backdrop-blur-sm" 
                : "bg-stone-50/95 border-stone-300/80 backdrop-blur-sm"
            )}>
              {/* 重命名选项 */}
              <button
                onClick={handleRename}
                disabled={isOperating}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-serif",
                  "transition-colors duration-150 whitespace-nowrap",
                  "flex items-center space-x-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // --- BEGIN MODIFIED COMMENT ---
                  // 添加cursor pointer控制
                  // --- END MODIFIED COMMENT ---
                  !isOperating ? "cursor-pointer" : "",
                  isDark 
                    ? "hover:bg-stone-600/60 text-stone-300" 
                    : "hover:bg-stone-200/60 text-stone-600"
                )}
              >
                <Edit className="w-4 h-4 flex-shrink-0" />
                <span>重命名</span>
              </button>
              
              {/* 分隔线 */}
              <div className={cn(
                "h-px mx-2",
                isDark ? "bg-stone-600/50" : "bg-stone-300/50"
              )} />
              
              {/* 删除选项 */}
              <button
                onClick={handleDelete}
                disabled={isOperating}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-serif",
                  "transition-colors duration-150 whitespace-nowrap",
                  "flex items-center space-x-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // --- BEGIN MODIFIED COMMENT ---
                  // 添加cursor pointer控制
                  // --- END MODIFIED COMMENT ---
                  !isOperating ? "cursor-pointer" : "",
                  "mb-1",
                  isDark 
                    ? "hover:bg-red-900/30 text-red-400 hover:text-red-300" 
                    : "hover:bg-red-50 text-red-600 hover:text-red-700"
                )}
              >
                <Trash className="w-4 h-4 flex-shrink-0" />
                <span>删除对话</span>
              </button>
            </div>
          </>
        )}
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
        defaultValue={conversationTitle}
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
        message={`确定要删除会话 "${conversationTitle}" 吗？此操作无法撤销。`}
        confirmText="确认删除"
        variant="danger"
        icon="delete"
        isLoading={isOperating}
      />
    </>
  );
} 