"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useMobile, useChatWidth, useChatStateSync } from "@lib/hooks"
import { cn } from "@lib/utils"
import { 
  Loader2,
  Blocks
} from "lucide-react"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useChatStore } from "@lib/stores/chat-store"
import { useAppListStore } from "@lib/stores/app-list-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { WelcomeScreen } from "@components/chat/welcome-screen"
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
  // 同步主题状态到ChatInput，确保主题切换后样式正确
  // --- END COMMENT ---
  useChatStateSync()
  
  // --- BEGIN COMMENT ---
  // Sidebar选中状态管理
  // --- END COMMENT ---
  const { selectItem } = useSidebarStore()
  
  // --- BEGIN COMMENT ---
  // 状态管理
  // --- END COMMENT ---
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  
  // --- BEGIN COMMENT ---
  // 应用相关状态
  // --- END COMMENT ---
  const { apps, fetchApps } = useAppListStore()
  const { 
    currentAppId, 
    currentAppInstance, 
    isValidating, 
    switchToSpecificApp,
    error: appError 
  } = useCurrentApp()
  const { clearMessages } = useChatStore()
  const { profile } = useProfile()
  
  // --- BEGIN COMMENT ---
  // 获取当前应用实例数据
  // --- END COMMENT ---
  const currentApp = apps.find(app => app.instance_id === instanceId)
  const appMetadata = currentApp?.config?.app_metadata
  const difyParams = currentApp?.config?.dify_parameters
  
  // --- BEGIN COMMENT ---
  // 页面初始化：切换到目标应用并同步sidebar选中状态
  // --- END COMMENT ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true)
        setInitError(null)
        
        // 确保应用列表已加载
        if (apps.length === 0) {
          await fetchApps()
        }
        
        // 检查应用是否存在
        const targetApp = apps.find(app => app.instance_id === instanceId)
        if (!targetApp) {
          setInitError('应用不存在')
          return
        }
        
        // 应用存在时设置sidebar选中状态
        selectItem('app', instanceId)
        
        // 如果当前应用不是目标应用，则切换
        if (currentAppId !== instanceId) {
          console.log('[AppDetail] 切换到应用:', instanceId)
          await switchToSpecificApp(instanceId)
        }
        
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
  }, [instanceId, apps, currentAppId, fetchApps, switchToSpecificApp, selectItem])
  
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
  // 处理消息提交
  // --- END COMMENT ---
  const handleSubmit = (message: string) => {
    // 清空当前消息并开始新对话
    clearMessages()
    // 跳转到聊天页面并发送消息
    router.push(`/chat/new?message=${encodeURIComponent(message)}`)
  }
  
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
            返回应用广场
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
      {/* --- 主要内容区域 - 使用与聊天页面相同的响应式布局 --- */}
      <div className={cn(
        "relative flex-1 flex flex-col overflow-hidden min-h-0",
        "pt-10"
      )}>
        {/* 主要内容 */}
        <div className="flex-1 min-h-0">
          <div className={cn(
            "h-full overflow-y-auto scroll-smooth"
          )}>
            {/* --- 使用统一的宽度管理系统 --- */}
            <div className={cn(
              "w-full mx-auto py-8",
              widthClass,
              paddingClass
            )}>
              {/* 欢迎文字 */}
              <div className="mb-8">
                <WelcomeScreen username={profile?.full_name} />
              </div>
              
              {/* 聊天输入框 */}
              <div className="pb-16">
                <ChatInput
                  onSubmit={handleSubmit}
                  placeholder={`与 ${currentApp.display_name || '应用'} 开始对话...`}
                  requireModelValidation={false}
                  showModelSelector={false}
                  isWelcomeScreen={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 