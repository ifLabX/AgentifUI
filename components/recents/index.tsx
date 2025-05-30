"use client"

import * as React from "react"
import { Search, Plus, Trash2 } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useAllConversations } from "@lib/hooks/use-all-conversations"
import { RecentsList } from "./recents-list"
import { RecentsSelectionBar } from "./recents-selection-bar"
import { useChatWidth } from "@lib/hooks/use-chat-width"
import { conversationEvents } from "@lib/hooks/use-combined-conversations"
import { ConfirmDialog } from "@components/ui"

// --- BEGIN COMMENT ---
// 历史对话页面组件
// 显示所有历史对话，支持搜索功能和多选删除功能
// --- END COMMENT ---
export function Recents() {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()
  const { widthClass, paddingClass } = useChatWidth()
  
  // --- BEGIN COMMENT ---
  // 多选功能状态管理
  // --- END COMMENT ---
  const [isSelectionMode, setIsSelectionMode] = React.useState(false)
  const [selectedConversations, setSelectedConversations] = React.useState<Set<string>>(new Set())
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = React.useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = React.useState(false)
  
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
  // 当对话列表发生变化时，清理无效的选中项
  // --- END COMMENT ---
  React.useEffect(() => {
    if (selectedConversations.size > 0) {
      const validIds = new Set(conversations.map(c => c.id).filter(Boolean) as string[])
      const validSelectedIds = new Set(
        Array.from(selectedConversations).filter(id => validIds.has(id))
      )
      
      if (validSelectedIds.size !== selectedConversations.size) {
        setSelectedConversations(validSelectedIds)
      }
      
      // 如果没有有效选中项，退出选择模式
      if (validSelectedIds.size === 0) {
        setIsSelectionMode(false)
      }
    }
  }, [conversations, selectedConversations])
  
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
  // 多选功能处理函数
  // --- END COMMENT ---
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      setSelectedConversations(new Set())
    }
  }
  
  const handleSelectConversation = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedConversations)
    if (selected) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedConversations(newSelected)
    
    // 如果选中了项目但不在选择模式，自动进入选择模式
    if (newSelected.size > 0 && !isSelectionMode) {
      setIsSelectionMode(true)
    }
  }
  
  const handleSelectAll = () => {
    const allIds = filteredConversations.map(c => c.id).filter(Boolean) as string[]
    setSelectedConversations(new Set(allIds))
    setIsSelectionMode(true)
  }
  
  const handleDeselectAll = () => {
    setSelectedConversations(new Set())
  }
  
  const handleCancelSelection = () => {
    setSelectedConversations(new Set())
    setIsSelectionMode(false)
  }
  
  const handleBatchDelete = () => {
    if (selectedConversations.size === 0) return
    setShowBatchDeleteDialog(true)
  }
  
  const handleBatchDeleteConfirm = async () => {
    setIsBatchDeleting(true)
    try {
      const deletePromises = Array.from(selectedConversations).map(id => 
        deleteConversation(id)
      )
      
      const results = await Promise.all(deletePromises)
      const successCount = results.filter(Boolean).length
      
      if (successCount > 0) {
        // 刷新列表
        refresh()
        // 触发全局同步事件
        conversationEvents.emit()
        
        // 清理选择状态
        setSelectedConversations(new Set())
        setIsSelectionMode(false)
        
        if (successCount < selectedConversations.size) {
          alert(`成功删除 ${successCount} 个对话，${selectedConversations.size - successCount} 个删除失败。`)
        }
      } else {
        alert('删除失败，请稍后再试。')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      alert('删除操作出错，请稍后再试。')
    } finally {
      setIsBatchDeleting(false)
      setShowBatchDeleteDialog(false)
    }
  }
  
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
    // 如果在选择模式下，不跳转，而是切换选择状态
    if (isSelectionMode) {
      const isSelected = selectedConversations.has(id)
      handleSelectConversation(id, !isSelected)
      return
    }
    
    router.push(`/chat/${id}`)
  }
  
  return (
    <div className={cn(
      "flex flex-col h-full w-full overflow-hidden",
      colors.mainBackground.tailwind
    )}>
      {/* 页面内容区域 - 使用与聊天页面相同的宽度和居中设置 */}
      <div className={cn(
        "flex flex-col flex-1 overflow-auto py-4",
        colors.mainBackground.tailwind
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
            
            <div className="flex items-center space-x-3">
              {/* 批量选择按钮 */}
              {total > 0 && (
                <button
                  onClick={handleToggleSelectionMode}
                  className={cn(
                    "px-3 py-2 rounded-lg flex items-center text-sm font-medium font-serif",
                    "transition-all duration-200 ease-in-out",
                    "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                    isSelectionMode
                      ? isDark
                        ? "bg-stone-600 hover:bg-stone-500 text-white border border-stone-500 shadow-md"
                        : "bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-400 shadow-md"
                      : isDark 
                        ? "bg-stone-700 hover:bg-stone-600 text-white border border-stone-600" 
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
                  )}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isSelectionMode ? "退出选择" : "批量删除"}
                </button>
              )}
              
              {/* 新对话按钮 */}
              <button
                onClick={handleNewChat}
                className={cn(
                  "px-4 py-2 rounded-lg flex items-center text-sm font-medium font-serif",
                  "transition-all duration-200 ease-in-out",
                  "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
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
        </div>
        
        {/* 搜索框 - 居中显示 */}
        <div className={cn(
          "w-full mx-auto mb-4",
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
                "w-full py-2 pl-10 pr-4 rounded-lg text-sm font-serif",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDark 
                  ? "bg-stone-800 text-stone-200 border border-stone-700 focus:ring-stone-600 focus:ring-offset-stone-900" 
                  : "bg-white text-stone-800 border border-stone-300 focus:ring-stone-400 focus:ring-offset-stone-50"
              )}
            />
          </div>
        </div>
        
        {/* 选择操作栏 - 居中显示 */}
        <div className={cn(
          "w-full mx-auto",
          widthClass, paddingClass
        )}>
          <RecentsSelectionBar
            isSelectionMode={isSelectionMode}
            selectedCount={selectedConversations.size}
            totalCount={filteredConversations.length}
            onToggleSelectionMode={handleToggleSelectionMode}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBatchDelete={handleBatchDelete}
            onCancelSelection={handleCancelSelection}
            isDeleting={isBatchDeleting}
          />
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
            isSelectionMode={isSelectionMode}
            selectedConversations={selectedConversations}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </div>
      
      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        isOpen={showBatchDeleteDialog}
        onClose={() => setShowBatchDeleteDialog(false)}
        onConfirm={handleBatchDeleteConfirm}
        title="批量删除对话"
        message={`确定要删除选中的 ${selectedConversations.size} 个对话吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={isBatchDeleting}
      />
    </div>
  )
}
