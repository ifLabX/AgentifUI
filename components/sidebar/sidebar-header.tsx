"use client"
import { Plus, PanelLeftClose, PanelLeft } from "lucide-react"
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
  const { isExpanded, isLocked, toggleSidebar } = useSidebarStore()
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
      {/* 展开/关闭按钮 - 不使用 SidebarButton 避免 lockExpanded 的干扰 */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggleSidebar}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSidebar();
          }
        }}
        aria-label={
          !isLocked 
            ? "锁定侧栏" 
            : (isExpanded ? "解锁并收起侧栏" : "展开侧栏")
        }
        className={cn(
          "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium",
          "transition-all duration-200 ease-in-out cursor-pointer",
          "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isDark ? "focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
          "border border-transparent",
          isDark ? [
            "text-gray-200",
            "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
            isLocked && "bg-stone-700 shadow-sm border-stone-600",
          ] : [
            "text-stone-600",
            "hover:bg-stone-300 hover:shadow-md",
            isLocked && "bg-stone-300 shadow-sm border-stone-400/80",
          ],
          isExpanded ? "w-full" : "w-10 justify-center",
        )}
      >
        <div className="flex flex-1 items-center min-w-0">
          <span className={cn("flex h-5 w-5 items-center justify-center -ml-0.5", 
          isDark ? "text-gray-400" : "text-gray-500",)}>
            {/* 
              图标显示逻辑：
              - 未锁定：显示PanelLeft（不带箭头）
              - 已锁定且展开：显示PanelLeftClose（带箭头，表示可以关闭）
              - 已锁定且收起：显示PanelLeft（不带箭头）
            */}
            {isLocked && isExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </span>
          {isExpanded && (
            <div className="ml-2 flex-1 min-w-0 truncate font-serif">
              {!isLocked 
                ? "锁定侧栏" 
                : (isExpanded ? "解锁并收起" : "展开侧栏")
              }
            </div>
          )}
        </div>
      </div>
      
      <SidebarButton
        icon={<Plus className={cn(
          "h-5 w-5 transition-transform duration-200 group-hover:rotate-90",
          isDark
            ? "text-gray-400"
            : "text-gray-500 group-hover:text-primary"
        )} />}
        disableLockBehavior={true}
        onClick={() => {
          // --- BEGIN COMMENT ---
          // 检查当前路径是否已经是新对话页面
          // 如果已经在新对话页面，直接返回不执行任何操作
          // 避免重复点击导致状态重置和不必要的操作
          // --- END COMMENT ---
          const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
          if (isAlreadyOnNewChat) {
            return; // 如果已经在新对话页面，不执行任何操作
          }
          
          // --- BEGIN COMMENT ---
          // 如果当前处于悬停展开状态，立即收起sidebar避免卡顿
          // --- END COMMENT ---
          const { isHovering, setHovering } = useSidebarStore.getState();
          if (isHovering) {
            setHovering(false);
          }
          
          // 跳转到新对话页面
          router.push('/chat/new');
          
          // 立即重置状态，不使用延迟
          // 清理消息和重置状态
          useChatStore.getState().clearMessages();
          clearMessages();
          setCurrentConversationId(null);
          setIsWelcomeScreen(true);
          setIsTransitioningToWelcome(true);
          setIsWaitingForResponse(false);
          
          // 设置侧边栏状态
          const { selectItem } = useSidebarStore.getState();
          selectItem('chat', null, true); // 保持当前展开状态
        }}
        aria-label="发起新对话"
        className={cn(
          "group font-medium",
          isDark 
            ? "bg-stone-700 hover:bg-stone-600 border border-stone-600 hover:border-stone-500/80 shadow-sm hover:shadow-md text-gray-100 hover:text-white"
            : "bg-primary/10 hover:bg-primary/15 text-primary shadow-sm hover:shadow-md"
        )}
      >
        <span className="font-serif">发起新对话</span>
      </SidebarButton>
    </div>
  )
}