"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useAllConversations } from "@lib/hooks/use-all-conversations"
import { RecentsList } from "./recents-list"
import { useChatWidth } from "@lib/hooks/use-chat-width"
import { conversationEvents } from "@lib/hooks/use-combined-conversations"

// --- BEGIN COMMENT ---
// 历史对话页面组件
// 显示所有历史对话，支持搜索功能
// --- END COMMENT ---
export function Recents() {
  const { isDark } = useTheme()
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()
  const { widthClass, paddingClass } = useChatWidth()
  
  // --- BEGIN COMMENT ---
  // 获取所有历史对话列表，不限制数量
  // --- END COMMENT ---
  const { 
    conversations, 
    isLoading, 
    error, 
    total,
    refresh,
    deleteConversation,
    renameConversation
  } = useAllConversations()
  
  // --- BEGIN COMMENT ---
  // 监听全局对话数据更新事件
  // --- END COMMENT ---
  React.useEffect(() => {
    const unsubscribe = conversationEvents.subscribe(() => {
      refresh();
    });
    
    return () => {
      unsubscribe();
    };
  }, [refresh]);
  
  // --- BEGIN COMMENT ---
  // 处理搜索输入变化
  // --- END COMMENT ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  // --- BEGIN COMMENT ---
  // 过滤对话列表，根据搜索查询
  // --- END COMMENT ---
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations
    
    const query = searchQuery.toLowerCase().trim()
    return conversations.filter(conversation => 
      conversation.title?.toLowerCase().includes(query) ||
      conversation.last_message_preview?.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])
  
  // --- BEGIN COMMENT ---
  // 处理新对话按钮点击
  // --- END COMMENT ---
  const handleNewChat = () => {
    // 跳转到新对话页面
    router.push('/chat/new')
    
    // 重置状态
    setTimeout(() => {
      // 清理消息和重置状态
      useChatStore.getState().clearMessages()
      useChatStore.getState().setCurrentConversationId(null)
      useChatInputStore.getState().setIsWelcomeScreen(true)
      useChatTransitionStore.getState().setIsTransitioningToWelcome(true)
      useChatStore.getState().setIsWaitingForResponse(false)
      
      // 设置侧边栏选中状态 - 保持当前展开状态
      useSidebarStore.getState().selectItem('chat', null, true)
      
      // 设置标题
      document.title = '新对话 | AgentifUI'
    }, 100)
  }
  
  // --- BEGIN COMMENT ---
  // 处理对话项点击
  // --- END COMMENT ---
  const handleConversationClick = (id: string) => {
    router.push(`/chat/${id}`)
  }
  
  return (
    <div className={cn(
      "flex flex-col h-full w-full overflow-hidden",
      isDark ? "bg-stone-900" : "bg-white"
    )}>
      {/* 页面内容区域 - 使用与聊天页面相同的宽度和居中设置 */}
      <div className={cn(
        "flex flex-col flex-1 overflow-auto py-4",
        isDark ? "bg-stone-900" : "bg-stone-50"
      )}>
        {/* 标题和新对话按钮 - 居中显示 */}
        <div className={cn(
          "w-full mx-auto mb-6",
          widthClass, paddingClass
        )}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className={cn(
                "text-2xl font-bold font-serif",
                isDark ? "text-stone-100" : "text-stone-800"
              )}>
                历史对话
              </h1>
              {/* --- BEGIN COMMENT ---
              // 显示对话总数的美观文字
              // --- END COMMENT --- */}
              <div className={cn(
                "text-sm mt-1",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                {isLoading ? (
                  <span className="flex items-center">
                    <span className={cn(
                      "w-3 h-3 rounded-full animate-pulse mr-2 inline-block font-serif",
                      isDark ? "bg-stone-600" : "bg-stone-400"
                    )} />
                    正在加载对话记录...
                  </span>
                ) : total > 0 ? (
                  `共找到 ${total} 个历史对话`
                ) : (
                  "暂无历史对话记录"
                )}
              </div>
            </div>
            
            <button
              onClick={handleNewChat}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center text-sm font-medium",
                "transition-all duration-200 ease-in-out",
                "cursor-pointer", // 添加鼠标指针样式
                "hover:shadow-md hover:-translate-y-0.5", // 悬停时添加阴影和轻微上移效果
                isDark 
                  ? "bg-stone-700 hover:bg-stone-600 text-white border border-stone-600" 
                  : "bg-primary/10 hover:bg-primary/15 text-primary border border-stone-300/50"
              )}
            >
              <Plus className="h-4 w-4 mr-2" />
              新对话
            </button>
          </div>
        </div>
        
        {/* 搜索框 - 居中显示 */}
        <div className={cn(
          "w-full mx-auto mb-10", // 增加底部间距，为后续添加内容预留空间
          widthClass, paddingClass
        )}>
          <div className="relative w-full">
            <div className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="搜索历史对话..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={cn(
                "w-full py-2 pl-10 pr-4 rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDark 
                  ? "bg-stone-800 text-stone-200 border border-stone-700 focus:ring-stone-600 focus:ring-offset-stone-900" 
                  : "bg-white text-stone-800 border border-stone-300 focus:ring-stone-400 focus:ring-offset-stone-50"
              )}
            />
          </div>
        </div>
        
        {/* 对话列表 - 居中显示 */}
        <div className={cn(
          "w-full mx-auto",
          widthClass, paddingClass
        )}>
          <RecentsList 
            conversations={filteredConversations}
            isLoading={isLoading}
            onConversationClick={handleConversationClick}
            searchQuery={searchQuery}
            total={total}
            onDelete={deleteConversation}
            onRename={renameConversation}
            onRefresh={refresh}
          />
        </div>
      </div>
    </div>
  )
}
