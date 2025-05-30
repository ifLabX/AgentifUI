"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, Sparkles, Zap, Bot } from "lucide-react"
import { cn } from "@lib/utils"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useChatStore } from "@lib/stores/chat-store"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"
import { SidebarButton } from "./sidebar-button"

interface FavoriteApp {
  instanceId: string
  displayName: string
  description?: string
  iconUrl?: string
  appType: 'model' | 'marketplace'
}

interface SidebarFavoriteAppsProps {
  isDark: boolean
  contentVisible: boolean
}

export function SidebarFavoriteApps({ isDark, contentVisible }: SidebarFavoriteAppsProps) {
  const router = useRouter()
  const { switchToSpecificApp } = useCurrentApp()
  const { clearMessages } = useChatStore()
  const { 
    favoriteApps, 
    removeFavoriteApp, 
    loadFavoriteApps,
    isLoading 
  } = useFavoriteAppsStore()

  useEffect(() => {
    loadFavoriteApps()
  }, [loadFavoriteApps])

  // 限制显示最多5个常用应用
  const displayApps = favoriteApps.slice(0, 5)

  const handleAppClick = async (app: FavoriteApp) => {
    try {
      // 切换到指定应用
      await switchToSpecificApp(app.instanceId)
      
      // 清除当前聊天状态
      clearMessages()
      
      // 跳转到新对话页面
      router.push('/chat/new')
      
    } catch (error) {
      console.error('切换到常用应用失败:', error)
    }
  }

  // 获取应用图标
  const getAppIcon = (app: FavoriteApp) => {
    if (app.iconUrl) {
      return (
        <img 
          src={app.iconUrl} 
          alt={app.displayName}
          className="w-4 h-4 rounded-sm object-cover"
        />
      )
    }

    // 根据应用类型返回不同图标
    if (app.appType === 'model') {
      return <Bot className="w-4 h-4" />
    } else {
      return <Zap className="w-4 h-4" />
    }
  }

  // 如果没有常用应用，不显示任何内容
  if (!isLoading && displayApps.length === 0) {
    return null
  }

  return (
    <div className={cn(
      "transition-opacity duration-150 ease-in-out",
      contentVisible ? "opacity-100" : "opacity-0"
    )}>
      {/* 标题 - 只在有应用时显示 */}
      {displayApps.length > 0 && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 mb-2",
          "text-xs font-medium uppercase tracking-wider font-serif",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          <Star className="w-3 h-3" />
          <span>常用应用</span>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className={cn(
          "px-3 py-2 text-xs font-serif",
          isDark ? "text-gray-500" : "text-gray-400"
        )}>
          加载中...
        </div>
      )}

      {/* 应用列表 */}
      <div className="space-y-1">
        {displayApps.map((app) => (
          <SidebarButton
            key={app.instanceId}
            icon={getAppIcon(app)}
            onClick={() => handleAppClick(app)}
            className={cn(
              "group relative w-full justify-start font-medium",
              "transition-all duration-200 ease-in-out",
              isDark 
                ? "text-gray-300 hover:text-gray-100 hover:bg-stone-700/50" 
                : "text-gray-700 hover:text-gray-900 hover:bg-stone-100"
            )}
          >
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {/* 应用名称 */}
              <span className="truncate font-serif text-sm">
                {app.displayName}
              </span>
              
              {/* 应用类型标识 */}
              <div className={cn(
                "flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                app.appType === 'model'
                  ? (isDark 
                      ? "bg-green-900/30 text-green-400" 
                      : "bg-green-50 text-green-700")
                  : (isDark 
                      ? "bg-blue-900/30 text-blue-400" 
                      : "bg-blue-50 text-blue-700")
              )}>
                {app.appType === 'model' ? '模型' : '应用'}
              </div>
            </div>

            {/* 悬停时显示的移除按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFavoriteApp(app.instanceId)
              }}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "ml-2",
                isDark 
                  ? "hover:bg-red-900/30 text-red-400 hover:text-red-300" 
                  : "hover:bg-red-50 text-red-500 hover:text-red-600"
              )}
              aria-label={`移除 ${app.displayName}`}
            >
              <span className="text-xs">×</span>
            </button>
          </SidebarButton>
        ))}
      </div>

      {/* 分隔线 - 只在有应用时显示 */}
      {displayApps.length > 0 && (
        <div className={cn(
          "mt-4 mx-3 h-px",
          isDark ? "bg-gray-700/60" : "bg-gray-200/50"
        )} />
      )}
    </div>
  )
} 