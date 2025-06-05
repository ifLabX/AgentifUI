"use client"

import * as React from "react"
import { MessageSquare, Clock, Trash, Edit, Search, MoreHorizontal } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { Conversation } from "@lib/types/database"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"
import { DropdownMenu } from "@components/ui/dropdown-menu"
import { ConfirmDialog, InputDialog } from '@components/ui'
import { conversationEvents } from '@lib/hooks/use-combined-conversations'

// --- BEGIN COMMENT ---
// 历史对话列表组件
// 显示对话列表，支持搜索、删除、重命名等功能和多选功能
// --- END COMMENT ---
interface RecentsListProps {
  conversations: Conversation[]
  isLoading: boolean
  onConversationClick: (id: string) => void
  searchQuery: string
  total: number
  onDelete: (conversationId: string) => Promise<boolean>
  onRename: (conversationId: string, newTitle: string) => Promise<boolean>
  onRefresh: () => void
  isSelectionMode?: boolean
  selectedConversations?: Set<string>
  onSelectConversation?: (id: string, selected: boolean) => void
}

// --- BEGIN COMMENT ---
// 历史对话列表组件
// 确保组件正确返回 React 元素
// --- END COMMENT ---
export function RecentsList({
  conversations,
  isLoading,
  onConversationClick,
  searchQuery,
  total,
  onDelete,
  onRename,
  onRefresh,
  isSelectionMode = false,
  selectedConversations = new Set(),
  onSelectConversation
}: RecentsListProps): React.ReactElement {
  const { isDark } = useTheme()
  const listRef = React.useRef<HTMLDivElement>(null)
  
  // --- BEGIN COMMENT ---
  // Dialog状态管理
  // --- END COMMENT ---
  const [showRenameDialog, setShowRenameDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isOperating, setIsOperating] = React.useState(false);
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  
  // --- BEGIN COMMENT ---
  // 移除滚动加载更多功能，因为现在加载所有对话
  // --- END COMMENT ---
  
  // --- BEGIN COMMENT ---
  // 处理重命名对话
  // --- END COMMENT ---
  const handleRename = async (conversation: Conversation) => {
    if (!conversation.id) return
    
    setSelectedConversation(conversation);
    setShowRenameDialog(true);
  }
  
  const handleRenameConfirm = async (newTitle: string) => {
    if (!selectedConversation?.id) return;
    
    setIsOperating(true);
    try {
      const success = await onRename(selectedConversation.id, newTitle.trim());
      
      if (success) {
        // --- BEGIN COMMENT ---
        // 重命名成功后，如果当前页面标题包含旧标题，则更新为新标题
        // 与侧边栏聊天列表保持一致的逻辑
        // --- END COMMENT ---
        const currentTitle = document.title;
        const oldTitle = selectedConversation.title || '新对话';
        const baseTitle = 'AgentifUI';
        
        if (currentTitle.includes(oldTitle)) {
          document.title = `${newTitle.trim()} | ${baseTitle}`;
        }
        
        // 刷新列表以显示新标题
        onRefresh();
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        setShowRenameDialog(false);
      } else {
        alert('重命名会话失败。');
      }
    } catch (error) {
      alert('操作出错，请稍后再试。');
    } finally {
      setIsOperating(false);
    }
  }
  
  // --- BEGIN COMMENT ---
  // 处理删除对话
  // --- END COMMENT ---
  const handleDelete = async (conversation: Conversation) => {
    if (!conversation.id) return
    
    setSelectedConversation(conversation);
    setShowDeleteDialog(true);
  }
  
  const handleDeleteConfirm = async () => {
    if (!selectedConversation?.id) return;
    
    setIsOperating(true);
    try {
      const success = await onDelete(selectedConversation.id);
      
      if (success) {
        // 刷新列表以更新显示
        onRefresh();
        // --- BEGIN COMMENT ---
        // 触发全局同步事件，通知所有组件数据已更新
        // --- END COMMENT ---
        conversationEvents.emit();
        setShowDeleteDialog(false);
      } else {
        alert('删除会话失败。');
      }
    } catch (error) {
      alert('操作出错，请稍后再试。');
    } finally {
      setIsOperating(false);
    }
  }
  
  // --- BEGIN COMMENT ---
  // 格式化日期
  // --- END COMMENT ---
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } catch (e) {
      return dateString
    }
  }
  
  // --- BEGIN COMMENT ---
  // 处理对话项点击，包含标题设置逻辑
  // --- END COMMENT ---
  const handleConversationItemClick = (conversation: Conversation) => {
    const conversationId = conversation.external_id || conversation.id || ''
    const title = conversation.title || '新对话'
    const baseTitle = 'AgentifUI'
    const fullTitle = `${title} | ${baseTitle}`
    
    // --- BEGIN COMMENT ---
    // 立即设置页面标题
    // --- END COMMENT ---
    document.title = fullTitle
    
    // --- BEGIN COMMENT ---
    // 设置一个保护机制，防止其他组件在短时间内覆盖这个标题
    // 使用一个定时器来持续监控和保护标题
    // --- END COMMENT ---
    let protectionCount = 0
    const maxProtectionAttempts = 10 // 最多保护10次
    const protectionInterval = 100 // 每100ms检查一次
    
    const protectTitle = () => {
      if (protectionCount >= maxProtectionAttempts) {
        return // 停止保护
      }
      
      if (document.title !== fullTitle) {
        console.log(`[RecentsTitle] 检测到标题被覆盖，恢复为: ${fullTitle}`)
        document.title = fullTitle
      }
      
      protectionCount++
      setTimeout(protectTitle, protectionInterval)
    }
    
    // 开始保护标题
    setTimeout(protectTitle, protectionInterval)
    
    // 调用父组件的点击处理函数
    onConversationClick(conversationId)
  }
  
  // --- BEGIN COMMENT ---
  // 渲染对话项
  // --- END COMMENT ---
  const renderConversationItem = (conversation: Conversation) => {
    const title = conversation.title || '新对话'
    const preview = conversation.last_message_preview || '无消息预览'
    const date = conversation.updated_at ? formatDate(conversation.updated_at) : ''
    const conversationId = conversation.id
    const isSelected = conversationId ? selectedConversations.has(conversationId) : false
    
    // --- BEGIN COMMENT ---
    // 处理选择复选框点击事件
    // --- END COMMENT ---
    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (conversationId && onSelectConversation) {
        onSelectConversation(conversationId, !isSelected)
      }
    }
    
    // --- BEGIN COMMENT ---
    // 处理项目点击事件，在选择模式下切换选择状态，否则正常跳转
    // --- END COMMENT ---
    const handleItemClick = () => {
      if (isSelectionMode && conversationId && onSelectConversation) {
        onSelectConversation(conversationId, !isSelected)
      } else {
        handleConversationItemClick(conversation)
      }
    }
    
    return (
      <div 
        key={conversation.id} 
        className={cn(
          "flex items-start p-4 rounded-lg cursor-pointer group relative",
          "transition-all duration-200 ease-in-out",
          // 在选择模式下，选中的项目有不同的样式
          isSelectionMode && isSelected && (
            isDark 
              ? "bg-stone-700/40 border-stone-500" 
              : "bg-stone-100 border-stone-400"
          ),
          // 普通悬停样式
          !isSelected && (
            isDark 
              ? "hover:bg-stone-700/50 border border-stone-600 hover:border-stone-500" 
              : "hover:bg-stone-200/70 border border-stone-300 hover:border-stone-400"
          ),
          // 选中状态的边框
          isSelected && (
            isDark
              ? "border border-stone-500"
              : "border border-stone-400"
          ),
          !isSelected && (
            isDark 
              ? "border border-stone-600" 
              : "border border-stone-300"
          ),
          "mb-3"
        )}
        onClick={handleItemClick}
      >
        {/* --- 左侧选择区域 --- */}
        {(isSelectionMode || isSelected) && (
          <div className="flex items-center mr-3 mt-1">
            <button
              onClick={handleCheckboxClick}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center",
                "transition-all duration-200 ease-in-out",
                "hover:scale-110",
                isSelected
                  ? isDark
                    ? "bg-stone-600 border-stone-600 text-white"
                    : "bg-stone-500 border-stone-500 text-white"
                  : isDark
                    ? "border-stone-600 hover:border-stone-500"
                    : "border-stone-400 hover:border-stone-500"
              )}
            >
              {isSelected && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        )}
        
        {/* --- 右侧内容区域 --- */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 标题和日期 */}
          <div className="flex items-center justify-between mb-2">
            <h3 className={cn(
              "text-base font-medium truncate font-serif",
              isDark ? "text-stone-100" : "text-stone-800"
            )}>
              {title}
            </h3>
            
            <div className="flex items-center">
              <span className={cn(
                "text-xs font-serif",
                isDark ? "text-stone-500" : "text-stone-500"
              )}>
                {date}
              </span>
              
              {/* 更多操作按钮 - 在选择模式下隐藏 */}
              {!isSelectionMode && (
                <div 
                  className={cn(
                    "ml-2",
                    "transition-opacity duration-200"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      const dropdownId = `recents-dropdown-${conversation.id}`
                      const buttonRect = e.currentTarget.getBoundingClientRect()
                      // --- BEGIN COMMENT ---
                      // 调整下拉菜单的位置，向左偏移一点，确保完全可见
                      // --- END COMMENT ---
                      const position = {
                        top: buttonRect.bottom + 5, // 向下偏移5px，增加间距
                        left: buttonRect.left - 120 // 向左偏移，使菜单在按钮下方居中显示
                      }
                      useDropdownStore.getState().toggleDropdown(dropdownId, position)
                    }}
                    className={cn(
                      "p-1 rounded-md transition-all duration-200 ease-in-out",
                      "cursor-pointer",
                      "hover:bg-black/5 dark:hover:bg-white/10",
                      "hover:scale-110",
                      "active:bg-black/10 dark:active:bg-white/20",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    )}
                    data-more-button-id={`recents-dropdown-${conversation.id}`}
                    aria-label="更多选项"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {/* 下拉菜单内容 */}
                  <DropdownMenu
                    id={`recents-dropdown-${conversation.id}`}
                    minWidth={150}
                    className={cn(
                      isDark ? "bg-stone-800 border border-stone-700" : "bg-white border border-stone-200",
                      "shadow-lg rounded-md overflow-hidden" // 增加阴影和圆角
                    )}
                  >
                    <DropdownMenu.Item
                      icon={<Edit className="w-3.5 h-3.5" />}
                      onClick={() => handleRename(conversation)}
                      className="cursor-pointer"
                    >
                      重命名
                    </DropdownMenu.Item>
                    <DropdownMenu.Divider />
                    <DropdownMenu.Item
                      icon={<Trash className="w-3.5 h-3.5" />}
                      danger
                      onClick={() => handleDelete(conversation)}
                      className="cursor-pointer"
                    >
                      删除聊天
                    </DropdownMenu.Item>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
          
          {/* 预览内容 */}
          <p className={cn(
            "text-sm line-clamp-2 font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            {preview}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto pr-1"
      >
        {isLoading && conversations.length === 0 ? (
          // 加载状态
          <div className="flex flex-col space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-24 rounded-lg animate-pulse",
                  isDark ? "bg-stone-800" : "bg-stone-200"
                )}
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          // 空状态
          <div className={cn(
            "flex flex-col items-center justify-center h-full",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">没有找到匹配的对话</p>
                <p className="text-sm mt-2">尝试使用不同的搜索词</p>
              </>
            ) : (
              <>
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无历史对话</p>
                <p className="text-sm mt-2">开始一个新对话吧</p>
              </>
            )}
          </div>
        ) : (
          // 对话列表
          <div className="flex flex-col">
            {conversations.map(renderConversationItem)}
            
            {/* --- BEGIN COMMENT ---
            // 显示对话总数信息，在列表底部
            // --- END COMMENT --- */}
            {conversations.length > 0 && (
              <div className={cn(
                "flex items-center justify-center py-6 mt-4 border-t",
                isDark ? "text-stone-500 border-stone-600" : "text-stone-500 border-stone-300"
              )}>
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {searchQuery ? 
                    `搜索结果：${conversations.length} 个对话` : 
                    `共 ${total} 个历史对话`
                  }
                </span>
              </div>
            )}
          </div>
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
  )
}
