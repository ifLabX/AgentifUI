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
          router.push('/chat/new');
          setTimeout(() => {
            useChatStore.getState().clearMessages();
            clearMessages();
            setCurrentConversationId(null);
            setIsWelcomeScreen(true);
            setIsTransitioningToWelcome(true);
            setIsWaitingForResponse(false);
            // --- BEGIN MODIFIED COMMENT ---
            // 修正selectItem调用，第一个参数应为'chat'而不是null
            // 这确保侧边栏状态正确设置，从而影响欢迎屏幕的显示
            // --- END MODIFIED COMMENT ---
            const { selectItem } = useSidebarStore.getState();
            selectItem('chat', null);
          }, 50);
          setTimeout(() => {
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
      >
        发起新对话
      </SidebarButton>
    </div>
  )
}