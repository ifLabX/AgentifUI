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

// --- BEGIN COMMENT ---
// 历史对话列表组件
// 显示对话列表，支持加载更多、搜索等功能
// --- END COMMENT ---
interface RecentsListProps {
  conversations: Conversation[]
  isLoading: boolean
  onConversationClick: (id: string) => void
  hasMore: boolean
  loadMore: () => void
  searchQuery: string
}

// --- BEGIN COMMENT ---
// 历史对话列表组件
// 确保组件正确返回 React 元素
// --- END COMMENT ---
export function RecentsList({
  conversations,
  isLoading,
  onConversationClick,
  hasMore,
  loadMore,
  searchQuery
}: RecentsListProps): React.ReactElement {
  const { isDark } = useTheme()
  const listRef = React.useRef<HTMLDivElement>(null)
  
  // --- BEGIN COMMENT ---
  // 处理滚动加载更多
  // --- END COMMENT ---
  React.useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current || !hasMore) return
      
      const { scrollTop, scrollHeight, clientHeight } = listRef.current
      // 当滚动到距离底部 100px 时加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMore()
      }
    }
    
    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll)
    }
    
    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [hasMore, loadMore])
  
  // --- BEGIN COMMENT ---
  // 处理重命名对话
  // --- END COMMENT ---
  const handleRename = async (conversation: Conversation) => {
    if (!conversation.id) return
    
    const newTitle = window.prompt('请输入新的会话名称', conversation.title || '新对话')
    if (!newTitle || newTitle.trim() === '') return
    
    try {
      const { renameConversation } = await import('@lib/db/conversations')
      const success = await renameConversation(conversation.id, newTitle.trim())
      
      if (success) {
        // 刷新页面以显示新标题
        window.location.reload()
      } else {
        alert('重命名会话失败。')
      }
    } catch (error) {
      alert('操作出错，请稍后再试。')
    }
  }
  
  // --- BEGIN COMMENT ---
  // 处理删除对话
  // --- END COMMENT ---
  const handleDelete = async (conversation: Conversation) => {
    if (!conversation.id) return
    
    const confirmed = window.confirm(`确定要删除会话 "${conversation.title || '新对话'}" 吗？此操作无法撤销。`)
    if (!confirmed) return
    
    try {
      const { deleteConversation } = await import('@lib/db/conversations')
      const success = await deleteConversation(conversation.id)
      
      if (success) {
        // 刷新页面以更新列表
        window.location.reload()
      } else {
        alert('删除会话失败。')
      }
    } catch (error) {
      alert('操作出错，请稍后再试。')
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
  // 渲染对话项
  // --- END COMMENT ---
  const renderConversationItem = (conversation: Conversation) => {
    const title = conversation.title || '新对话'
    const preview = conversation.last_message_preview || '无消息预览'
    const date = conversation.updated_at ? formatDate(conversation.updated_at) : ''
    
    return (
      <div 
        key={conversation.id} 
        className={cn(
          "flex flex-col p-4 rounded-lg cursor-pointer group relative",
          "transition-all duration-200 ease-in-out",
          isDark 
            ? "hover:bg-stone-800 border border-stone-800 hover:border-stone-700" 
            : "hover:bg-stone-200/70 border border-stone-200 hover:border-stone-400", // 增强浅色模式下的悬停效果，使用更深的stone颜色
          "mb-3"
        )}
        onClick={() => onConversationClick(conversation.external_id || conversation.id || '')}
      >
        {/* 标题和日期 */}
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn(
            "text-base font-medium truncate",
            isDark ? "text-stone-100" : "text-stone-800"
          )}>
            {title}
          </h3>
          
          <div className="flex items-center">
            <span className={cn(
              "text-xs",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {date}
            </span>
            
            {/* 更多操作按钮 - 始终可见，不依赖悬停 */}
            <div 
              className={cn(
                "ml-2", // 移除opacity-0和group-hover类，使按钮始终可见
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
          </div>
        </div>
        
        {/* 预览内容 */}
        <p className={cn(
          "text-sm line-clamp-2",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          {preview}
        </p>
      </div>
    )
  }
  
  return (
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
          
          {/* 加载更多指示器 */}
          {hasMore && (
            <div className={cn(
              "flex items-center justify-center py-4",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              <div className={cn(
                "h-5 w-5 rounded-full border-2 border-t-transparent animate-spin",
                isDark ? "border-stone-600" : "border-stone-400"
              )} />
              <span className="ml-2 text-sm">加载更多...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
