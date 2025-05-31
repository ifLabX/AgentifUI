"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap, Bot, Plus, EyeOff } from "lucide-react"
import { cn } from "@lib/utils"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useChatStore } from "@lib/stores/chat-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"
import { SidebarListButton } from "./sidebar-list-button"
import { MoreButtonV2 } from "@components/ui/more-button-v2"
import { DropdownMenuV2 } from "@components/ui/dropdown-menu-v2"
import React from "react"

interface FavoriteApp {
  instanceId: string
  displayName: string
  description?: string
  iconUrl?: string
  appType: 'model' | 'marketplace'
  dify_apptype?: 'agent' | 'chatbot' | 'text-generation' | 'chatflow' | 'workflow'
}

interface SidebarFavoriteAppsProps {
  isDark: boolean
  contentVisible: boolean
}

export function SidebarFavoriteApps({ isDark, contentVisible }: SidebarFavoriteAppsProps) {
  const router = useRouter()
  const { switchToSpecificApp } = useCurrentApp()
  const { clearMessages } = useChatStore()
  const { isExpanded, selectItem, selectedType, selectedId } = useSidebarStore()
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

  // 判断应用是否处于选中状态 - 参考chat list的实现
  const isAppActive = React.useCallback((app: FavoriteApp) => {
    // 获取当前路由路径
    const pathname = window.location.pathname

    // 检查当前路由是否是应用详情页面
    if (!pathname.startsWith('/apps/')) return false

    // 🎯 修复：支持新的路由结构 /apps/{type}/[instanceId]
    const pathParts = pathname.split('/apps/')[1]?.split('/')
    if (!pathParts || pathParts.length < 2) return false
    
    const routeAppType = pathParts[0]  // 应用类型
    const routeInstanceId = pathParts[1]  // 实例ID
    
    // 基本的instanceId匹配
    if (routeInstanceId !== app.instanceId) return false
    
    // 检查应用类型是否匹配
    const appDifyType = app.dify_apptype || 'chatflow'
    return routeAppType === appDifyType
  }, [])

  const handleAppClick = async (app: FavoriteApp) => {
    try {
      // 设置sidebar选中状态
      selectItem('app', app.instanceId)

      // 切换到指定应用
      await switchToSpecificApp(app.instanceId)

      // 🎯 根据Dify应用类型跳转到对应页面
      const difyAppType = app.dify_apptype || 'chatflow'
      router.push(`/apps/${difyAppType}/${app.instanceId}`)

    } catch (error) {
      console.error('切换到常用应用失败:', error)
    }
  }

  // 发起新对话 - 跳转到应用详情页面
  const handleStartNewChat = async (app: FavoriteApp) => {
    try {
      // 设置sidebar选中状态
      selectItem('app', app.instanceId)

      // 切换到指定应用
      await switchToSpecificApp(app.instanceId)

      // 🎯 根据Dify应用类型跳转到对应页面
      const difyAppType = app.dify_apptype || 'chatflow'
      router.push(`/apps/${difyAppType}/${app.instanceId}`)

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
    return <Bot className="w-4 h-4" />

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
          {displayApps.map((app) => {
            // 使用路由判断应用是否被选中
            const isSelected = isAppActive(app)

            return (
              <div className="group relative" key={app.instanceId}>
                <SidebarListButton
                  icon={getAppIcon(app)}
                  onClick={() => handleAppClick(app)}
                  active={isSelected}
                  isLoading={false}
                  hasOpenDropdown={openDropdownId === app.instanceId}
                  disableHover={!!openDropdownId}
                  moreActionsTrigger={
                    <div className={cn(
                      "transition-opacity",
                      openDropdownId === app.instanceId
                        ? "opacity-100" // 当前打开菜单的item，more button保持显示
                        : openDropdownId
                          ? "opacity-0" // 有其他菜单打开时，此item的more button不显示
                          : "opacity-0 group-hover:opacity-100 focus-within:opacity-100" // 正常状态下的悬停显示
                    )}>
                      {createMoreActions(app)}
                    </div>
                  }
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
                </SidebarListButton>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 