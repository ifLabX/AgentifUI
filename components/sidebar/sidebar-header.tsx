"use client"
import { Plus, PanelLeft, ArrowRightToLine, ArrowLeftToLine, Store } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { Grid3x3, AppWindow, Blocks } from "lucide-react"
import { useChatInterface } from "@lib/hooks/use-chat-interface"

interface SidebarHeaderProps {
  isHovering?: boolean
}

export function SidebarHeader({ isHovering = false }: SidebarHeaderProps) {
  const { isExpanded, toggleSidebar } = useSidebarStore()
  const { isDark } = useTheme()
  const router = useRouter()
  
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId)
  const clearMessages = useChatStore(state => state.clearMessages)
  const setIsWaitingForResponse = useChatStore(state => state.setIsWaitingForResponse)
  const { setIsWelcomeScreen } = useChatInputStore()
  const { setIsTransitioningToWelcome } = useChatTransitionStore()
  const { clearConversationState } = useChatInterface()

  // --- BEGIN COMMENT ---
  // 🎯 自定义拉宽版PanelLeft图标 - 让右侧区域更宽
  // --- END COMMENT ---
  const WidePanelLeft = ({ className }: { className?: string }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 28 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 拉宽的PanelLeft路径 - 右侧区域更宽 */}
      <rect width="22" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="9" x2="9" y1="5" y2="19" />
    </svg>
  )

  // --- BEGIN COMMENT ---
  // 🎯 新增：新对话处理函数
  // --- END COMMENT ---
  const handleNewChat = () => {
    const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
    if (isAlreadyOnNewChat) {
      return;
    }
    
    console.log('[SidebarHeader] 开始新对话，清理所有状态');
    
    // 立即路由到新对话页面
    router.push('/chat/new');
    
    // 延迟清理状态，确保路由完成
    setTimeout(() => {
      // 清理chatStore状态
      useChatStore.getState().clearMessages();
      clearMessages();
      setCurrentConversationId(null);
      
      // --- BEGIN COMMENT ---
      // 🎯 新增：清理use-chat-interface中的对话状态
      // 这确保difyConversationId、dbConversationUUID、conversationAppId都被正确清理
      // --- END COMMENT ---
      clearConversationState();
      
      // 清理其他UI状态
      setIsWelcomeScreen(true);
      setIsTransitioningToWelcome(true);
      setIsWaitingForResponse(false);
      
      const { selectItem } = useSidebarStore.getState();
      selectItem('chat', null, true);
      
      console.log('[SidebarHeader] 状态清理完成');
    }, 100);
  };

  return (
    <div className={cn(
      "flex flex-col gap-2 py-4 px-3",
    )}>
      {/* --- BEGIN COMMENT ---
      布局容器 - 展开时水平排列按钮和文字
      --- END COMMENT --- */}
      <div className={cn(
        "flex items-center",
        isExpanded ? "gap-2" : ""
      )}>
        {/* --- BEGIN COMMENT ---
        侧栏控制按钮 - 固定大小，默认显示窗口图标，悬停时fade到箭头图标
        --- END COMMENT --- */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            // 点击后移除focus，避免影响父容器的cursor显示
            const target = e.currentTarget;
            setTimeout(() => {
              target.blur();
            }, 100);
            toggleSidebar();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSidebar();
            }
          }}
          aria-label={
            isExpanded ? "收起侧栏" : "展开侧栏"
          }
          className={cn(
            "group relative flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium",
            "transition-all duration-150 ease-in-out cursor-pointer",
            "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "select-none", // 防止文字选中
            isDark ? "focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
            "border border-transparent",
            "h-10 w-10", // 正方形固定大小
            isDark ? [
              "text-gray-200",
              "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
            ] : [
              "text-stone-600",
              "hover:bg-stone-300 hover:shadow-md",
            ]
          )}
        >
          {/* --- BEGIN COMMENT ---
          图标容器 - 包含默认图标和悬停图标的叠加效果
          --- END COMMENT --- */}
          <span className={cn(
            "relative flex h-5 w-5 items-center justify-center flex-shrink-0", 
            isDark ? "text-gray-400" : "text-gray-500",
          )}>
            {/* 默认图标 - 拉宽版窗口图标 */}
            <WidePanelLeft className={cn(
              "absolute h-5 w-5 transition-all duration-150 ease-out",
              // 收起状态：sidebar悬停时隐藏窗口图标
              !isExpanded && isHovering && "opacity-0 scale-98",
              // 按钮悬停时隐藏窗口图标
              "group-hover:opacity-0 group-hover:scale-98"
            )} />
            
            {/* 悬停图标 - 箭头指向竖线，根据展开状态显示方向 */}
            {isExpanded ? (
              <ArrowLeftToLine className={cn(
                "absolute h-5 w-5 transition-all duration-150 ease-out",
                // 展开状态：只有按钮悬停时显示箭头
                "opacity-0 scale-102 group-hover:opacity-100 group-hover:scale-100"
              )} />
            ) : (
              <ArrowRightToLine className={cn(
                "absolute h-5 w-5 transition-all duration-150 ease-out",
                // 收起状态：sidebar悬停或按钮悬停时显示箭头
                isHovering ? "opacity-100 scale-100" : "opacity-0 scale-102",
                "group-hover:opacity-100 group-hover:scale-100"
              )} />
            )}
          </span>
        </div>

        {/* --- BEGIN COMMENT ---
        项目名称 - 展开时作为独立文字显示，样式与按钮一致
        --- END COMMENT --- */}
        {isExpanded && (
          <div className={cn(
            "flex-1 min-w-0 truncate",
            "flex items-center leading-none",
            "font-display font-bold text-base tracking-wide",
            "-mt-0.5 -ml-1", // 微调：稍微往上移一点，靠近左侧按钮一点
            isDark ? "text-gray-100" : "text-stone-700"
          )}>
            <span className={cn(
              "bg-gradient-to-r bg-clip-text text-transparent",
              isDark ? [
                "from-gray-100 via-gray-200 to-gray-300"
              ] : [
                "from-stone-700 via-stone-800 to-stone-900"
              ]
            )}>
              AgentifUI
            </span>
          </div>
        )}
      </div>
      
      {/* 🎯 发起新对话按钮 - 重要功能，响应式设计突出显示 */}
      <SidebarButton
        icon={<Plus className={cn(
          "h-5 w-5 transition-all duration-150 ease-out group-hover:rotate-90 group-hover:scale-110",
          isDark
            ? "text-gray-300 group-hover:text-white"
            : "text-stone-600 group-hover:text-stone-800"
        )} />}
        disableLockBehavior={true}
        onClick={handleNewChat}
        aria-label="发起新对话"
        className={cn(
          "group font-medium transition-all duration-150 ease-out",
          isDark 
            ? [
              "bg-stone-700/40 hover:bg-stone-600/60",
              "border border-stone-600/50 hover:border-stone-500/70",
              "text-gray-300 hover:text-white",
              "shadow-sm hover:shadow-md hover:shadow-stone-900/20"
            ]
            : [
              "bg-stone-200/60 hover:bg-stone-300/80",
              "border border-stone-300/60 hover:border-stone-400/80",
              "text-stone-600 hover:text-stone-800",
              "shadow-sm hover:shadow-md hover:shadow-stone-900/15"
            ]
        )}
      >
        <span className="font-serif">发起新对话</span>
      </SidebarButton>

      {/* 🎯 应用市场按钮 - 次要功能，轻量但协调的设计 */}
      <SidebarButton
        icon={
          <Blocks className={cn(
            "h-5 w-5 transition-all duration-150 ease-out group-hover:scale-105",
            isDark ? "text-stone-500 group-hover:text-stone-300" : "text-stone-500 group-hover:text-stone-700"
          )} />
        }
        disableLockBehavior={true}
        onClick={() => {
          router.push('/apps');
        }}
        aria-label="应用市场"
        className={cn(
          "group font-medium transition-all duration-150 ease-out",
          isDark
            ? [
              "bg-transparent hover:bg-stone-700/20",
              "border border-transparent hover:border-stone-600/25",
              "text-stone-400 hover:text-stone-300",
              "hover:shadow-sm hover:shadow-stone-900/8"
            ]
            : [
              "bg-transparent hover:bg-stone-100/70",
              "border border-transparent hover:border-stone-300/35",
              "text-stone-500 hover:text-stone-700",
              "hover:shadow-sm hover:shadow-stone-900/6"
            ]
        )}
      >
        <span className="font-serif">应用市场</span>
      </SidebarButton>

    </div>
  )
}