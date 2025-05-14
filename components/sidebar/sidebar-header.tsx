"use client"
import { Plus } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { SidebarChatIcon } from "./sidebar-chat-icon"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"

export function SidebarHeader() {
  const { isExpanded, toggleSidebar } = useSidebarStore()
  const { isDark } = useTheme()
  const router = useRouter()
  
  // 获取聊天相关状态和方法
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId)
  const clearMessages = useChatStore(state => state.clearMessages)
  const setIsWaitingForResponse = useChatStore(state => state.setIsWaitingForResponse)
  const { setIsWelcomeScreen } = useChatInputStore()
  const { setIsTransitioningToWelcome } = useChatTransitionStore()

  return (
    <div className={cn(
      "flex flex-col gap-2 py-4 px-3",
    )}>
      <SidebarButton
        icon={<SidebarChatIcon isDark={isDark} />}
        text={isExpanded ? "收起侧栏" : "展开侧栏"}
        onClick={toggleSidebar}
        aria-label={isExpanded ? "收起侧栏" : "展开侧栏"}
        className={cn(
          "group",
        )}
      />
      <SidebarButton
        icon={<Plus className={cn(
          "h-5 w-5 transition-transform duration-200 group-hover:rotate-90",
          isDark
            ? "text-gray-400"
            : "text-gray-500 group-hover:text-primary"
        )} />}
        text="发起新对话"
        onClick={() => {
          // --- BEGIN MODIFIED COMMENT ---
          // 修改状态更新顺序，先跳转路由，然后再更新状态
          // --- END MODIFIED COMMENT ---
          // console.log('[SidebarHeader] 点击发起新对话按钮');
          
          // 1. 先跳转路由到新对话页面
          router.push('/chat/new');
          
          // 2. 然后用setTimeout延迟更新状态，确保路由已经变化
          setTimeout(() => {
            // 强制清除所有消息
            useChatStore.getState().clearMessages();
            clearMessages();
            
            // 设置当前对话ID为null
            setCurrentConversationId(null);
            
            // 设置欢迎屏幕状态为true
            setIsWelcomeScreen(true);
            
            // 设置过渡状态为true，启用闪烁过渡效果
            setIsTransitioningToWelcome(true);
            
            // 重置等待响应状态
            setIsWaitingForResponse(false);
            
            // 清除侧边栏选中状态
            const { selectItem } = useSidebarStore.getState();
            selectItem(null, null);
            
            // console.log('[SidebarHeader] 状态更新完成');
          }, 50);
          
          // 3. 再次确认消息数组完全清除
          setTimeout(() => {
            // console.log('[SidebarHeader] 再次确认消息数组清除状态');
            useChatStore.getState().clearMessages();
            clearMessages();
            setIsWelcomeScreen(true);
          }, 200);
        }}
        aria-label="发起新对话"
        className={cn(
          "group font-medium",
          isDark 
            ? "bg-stone-700 hover:bg-stone-600 border border-stone-600 hover:border-stone-500/80 shadow-sm hover:shadow-md text-gray-100 hover:text-white"
            : "bg-primary/10 hover:bg-primary/15 text-primary shadow-sm hover:shadow-md"
        )}
      />
    </div>
  )
} 