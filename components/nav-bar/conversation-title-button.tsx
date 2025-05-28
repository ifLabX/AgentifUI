"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatStore } from '@lib/stores/chat-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { useAllConversations } from '@lib/hooks/use-all-conversations';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';

interface ConversationTitleButtonProps {
  className?: string;
}

export function ConversationTitleButton({ className }: ConversationTitleButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentConversationId } = useChatStore();
  const { isExpanded, isLocked, isHovering } = useSidebarStore();
  const { conversations, deleteConversation, renameConversation } = useAllConversations();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false);

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
  // 获取当前对话信息
  // --- END COMMENT ---
  const currentConversation = React.useMemo(() => {
    if (!currentConversationId) return null;
    
    return conversations.find(conv => 
      conv.id === currentConversationId || 
      conv.external_id === currentConversationId
    );
  }, [conversations, currentConversationId]);

  const conversationTitle = currentConversation?.title || '新对话';
  
  // --- BEGIN COMMENT ---
  // 动态隐藏策略：当sidebar悬停展开时隐藏，锁定展开时不隐藏
  // --- END COMMENT ---
  const shouldHide = isHovering && !isLocked;

  // --- BEGIN COMMENT ---
  // 处理重命名功能
  // --- END COMMENT ---
  const handleRename = async () => {
    if (!currentConversationId || !currentConversation) return;
    
    const newTitle = window.prompt('请输入新的对话名称', conversationTitle);
    if (!newTitle || newTitle.trim() === '') return;
    
    setIsOperating(true);
    try {
      const success = await renameConversation(currentConversationId, newTitle.trim());
      
      if (success) {
        // --- BEGIN COMMENT ---
        // 更新页面标题
        // --- END COMMENT ---
        const baseTitle = 'AgentifUI';
        document.title = `${newTitle.trim()} | ${baseTitle}`;
      } else {
        alert('重命名对话失败');
      }
    } catch (error) {
      console.error('重命名失败:', error);
      alert('操作出错，请稍后再试');
    } finally {
      setIsOperating(false);
      setIsOpen(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理删除功能
  // --- END COMMENT ---
  const handleDelete = async () => {
    if (!currentConversationId || !currentConversation) return;
    
    const confirmed = window.confirm(`确定要删除对话 "${conversationTitle}" 吗？此操作无法撤销。`);
    if (!confirmed) return;
    
    setIsOperating(true);
    try {
      const success = await deleteConversation(currentConversationId);
      
      if (success) {
        // --- BEGIN COMMENT ---
        // 删除成功后跳转到新对话页面
        // --- END COMMENT ---
        router.push('/chat/new');
      } else {
        alert('删除对话失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('操作出错，请稍后再试');
    } finally {
      setIsOperating(false);
      setIsOpen(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 条件渲染：只在历史对话页面且有当前对话ID时显示
  // --- END COMMENT ---
  if (!isHistoricalChatPage || !currentConversationId || !currentConversation) {
    return null;
  }

  return (
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
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "h-8 min-h-[2rem]",
          // --- BEGIN MODIFIED COMMENT ---
          // cursor控制：只有在下拉框关闭且未操作时显示pointer
          // --- END MODIFIED COMMENT ---
          !isOpen && !isOperating ? "cursor-pointer" : "",
          isDark 
            ? "hover:bg-stone-800/50 text-stone-300" 
            : "hover:bg-stone-100 text-stone-600"
        )}
      >
        {/* --- BEGIN MODIFIED COMMENT ---
        对话标题：移除左侧图标，只显示标题文本
        --- END MODIFIED COMMENT --- */}
        <span className={cn(
          "font-serif whitespace-nowrap",
          "flex items-center leading-none"
        )}>
          {conversationTitle}
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
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* --- BEGIN MODIFIED COMMENT ---
          下拉选项：完全模仿app-selector的样式和布局
          --- END MODIFIED COMMENT --- */}
          <div className={cn(
            "absolute top-full left-0 mt-1 min-w-[8rem] max-w-[16rem]",
            "rounded-md shadow-lg z-20",
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
                "w-full text-left px-3 py-2 text-sm font-serif",
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
              <Edit className="w-3.5 h-3.5 flex-shrink-0" />
              <span>重命名</span>
            </button>
            
            {/* 分隔线 */}
            <div className={cn(
              "h-px mx-1",
              isDark ? "bg-stone-600/50" : "bg-stone-300/50"
            )} />
            
            {/* 删除选项 */}
            <button
              onClick={handleDelete}
              disabled={isOperating}
              className={cn(
                "w-full text-left px-3 py-2 text-sm font-serif",
                "transition-colors duration-150 whitespace-nowrap",
                "flex items-center space-x-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // --- BEGIN MODIFIED COMMENT ---
                // 添加cursor pointer控制
                // --- END MODIFIED COMMENT ---
                !isOperating ? "cursor-pointer" : "",
                isDark 
                  ? "hover:bg-red-900/30 text-red-400 hover:text-red-300" 
                  : "hover:bg-red-50 text-red-600 hover:text-red-700"
              )}
            >
              <Trash className="w-3.5 h-3.5 flex-shrink-0" />
              <span>删除对话</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
} 