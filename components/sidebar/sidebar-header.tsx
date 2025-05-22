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
        onClick={toggleSidebar}
        aria-label={isExpanded ? "收起侧栏" : "展开侧栏"}
        className={cn(
          "group",
        )}
      >
        {isExpanded ? "收起侧栏" : "展开侧栏"}
      </SidebarButton>
      <SidebarButton
        icon={<Plus className={cn(
          "h-5 w-5 transition-transform duration-200 group-hover:rotate-90",
          isDark
            ? "text-gray-400"
            : "text-gray-500 group-hover:text-primary"
        )} />}
        onClick={() => {
          // --- BEGIN COMMENT ---
          // 检查当前路径是否已经是新对话页面
          // 如果已经在新对话页面，只重置状态而不进行路由跳转
          // 避免重复点击导致标题消失的问题
          // --- END COMMENT ---
          const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
          
          // 如果不在新对话页面，则跳转到新对话页面
          if (!isAlreadyOnNewChat) {
            router.push('/chat/new');
          }
          
          // 使用单个 setTimeout 来重置状态，避免重复操作
          setTimeout(() => {
            // 清理消息和重置状态
            useChatStore.getState().clearMessages();
            clearMessages();
            setCurrentConversationId(null);
            setIsWelcomeScreen(true);
            setIsTransitioningToWelcome(true);
            setIsWaitingForResponse(false);
            
            // 设置侧边栏状态
            const { selectItem } = useSidebarStore.getState();
            selectItem('chat', null);
            
            // 如果已经在新对话页面，手动设置标题以确保其可见
            if (isAlreadyOnNewChat) {
              document.title = '新对话 | if-agent-ui';
            }
          }, 100);
        }}
        aria-label="发起新对话"
        className={cn(
          "group font-medium",
          isDark 
            ? "bg-stone-700 hover:bg-stone-600 border border-stone-600 hover:border-stone-500/80 shadow-sm hover:shadow-md text-gray-100 hover:text-white"
            : "bg-primary/10 hover:bg-primary/15 text-primary shadow-sm hover:shadow-md"
        )}
      >
        发起新对话
      </SidebarButton>
    </div>
  )
}