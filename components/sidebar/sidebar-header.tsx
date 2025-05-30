"use client"
import { Plus, PanelLeftClose, PanelLeft, Store } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { Grid3x3, AppWindow, Blocks } from "lucide-react"

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
      {/* 展开/关闭按钮 */}
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
          "h-10 min-h-[2.5rem]",
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
          <span className={cn(
            "flex h-5 w-5 items-center justify-center -ml-0.5 flex-shrink-0", 
            isDark ? "text-gray-400" : "text-gray-500",
          )}>
            {isLocked && isExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </span>
          {isExpanded && (
            <div className={cn(
              "ml-2 flex-1 min-w-0 truncate font-serif",
              "flex items-center leading-none"
            )}>
              {!isLocked 
                ? "锁定侧栏" 
                : (isExpanded ? "解锁并收起" : "展开侧栏")
              }
            </div>
          )}
        </div>
      </div>
      
      {/* 🎯 发起新对话按钮 - 主要行动按钮 */}
      <SidebarButton
        icon={<Plus className={cn(
          "h-5 w-5 transition-transform duration-200 group-hover:rotate-90",
          isDark
            ? "text-stone-100"
            : "text-stone-700"
        )} />}
        disableLockBehavior={true}
        onClick={() => {
          const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
          if (isAlreadyOnNewChat) {
            return;
          }
          
          const { isHovering, setHovering } = useSidebarStore.getState();
          if (isHovering) {
            setHovering(false);
          }
          
          router.push('/chat/new');
          
          useChatStore.getState().clearMessages();
          clearMessages();
          setCurrentConversationId(null);
          setIsWelcomeScreen(true);
          setIsTransitioningToWelcome(true);
          setIsWaitingForResponse(false);
          
          const { selectItem } = useSidebarStore.getState();
          selectItem('chat', null, true);
        }}
        aria-label="发起新对话"
        className={cn(
          "group font-medium transition-all duration-200",
          isDark 
            ? [
              "bg-stone-600 hover:bg-stone-500",
              "border border-stone-500 hover:border-stone-400",
              "text-stone-100 hover:text-white",
              "shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30",
              "hover:scale-[1.02]"
            ]
            : [
              "bg-stone-200 hover:bg-stone-300", // 浅色背景
              "border border-stone-300 hover:border-stone-400",
              "text-stone-700 hover:text-stone-800", // 深色文字
              "shadow-lg shadow-stone-900/8 hover:shadow-xl hover:shadow-stone-900/12",
              "hover:scale-[1.02]"
            ]
        )}
      >
        <span className="font-serif">发起新对话</span>
      </SidebarButton>

      {/* 🎯 应用广场/应用市场入口按钮 - 使用更好的图标 */}
      <SidebarButton
        icon={
          // // 方案1: 使用 Grid3x3 (九宫格，很像应用市场)
          // <Grid3x3 className={cn(
          //   "h-5 w-5 transition-colors duration-200",
          //   isDark ? "text-stone-400 group-hover:text-stone-300" : "text-stone-500 group-hover:text-stone-600"
          // )} />

          // 方案2: 使用 AppWindow (应用窗口)
          // <AppWindow className={cn(
          //   "h-5 w-5 transition-colors duration-200",
          //   isDark ? "text-stone-400 group-hover:text-stone-300" : "text-stone-500 group-hover:text-stone-600"
          // )} />

          // 方案3: 使用 Blocks (积木块，很有应用感)
          <Blocks className={cn(
            "h-5 w-5 transition-colors duration-200",
            isDark ? "text-stone-400 group-hover:text-stone-300" : "text-stone-500 group-hover:text-stone-600"
          )} />
        }
        disableLockBehavior={true}
        onClick={() => {
          router.push('/apps');
        }}
        aria-label="应用广场"
        className={cn(
          "group font-medium transition-all duration-200",
          isDark
            ? [
              "bg-stone-800/50 hover:bg-stone-700/70",
              "border border-stone-700/60 hover:border-stone-600/80",
              "text-stone-300 hover:text-stone-200",
              "shadow-sm shadow-stone-900/10 hover:shadow-md hover:shadow-stone-900/15"
            ]
            : [
              "bg-stone-50 hover:bg-stone-100", // 更浅的背景
              "border border-stone-200 hover:border-stone-300",
              "text-stone-600 hover:text-stone-700",
              "shadow-sm shadow-stone-900/5 hover:shadow-md hover:shadow-stone-900/8"
            ]
        )}
      >
        <span className="font-serif">应用广场</span>
      </SidebarButton>

    </div>
  )
}