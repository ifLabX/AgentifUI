"use client"
import React from "react"
import { ArrowRightToLine, ArrowLeftToLine, CirclePlus, MessageCirclePlus, Edit3, Edit, SquarePen, Pen, Feather, LayoutGrid, Clock } from "lucide-react"
import { useTranslations } from 'next-intl'
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { useChatInterface } from "@lib/hooks/use-chat-interface"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { useFormattedShortcut, COMMON_SHORTCUTS } from "@lib/hooks/use-platform-keys"
import { KeyCombination } from "@components/ui/adaptive-key-badge"

interface SidebarHeaderProps {
  isHovering?: boolean
}

export function SidebarHeader({ isHovering = false }: SidebarHeaderProps) {
  const { isExpanded, toggleSidebar } = useSidebarStore()
  const { isDark } = useTheme()
  const router = useRouter()
  const t = useTranslations('sidebar')
  
  // --- BEGIN COMMENT ---
  // 🎯 使用正确的快捷键映射
  // --- END COMMENT ---
  const newChatShortcut = useFormattedShortcut('NEW_CHAT')
  const recentChatsShortcut = useFormattedShortcut('RECENT_CHATS')
  const appsMarketShortcut = useFormattedShortcut('APPS_MARKET')
  
  // --- BEGIN COMMENT ---
  // 🎯 点击状态管理 - 用于控制点击时的立即切换效果
  // --- END COMMENT ---
  const [isClicking, setIsClicking] = React.useState(false)
  
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
        在slim状态下显示右侧tooltip
        --- END COMMENT --- */}
        {!isExpanded ? (
          <TooltipWrapper
            content={t('expand')}
            id="sidebar-header-expand-tooltip"
            placement="right"
            size="sm"
            showArrow={false}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                // --- BEGIN COMMENT ---
                // 立即移除focus，避免影响父容器的cursor显示
                // --- END COMMENT ---
                e.currentTarget.blur();
                
                // --- BEGIN COMMENT ---
                // 🎯 设置点击状态，确保立即显示目标箭头
                // --- END COMMENT ---
                setIsClicking(true);
                toggleSidebar();
                
                // --- BEGIN COMMENT ---
                // 延迟重置点击状态，让过渡动画完成
                // --- END COMMENT ---
                setTimeout(() => {
                  setIsClicking(false);
                }, 200);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
              aria-label={t('expand')}
              className={cn(
                "group relative flex items-center justify-center px-2 py-2 text-sm font-medium",
                // --- BEGIN COMMENT ---
                // 使用resize cursor表示可以调整sidebar宽度：展开时向右箭头，收起时向左箭头
                // --- END COMMENT ---
                "cursor-e-resize",
                "transition-all duration-150 ease-in-out",
                "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "select-none", // 防止文字选中
                isDark ? "focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
                "border border-transparent",
                "h-10 w-10", // 正方形固定大小
                "text-gray-200", // 基础文字颜色
                "[margin-left:1px]", // 整个按钮向右移动一点点
              )}
            >
              {/* 🎨 内部背景 - 收起状态仅悬停显示 */}
              <div className={cn(
                "absolute inset-1 rounded-md transition-all duration-150 ease-in-out",
                isDark 
                  ? "group-hover:bg-stone-600/60" 
                  : "group-hover:bg-stone-300/80"
              )} />
              
              {/* --- BEGIN COMMENT ---
              图标容器 - 包含默认图标和悬停图标的叠加效果
              --- END COMMENT --- */}
              <span className={cn(
                "relative flex h-5 w-5 items-center justify-center flex-shrink-0 z-10", 
                isDark 
                  ? "text-gray-400 group-hover:text-white" 
                  : "text-gray-500 group-hover:text-stone-800",
              )}>
                {/* 默认图标 - 拉宽版窗口图标，只在非悬停且非点击状态下显示 */}
                <WidePanelLeft className={cn(
                  "absolute h-5 w-5 transition-all duration-150 ease-out",
                  // 收起状态：sidebar悬停时隐藏窗口图标并放大
                  isHovering && "opacity-0 scale-110",
                  // 按钮悬停时隐藏窗口图标并添加更大的放大效果
                  "group-hover:opacity-0 group-hover:scale-125",
                  // 点击时立即隐藏窗口图标
                  isClicking && "opacity-0 scale-110"
                )} />
                
                {/* 悬停图标 - 右箭头，收起状态下悬停或点击时显示 */}
                <ArrowRightToLine className={cn(
                  "absolute h-4 w-4 transition-all duration-150 ease-out",
                  // 收起状态：sidebar悬停、按钮悬停或点击时显示箭头
                  (isHovering || isClicking) ? "opacity-100 scale-110" : "opacity-0 scale-102",
                  "group-hover:opacity-100" // 🎨 移除放大效果
                )} />
              </span>
            </div>
          </TooltipWrapper>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              // --- BEGIN COMMENT ---
              // 立即移除focus，避免影响父容器的cursor显示
              // --- END COMMENT ---
              e.currentTarget.blur();
              
              // --- BEGIN COMMENT ---
              // 🎯 设置点击状态，确保立即显示目标箭头
              // --- END COMMENT ---
              setIsClicking(true);
              toggleSidebar();
              
              // --- BEGIN COMMENT ---
              // 延迟重置点击状态，让过渡动画完成
              // --- END COMMENT ---
              setTimeout(() => {
                setIsClicking(false);
              }, 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSidebar();
              }
            }}
            aria-label={t('collapse')}
            className={cn(
              "group relative flex items-center justify-center px-2 py-2 text-sm font-medium",
              // --- BEGIN COMMENT ---
              // 使用resize cursor表示可以调整sidebar宽度：展开时向左箭头，收起时向右箭头
              // --- END COMMENT ---
              "cursor-w-resize",
              "transition-all duration-150 ease-in-out",
              "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "select-none", // 防止文字选中
              isDark ? "focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
              "border border-transparent",
              "h-10 w-10", // 正方形固定大小
              "[margin-left:1px]", // 整个按钮向右移动一点点
            )}
          >
            {/* 🎨 内部背景 - 展开状态默认显示，悬停时增强 */}
            <div className={cn(
              "absolute inset-1 rounded-md transition-all duration-150 ease-in-out",
              // 展开状态：默认有背景色，悬停时增强
              isDark 
                ? "bg-stone-600/50 group-hover:bg-stone-600/70" 
                : "bg-stone-300/50 group-hover:bg-stone-300/80"
            )} />
            
            {/* --- BEGIN COMMENT ---
            图标容器 - 包含默认图标和悬停图标的叠加效果
            --- END COMMENT --- */}
            <span className={cn(
              "relative flex h-5 w-5 items-center justify-center flex-shrink-0 z-10", 
              isDark 
                ? "text-gray-400 group-hover:text-white" 
                : "text-gray-500 group-hover:text-stone-800",
            )}>
              {/* 默认图标 - 拉宽版窗口图标，只在非悬停且非点击状态下显示 */}
              <WidePanelLeft className={cn(
                "absolute h-5 w-5 transition-all duration-150 ease-out",
                // 按钮悬停时隐藏窗口图标并添加更大的放大效果
                "group-hover:opacity-0 group-hover:scale-125",
                // 点击时立即隐藏窗口图标
                isClicking && "opacity-0 scale-110"
              )} />
              
              {/* 悬停图标 - 左箭头，展开状态下悬停或点击时显示 */}
              <ArrowLeftToLine className={cn(
                "absolute h-4 w-4 transition-all duration-150 ease-out",
                // 展开状态：按钮悬停或点击时显示箭头
                isClicking ? "opacity-100 scale-110" : "opacity-0 scale-102",
                "group-hover:opacity-100" // 🎨 移除放大效果
              )} />
            </span>
          </div>
        )}

        {/* --- BEGIN COMMENT ---
        项目名称 - 展开时作为独立文字显示，样式与按钮一致
        --- END COMMENT --- */}
        {isExpanded && (
          <div className={cn(
            "flex-1 min-w-0 truncate",
            "flex items-center leading-none",
            "font-display font-bold text-base tracking-wide",
            "-mt-0.5 -ml-2", // 微调：稍微往上移一点，进一步左移与下方按钮对齐
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
      
      {/* 🎯 新对话按钮 - 重要功能，响应式设计突出显示 */}
      {isExpanded ? (
        <SidebarButton
          icon={<Edit className={cn(
            "h-5 w-5 transition-all duration-150 ease-out",
            isDark
              ? "text-gray-300 group-hover:text-white"
              : "text-stone-600 group-hover:text-stone-800"
          )} />}
          disableLockBehavior={true}
          onClick={handleNewChat}
          aria-label={t('newChat')}
          variant="transparent"
          className={cn(
            "group font-medium transition-all duration-150 ease-out",
            "flex items-center justify-between w-full"
          )}
        >
          <span className="font-serif">{t('newChat')}</span>
          {/* 悬停时显示的快捷键 */}
          <div className={cn(
            "opacity-0 group-hover:opacity-60 transition-opacity duration-200",
            "ml-auto"
          )}>
            <KeyCombination 
              keys={newChatShortcut.symbols}
              size="md"
              isDark={isDark}
            />
          </div>
        </SidebarButton>
      ) : (
        <TooltipWrapper
          content={
            <div className="flex items-center gap-2.5">
              <span>{t('newChat')}</span>
              <KeyCombination 
                keys={newChatShortcut.symbols}
                size="sm"
              />
            </div>
          }
          id="sidebar-header-new-chat-tooltip"
          placement="right"
          size="sm"
          showArrow={false}
        >
          <SidebarButton
            icon={<Edit className={cn(
              "h-5 w-5 transition-all duration-150 ease-out",
              isDark
                ? "text-gray-300 group-hover:text-white"
                : "text-stone-600 group-hover:text-stone-800"
            )} />}
            disableLockBehavior={true}
            onClick={handleNewChat}
            aria-label={t('newChat')}
            variant="transparent"
            className={cn(
              "group font-medium transition-all duration-150 ease-out"
            )}
          >
            <span className="font-serif">{t('newChat')}</span>
          </SidebarButton>
        </TooltipWrapper>
      )}

      {/* 🎯 历史对话按钮 - 提升重要性，与新对话按钮并列 */}
      {isExpanded ? (
        <SidebarButton
          icon={<Clock className={cn(
            "h-5 w-5 transition-all duration-150 ease-out",
            isDark
              ? "text-gray-300 group-hover:text-white"
              : "text-stone-600 group-hover:text-stone-800"
          )} />}
          disableLockBehavior={true}
          onClick={() => {
            router.push('/chat/history');
          }}
          aria-label={t('historyChats')}
          variant="transparent"
          className={cn(
            "group font-medium transition-all duration-150 ease-out",
            "flex items-center justify-between w-full"
          )}
        >
          <span className="font-serif">{t('historyChats')}</span>
          {/* 悬停时显示的快捷键 */}
          <div className={cn(
            "opacity-0 group-hover:opacity-60 transition-opacity duration-200",
            "ml-auto"
          )}>
            <KeyCombination 
              keys={recentChatsShortcut.symbols}
              size="md"
              isDark={isDark}
            />
          </div>
        </SidebarButton>
      ) : (
        <TooltipWrapper
          content={
            <div className="flex items-center gap-2.5">
              <span>{t('historyChats')}</span>
              <KeyCombination 
                keys={recentChatsShortcut.symbols}
                size="sm"
              />
            </div>
          }
          id="sidebar-header-history-tooltip"
          placement="right"
          size="sm"
          showArrow={false}
        >
          <SidebarButton
            icon={<Clock className={cn(
              "h-5 w-5 transition-all duration-150 ease-out",
              isDark
                ? "text-gray-300 group-hover:text-white"
                : "text-stone-600 group-hover:text-stone-800"
            )} />}
            disableLockBehavior={true}
            onClick={() => {
              router.push('/chat/history');
            }}
            aria-label={t('historyChats')}
            variant="transparent"
            className={cn(
              "group font-medium transition-all duration-150 ease-out"
            )}
          >
            <span className="font-serif">{t('historyChats')}</span>
          </SidebarButton>
        </TooltipWrapper>
      )}

      {/* 🎯 应用市场按钮 - 与新对话按钮样式完全一致 */}
      {isExpanded ? (
        <SidebarButton
          icon={<LayoutGrid className={cn(
            "h-5 w-5 transition-all duration-150 ease-out",
            isDark
              ? "text-gray-300 group-hover:text-white"
              : "text-stone-600 group-hover:text-stone-800"
          )} />}
          disableLockBehavior={true}
          onClick={() => {
            router.push('/apps');
          }}
          aria-label={t('appsMarket')}
          variant="transparent"
          className={cn(
            "group font-medium transition-all duration-150 ease-out",
            "flex items-center justify-between w-full"
          )}
        >
          <span className="font-serif">{t('appsMarket')}</span>
          {/* 悬停时显示的快捷键 */}
          <div className={cn(
            "opacity-0 group-hover:opacity-60 transition-opacity duration-200",
            "ml-auto"
          )}>
            <KeyCombination 
              keys={appsMarketShortcut.symbols}
              size="md"
              isDark={isDark}
            />
          </div>
        </SidebarButton>
      ) : (
        <TooltipWrapper
          content={
            <div className="flex items-center gap-2.5">
              <span>{t('appsMarket')}</span>
              <KeyCombination 
                keys={appsMarketShortcut.symbols}
                size="sm"
              />
            </div>
          }
          id="sidebar-header-apps-tooltip"
          placement="right"
          size="sm"
          showArrow={false}
        >
          <SidebarButton
            icon={<LayoutGrid className={cn(
              "h-5 w-5 transition-all duration-150 ease-out",
              isDark
                ? "text-gray-300 group-hover:text-white"
                : "text-stone-600 group-hover:text-stone-800"
            )} />}
            disableLockBehavior={true}
            onClick={() => {
              router.push('/apps');
            }}
            aria-label={t('appsMarket')}
            variant="transparent"
            className={cn(
              "group font-medium transition-all duration-150 ease-out"
            )}
          >
            <span className="font-serif">{t('appsMarket')}</span>
          </SidebarButton>
        </TooltipWrapper>
      )}

    </div>
  )
}