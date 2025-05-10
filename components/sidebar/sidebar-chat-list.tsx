"use client"

import * as React from "react"
import { MessageSquare, ChevronDown, ChevronUp, Pin, Trash, Edit } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { SidebarChatIcon } from "./sidebar-chat-icon"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { MoreButton, DropdownMenu, PinButton } from "@components/ui"
import { useMobile } from "@lib/hooks/use-mobile"

// Sample data - Passing isDark to SidebarChatIcon
const getChatHistory = (isDark: boolean) => [
  { id: 1, title: "网站开发指南", icon: <SidebarChatIcon size="sm" isDark={isDark} />, isPinned: false },
  { id: 2, title: "JavaScript最佳实践", icon: <SidebarChatIcon size="sm" isDark={isDark} />, isPinned: true },
  { id: 3, title: "React Hooks详解", icon: <SidebarChatIcon size="sm" isDark={isDark} />, isPinned: false },
  { id: 4, title: "Grid与Flexbox比较", icon: <SidebarChatIcon size="sm" isDark={isDark} />, isPinned: false },
  { id: 5, title: "TypeScript技巧", icon: <SidebarChatIcon size="sm" isDark={isDark} />, isPinned: false },
  { id: 6, title: "Next.js App Router", icon: <SidebarChatIcon size="sm" isDark={isDark} />, isPinned: false },
];

interface SidebarChatListProps {
  isDark: boolean
  contentVisible: boolean
  /** 当前选中的聊天ID */
  selectedId: string | number | null
  /** 选中聊天项的回调函数 */
  onSelectChat: (chatId: string | number) => void
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
  const { lockExpanded } = useSidebarStore()
  const isMobile = useMobile()
  const [showAllChats, setShowAllChats] = React.useState(false)
  
  // Get chat history based on current theme
  const chatHistory = React.useMemo(() => getChatHistory(isDark), [isDark]);

  const [pinnedChats, setPinnedChats] = React.useState(() => chatHistory.filter(chat => chat.isPinned));
  const [unpinnedChats, setUnpinnedChats] = React.useState(() => chatHistory.filter(chat => !chat.isPinned));

  // Update state when chatHistory changes (due to theme change)
  React.useEffect(() => {
    setPinnedChats(chatHistory.filter(chat => chat.isPinned));
    setUnpinnedChats(chatHistory.filter(chat => !chat.isPinned));
  }, [chatHistory]);

  // 根据是否展示全部聊天记录决定显示哪些未固定的聊天
  const visibleUnpinnedChats = showAllChats ? unpinnedChats : unpinnedChats.slice(0, 3);

  const toggleShowAllChats = () => {
    setShowAllChats(!showAllChats)
    lockExpanded() // Keep sidebar expanded when toggling
  }

  const handlePinChat = (chatId: number | string, isPinned: boolean) => {
    // 找到要修改的聊天
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    // 更新聊天的固定状态
    chat.isPinned = isPinned;
    
    // 重新计算固定和未固定的聊天列表
    setPinnedChats(chatHistory.filter(c => c.isPinned));
    setUnpinnedChats(chatHistory.filter(c => !c.isPinned));
  }

  const handleRenameChat = (chatId: number | string) => {
    console.log("重命名聊天:", chatId);
    // 这里可以添加重命名聊天的逻辑
  }

  const handleDeleteChat = (chatId: number | string) => {
    console.log("删除聊天:", chatId);
    // 这里可以添加删除聊天的逻辑
  }

  // 渲染单个聊天项
  const renderChatItem = (chat: typeof chatHistory[0]) => (
    <div key={chat.id} className="group relative flex items-center">
      <SidebarButton
        icon={chat.icon}
        text={chat.title}
        active={selectedId === chat.id}
        className="w-full pr-8 group"
        onClick={() => onSelectChat(chat.id)}
      />
      
      {/* 更多按钮 - 确保在移动端也能正确显示 */}
      <div className={cn(
        "absolute right-1 top-1/2 -translate-y-1/2",
        // 确保在移动端点击区域更大
        isMobile && "w-8 h-8 flex items-center justify-center"
      )}>
        <MoreButton 
          id={`chat-more-${chat.id}`}
          className={cn(
            // 移除group-hover控制，由MoreButton内部处理
            selectedId === chat.id && "opacity-100"
          )}
          tooltipText="聊天选项"
        />
      </div>
      
      {/* 对应的下拉菜单 */}
      <DropdownMenu id={`chat-more-${chat.id}`}>
        <DropdownMenu.Item
          icon={<Pin className="w-4 h-4" />}
          onClick={() => handlePinChat(chat.id, !chat.isPinned)}
        >
          {chat.isPinned ? "取消固定" : "固定聊天"}
        </DropdownMenu.Item>
        
        <DropdownMenu.Item
          icon={<Edit className="w-4 h-4" />}
          onClick={() => handleRenameChat(chat.id)}
        >
          重命名
        </DropdownMenu.Item>
        
        <DropdownMenu.Divider />
        
        <DropdownMenu.Item
          icon={<Trash className="w-4 h-4" />}
          danger
          onClick={() => handleDeleteChat(chat.id)}
        >
          删除聊天
        </DropdownMenu.Item>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-2 px-3">
      <div className={cn(
        "pl-1 pr-3 mb-2 text-sm font-semibold uppercase flex items-center gap-2 tracking-wider",
        "text-gray-600 dark:text-gray-200"
      )}>
        <span>对话列表</span>
      </div>
      
      <div className="space-y-1">
        {/* 固定的聊天 */}
        {pinnedChats.length > 0 && (
          <>
            {pinnedChats.map(renderChatItem)}
            {unpinnedChats.length > 0 && <div className="my-2 border-t border-gray-200/80 dark:border-gray-700/50" />}
          </>
        )}
        
        {/* 未固定的聊天 */}
        {visibleUnpinnedChats.map(renderChatItem)}
        
        {/* More/Less Button - Cleaned up className overrides */}
        {unpinnedChats.length > 3 && (
          <SidebarButton
            icon={showAllChats 
              ? <ChevronUp className="h-4 w-4" /> 
              : <ChevronDown className="h-4 w-4" />
            }
            text={showAllChats ? "收起" : "显示更多"}
            className={cn(
              "w-full text-xs group font-medium",
              // Base text colors
              isDark ? "text-gray-300" : "text-gray-500",
              // Ensure base background is transparent, especially in dark mode
              "bg-transparent dark:bg-transparent", 
              // Explicitly set dark hover background override
              "dark:hover:bg-gray-700/60", 
              // Keep border/shadow overrides
              "border-none shadow-none"
            )}
            onClick={toggleShowAllChats}
          />
        )}
      </div>
    </div>
  )
} 