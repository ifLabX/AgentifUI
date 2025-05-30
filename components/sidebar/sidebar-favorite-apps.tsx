"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap, Bot, Plus, EyeOff } from "lucide-react"
import { cn } from "@lib/utils"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useChatStore } from "@lib/stores/chat-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"
import { SidebarButton } from "./sidebar-button"
import { MoreButtonV2 } from "@components/ui/more-button-v2"
import { DropdownMenuV2 } from "@components/ui/dropdown-menu-v2"

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
  const { isExpanded } = useSidebarStore()
  const { 
    favoriteApps, 
    removeFavoriteApp, 
    loadFavoriteApps,
    isLoading 
  } = useFavoriteAppsStore()

  // 下拉菜单状态管理
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  useEffect(() => {
    loadFavoriteApps()
  }, [loadFavoriteApps])

  // 监听sidebar展开状态，关闭时自动关闭dropdown
  useEffect(() => {
    if (!isExpanded && openDropdownId) {
      setOpenDropdownId(null)
    }
  }, [isExpanded, openDropdownId])

  // 限制显示最多5个常用应用
  const displayApps = favoriteApps.slice(0, 5)

  const handleAppClick = async (app: FavoriteApp) => {
    try {
      // 切换到指定应用
      await switchToSpecificApp(app.instanceId)
      
      // 跳转到应用详情页面
      router.push(`/apps/${app.instanceId}`)
      
    } catch (error) {
      console.error('切换到常用应用失败:', error)
    }
  }

  // 发起新对话 - 跳转到应用详情页面
  const handleStartNewChat = async (app: FavoriteApp) => {
    try {
      // 切换到指定应用
      await switchToSpecificApp(app.instanceId)
      
      // 跳转到应用详情页面
      router.push(`/apps/${app.instanceId}`)
      
    } catch (error) {
      console.error('发起新对话失败:', error)
    }
  }

  // 隐藏应用
  const handleHideApp = (app: FavoriteApp) => {
    removeFavoriteApp(app.instanceId)
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

  // 创建下拉菜单
  const createMoreActions = (app: FavoriteApp) => {
    const isMenuOpen = openDropdownId === app.instanceId

    const handleMenuOpenChange = (isOpen: boolean) => {
      setOpenDropdownId(isOpen ? app.instanceId : null)
    }

    return (
      <DropdownMenuV2
        placement="bottom"
        minWidth={120}
        isOpen={isMenuOpen}
        onOpenChange={handleMenuOpenChange}
        trigger={
          <MoreButtonV2
            aria-label="更多选项"
            disabled={false}
            isMenuOpen={isMenuOpen}
            isItemSelected={false}
            disableHover={!!openDropdownId && !isMenuOpen}
          />
        }
      >
        <DropdownMenuV2.Item
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => handleStartNewChat(app)}
        >
          发起新对话
        </DropdownMenuV2.Item>
        <DropdownMenuV2.Divider />
        <DropdownMenuV2.Item
          icon={<EyeOff className="w-3.5 h-3.5" />}
          onClick={() => handleHideApp(app)}
        >
          隐藏该应用
        </DropdownMenuV2.Item>
      </DropdownMenuV2>
    )
  }

  // 如果没有常用应用，不显示任何内容
  if (!isLoading && displayApps.length === 0) {
    return null
  }

  if (!contentVisible) return null

  return (
    <div className="flex flex-col space-y-1">
      {/* 标题 - 与近期对话标题样式完全一致 */}
      {displayApps.length > 0 && (
        <div className={cn(
          "flex items-center px-2 py-1 text-xs font-medium font-serif",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          常用应用
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className={cn(
          "px-2 py-1 text-xs font-serif",
          isDark ? "text-gray-500" : "text-gray-400"
        )}>
          加载中...
        </div>
      )}

      {/* 应用列表 - 贴边显示，与近期对话列表样式一致 */}
      {displayApps.length > 0 && (
        <div className="space-y-1 px-2">
          {displayApps.map((app) => (
            <div className="group relative" key={app.instanceId}>
              <SidebarButton
                icon={getAppIcon(app)}
                onClick={() => handleAppClick(app)}
                className={cn(
                  "w-full justify-start font-medium",
                  "transition-all duration-200 ease-in-out",
                  isDark 
                    ? "text-gray-300 hover:text-gray-100 hover:bg-stone-700/50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-stone-100"
                )}
              >
                <div className="flex-1 min-w-0 flex items-center">
                  {/* 应用名称 - 使用与近期对话一致的样式 */}
                  <span className="truncate font-serif text-xs font-medium">
                    {app.displayName}
                  </span>
                </div>
              </SidebarButton>
              
              {/* More button - 悬停时显示，添加z-10确保优先级 */}
              <div className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                "transition-opacity",
                openDropdownId === app.instanceId
                  ? "opacity-100" // 当前打开菜单的item，more button保持显示
                  : openDropdownId 
                    ? "opacity-0" // 有其他菜单打开时，此item的more button不显示
                    : "opacity-0 group-hover:opacity-100 focus-within:opacity-100" // 正常状态下的悬停显示
              )}>
                {createMoreActions(app)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 