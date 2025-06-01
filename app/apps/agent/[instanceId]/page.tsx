"use client"

import { useState, useEffect, useCallback, useLayoutEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useMobile, useChatWidth, useChatInterface, useWelcomeScreen, useChatScroll } from "@lib/hooks"
import { cn } from "@lib/utils"
import { 
  Loader2,
  Blocks
} from "lucide-react"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useChatStore } from "@lib/stores/chat-store"
import { useAppListStore } from "@lib/stores/app-list-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useChatLayoutStore } from "@lib/stores/chat-layout-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { 
  WelcomeScreen, 
  ChatInputBackdrop, 
  ChatLoader,
  ScrollToBottomButton 
} from "@components/chat"
import { ChatInput } from "@components/chat-input"
import { useProfile } from "@lib/hooks/use-profile"
import { NavBar } from "@components/nav-bar/nav-bar"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

export default function AppDetailPage() {
  const { colors, isDark } = useThemeColors()
  const isMobile = useMobile()
  const { widthClass, paddingClass } = useChatWidth()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const instanceId = params.instanceId as string
  
  // --- BEGIN COMMENT ---
  // 获取用户资料，用于欢迎界面显示
  // --- END COMMENT ---
  const { profile } = useProfile()
  
  // --- BEGIN COMMENT ---
  // 使用聊天接口逻辑，获取messages状态和相关方法
  // --- END COMMENT ---
  const {
    messages,
    handleSubmit: originalHandleSubmit,
    isProcessing,
    isWaitingForResponse,
    handleStopProcessing,
  } = useChatInterface()
  
  // --- BEGIN COMMENT ---
  // 使用统一的欢迎界面逻辑，现在支持应用详情页面
  // --- END COMMENT ---
  const { isWelcomeScreen, setIsWelcomeScreen } = useWelcomeScreen()
  
  // --- BEGIN COMMENT ---
  // 获取聊天布局状态，用于输入框高度管理
  // --- END COMMENT ---
  const { inputHeight } = useChatLayoutStore()
  const chatInputHeightVar = `${inputHeight || 80}px`
  
  // --- BEGIN COMMENT ---
  // 本地状态管理
  // --- END COMMENT ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // --- BEGIN COMMENT ---
  // 添加滚动管理，确保消息列表能正确滚动
  // --- END COMMENT ---
  const scrollRef = useChatScroll(messages)
  
  // --- BEGIN COMMENT ---
  // Sidebar选中状态管理
  // --- END COMMENT ---
  const { selectItem } = useSidebarStore()
  
  // --- BEGIN COMMENT ---
  // 聊天状态管理
  // --- END COMMENT ---
  const { clearMessages, setCurrentConversationId } = useChatStore()
  
  // --- BEGIN COMMENT ---
  // 应用初始化状态
  // --- END COMMENT ---
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  
  // --- BEGIN COMMENT ---
  // 应用相关状态
  // --- END COMMENT ---
  const { apps, fetchApps } = useAppListStore()
  const { 
    currentAppId, 
    isValidating, 
    switchToSpecificApp,
    error: appError 
  } = useCurrentApp()
  
  // --- BEGIN COMMENT ---
  // 获取当前应用实例数据
  // --- END COMMENT ---
  const currentApp = apps.find(app => app.instance_id === instanceId)
  
  // --- BEGIN COMMENT ---
  // 主题同步：确保输入框样式跟随主题变化
  // --- END COMMENT ---
  const setDarkMode = useChatInputStore(state => state.setDarkMode)
  useEffect(() => {
    setDarkMode(isDark)
  }, [isDark, setDarkMode])
  
  // --- BEGIN COMMENT ---
  // 🎯 关键修复：使用useLayoutEffect确保在路由切换时立即清理状态
  // 这比useEffect更早执行，能在渲染前清理状态，避免显示错误内容
  // --- END COMMENT ---
  useLayoutEffect(() => {
    // --- BEGIN COMMENT ---
    // 🎯 修复：正确判断当前是否在agent页面
    // --- END COMMENT ---
    if (pathname === `/apps/agent/${instanceId}`) {
      console.log('[AppDetail] 路由切换到应用详情页面，立即清理聊天状态')
      
      // 立即清除所有消息
      useChatStore.getState().clearMessages()
      clearMessages()
      
      // 设置当前对话 ID 为 null
      setCurrentConversationId(null)
      
      // 强制设置欢迎屏幕状态为 true
      setIsWelcomeScreen(true)
      
      // 重置提交状态
      setIsSubmitting(false)
      
      console.log('[AppDetail] 聊天状态清理完成')
    }
  }, [pathname, instanceId, clearMessages, setCurrentConversationId, setIsWelcomeScreen])
  
  // --- BEGIN COMMENT ---
  // 页面初始化：切换到目标应用并同步sidebar选中状态
  // --- END COMMENT ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true)
        setInitError(null)
        
        console.log('[AppDetail] 开始初始化应用:', instanceId)
        
        // 确保应用列表已加载
        if (apps.length === 0) {
          console.log('[AppDetail] 应用列表为空，开始获取')
          await fetchApps()
        }
        
        // 等待应用列表更新
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 重新获取最新的应用列表
        const latestApps = useAppListStore.getState().apps
        console.log('[AppDetail] 当前应用列表长度:', latestApps.length)
        
        // 检查应用是否存在
        const targetApp = latestApps.find(app => app.instance_id === instanceId)
        if (!targetApp) {
          console.error('[AppDetail] 应用不存在:', instanceId)
          setInitError('应用不存在')
          return
        }
        
        console.log('[AppDetail] 找到目标应用:', targetApp.display_name)
        
        // 应用存在时设置sidebar选中状态
        selectItem('app', instanceId)
        
        // 如果当前应用不是目标应用，则切换
        if (currentAppId !== instanceId) {
          console.log('[AppDetail] 切换到应用:', instanceId)
          await switchToSpecificApp(instanceId)
        }
        
        console.log('[AppDetail] 应用初始化完成')
        
      } catch (error) {
        console.error('[AppDetail] 初始化失败:', error)
        setInitError(error instanceof Error ? error.message : '初始化失败')
      } finally {
        setIsInitializing(false)
      }
    }
    
    if (instanceId) {
      initializeApp()
    }
  }, [instanceId, apps.length, currentAppId, fetchApps, switchToSpecificApp, selectItem])
  
  // --- BEGIN COMMENT ---
  // 页面卸载时清除选中状态（当离开应用详情页面时）
  // --- END COMMENT ---
  useEffect(() => {
    return () => {
      // 检查是否离开了应用详情页面
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/apps/')) {
        selectItem(null, null)
      }
    }
  }, [selectItem])
  
  // --- BEGIN COMMENT ---
  // 包装handleSubmit，实现UI切换逻辑
  // --- END COMMENT ---
  const handleSubmit = useCallback(async (message: string, files?: any[]) => {
    try {
      // --- BEGIN COMMENT ---
      // 🎯 简化UI切换逻辑：立即响应用户操作
      // --- END COMMENT ---
      
      // 立即设置提交状态为 true
      setIsSubmitting(true)
      
      // 立即关闭欢迎界面
      setIsWelcomeScreen(false)
      
      console.log('[AppDetail] UI状态已更新，开始发送消息')
      
      // 调用原始的handleSubmit，它会创建对话并发送消息
      await originalHandleSubmit(message, files)
      
      console.log('[AppDetail] 消息发送成功，等待路由跳转')
    } catch (error) {
      console.error('[AppDetail] 发送消息失败:', error)
      
      // --- BEGIN COMMENT ---
      // 发送失败时恢复UI状态
      // --- END COMMENT ---
      setIsSubmitting(false)
      setIsWelcomeScreen(true)
    }
  }, [originalHandleSubmit, setIsWelcomeScreen])
  
  // --- BEGIN COMMENT ---
  // 错误状态
  // --- END COMMENT ---
  if (initError) {
    return (
      <div className={cn(
        "h-full w-full relative flex flex-col",
        colors.mainBackground.tailwind,
        "items-center justify-center"
      )}>
        <div className="text-center">
          <Blocks className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h2 className={cn(
            "text-xl font-semibold mb-2 font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            应用加载失败
          </h2>
          <p className={cn(
            "text-stone-500 mb-4 font-serif"
          )}>
            {initError}
          </p>
          <button
            onClick={() => router.push('/apps')}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors font-serif",
              isDark 
                ? "bg-stone-700 hover:bg-stone-600 text-stone-200" 
                : "bg-stone-200 hover:bg-stone-300 text-stone-800"
            )}
          >
            返回应用市场
          </button>
        </div>
      </div>
    )
  }
  
  // --- BEGIN COMMENT ---
  // 加载状态
  // --- END COMMENT ---
  if (isInitializing || isValidating || !currentApp) {
    return (
      <div className={cn(
        "h-full w-full relative flex flex-col",
        colors.mainBackground.tailwind,
        "items-center justify-center"
      )}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-stone-400 mx-auto mb-4 animate-spin" />
          <p className={cn(
            "text-stone-500 font-serif"
          )}>
            {isInitializing ? '正在加载应用...' : 
             isValidating ? '正在验证应用配置...' : 
             '加载中...'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "h-full w-full relative flex flex-col",
      colors.mainBackground.tailwind,
      colors.mainText.tailwind
    )}>
      <NavBar />
      
      {/* --- BEGIN COMMENT ---
      主要内容区域 - 使用简化的布局结构
      --- END COMMENT --- */}
      <div 
        className={cn(
          "relative flex-1 flex flex-col overflow-hidden min-h-0",
          "pt-10"
        )}
        style={{ '--chat-input-height': chatInputHeightVar } as React.CSSProperties}
      >
        {/* 主要内容 */}
        <div className="flex-1 min-h-0">
          {/* --- BEGIN COMMENT ---
          简化显示逻辑：使用useWelcomeScreen统一判断
          --- END COMMENT --- */}
          {isWelcomeScreen && messages.length === 0 ? (
            <div 
              className={cn(
                "h-full overflow-y-auto scroll-smooth",
                "w-full mx-auto",
                widthClass,
                paddingClass
              )}
            >
              <div className="py-8">
                <div className="mb-8">
                  <WelcomeScreen username={profile?.username} />
                </div>
              </div>
            </div>
          ) : (
            <div 
              ref={scrollRef}
              className="h-full overflow-y-auto scroll-smooth chat-scroll-container"
            >
              <ChatLoader 
                messages={messages} 
                isWaitingForResponse={isWaitingForResponse}
                isLoadingInitial={false}
              />
            </div>
          )}
        </div>

        {/* 滚动到底部按钮 */}
        <ScrollToBottomButton />

        {/* 输入框背景 */}
        <ChatInputBackdrop />
        
        {/* --- BEGIN COMMENT ---
        聊天输入框 - 简化配置
        --- END COMMENT --- */}
        <ChatInput
          onSubmit={handleSubmit}
          placeholder={`与 ${currentApp.display_name || '应用'} 开始对话...`}
          isProcessing={isProcessing}
          isWaiting={isWaitingForResponse}
          onStop={handleStopProcessing}
          showModelSelector={false}
          requireModelValidation={false}
        />
      </div>
    </div>
  )
} 