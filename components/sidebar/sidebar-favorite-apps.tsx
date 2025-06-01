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

  // 新增：点击状态管理，提供即时反馈
  const [clickingAppId, setClickingAppId] = useState<string | null>(null)

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

  // 🎯 优化：重构点击处理逻辑，提供即时反馈和更好的错误处理
  const handleAppClick = async (app: FavoriteApp) => {
    // 🎯 防止重复点击
    if (clickingAppId === app.instanceId) {
      console.log('[FavoriteApps] 防止重复点击:', app.instanceId)
      return
    }

    try {
      // 🎯 立即设置点击状态，提供视觉反馈
      setClickingAppId(app.instanceId)
      console.log('[FavoriteApps] 开始切换到常用应用:', app.displayName)

      // 🎯 立即设置sidebar选中状态，提供即时反馈
      selectItem('app', app.instanceId)

      // 🎯 立即开始路由跳转，不等待应用切换完成
      // 这样用户能立即看到页面开始切换
      const difyAppType = app.dify_apptype || 'chatflow'
      const targetPath = `/apps/${difyAppType}/${app.instanceId}`
      
      // 🎯 并行执行：路由跳转和应用切换同时进行
      const routerPromise = router.push(targetPath)
      const switchPromise = switchToSpecificApp(app.instanceId)

      // 🎯 等待路由跳转完成（通常很快），不等待应用切换
      // 应用切换在后台继续进行
      await routerPromise
      
      console.log('[FavoriteApps] 路由跳转完成，应用切换在后台继续')

      // 🎯 在后台等待应用切换完成，但不阻塞用户界面
      switchPromise.catch(error => {
        console.error('[FavoriteApps] 后台应用切换失败:', error)
        // 不显示错误给用户，因为页面已经跳转了
        // 应用详情页面会处理应用切换失败的情况
      })

    } catch (error) {
      console.error('[FavoriteApps] 切换到常用应用失败:', error)
      
      // 🎯 错误处理：如果路由跳转失败，尝试恢复状态
      selectItem(null, null) // 清除选中状态
    } finally {
      // 🎯 清除点击状态，允许后续点击
      setClickingAppId(null)
    }
  }

  // 🎯 优化：发起新对话的处理逻辑也使用相同的优化策略
  const handleStartNewChat = async (app: FavoriteApp) => {
    // 防止重复点击
    if (clickingAppId === app.instanceId) {
      return
    }

    try {
      setClickingAppId(app.instanceId)
      console.log('[FavoriteApps] 发起新对话:', app.displayName)

      // 立即设置sidebar选中状态
      selectItem('app', app.instanceId)

      // 立即跳转，不等待应用切换
      const difyAppType = app.dify_apptype || 'chatflow'
      const targetPath = `/apps/${difyAppType}/${app.instanceId}`
      
      // 并行执行
      const routerPromise = router.push(targetPath)
      const switchPromise = switchToSpecificApp(app.instanceId)

      await routerPromise
      
      // 后台处理应用切换
      switchPromise.catch(error => {
        console.error('[FavoriteApps] 发起新对话时应用切换失败:', error)
      })

    } catch (error) {
      console.error('[FavoriteApps] 发起新对话失败:', error)
      selectItem(null, null)
    } finally {
      setClickingAppId(null)
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
    // 🎯 检查当前应用是否正在处理中
    const isAppBusy = clickingAppId === app.instanceId

    const handleMenuOpenChange = (isOpen: boolean) => {
      // 🎯 如果应用正在处理中，不允许打开菜单
      if (isAppBusy && isOpen) {
        return
      }
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
            disabled={isAppBusy} // 🎯 应用忙碌时禁用
            isMenuOpen={isMenuOpen}
            isItemSelected={false}
            disableHover={!!openDropdownId && !isMenuOpen}
          />
        }
      >
        <DropdownMenuV2.Item
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => {
            // 🎯 点击后立即关闭菜单，避免状态冲突
            setOpenDropdownId(null)
            handleStartNewChat(app)
          }}
          disabled={isAppBusy} // 🎯 应用忙碌时禁用
        >
          发起新对话
        </DropdownMenuV2.Item>
        <DropdownMenuV2.Divider />
        <DropdownMenuV2.Item
          icon={<EyeOff className="w-3.5 h-3.5" />}
          onClick={() => {
            setOpenDropdownId(null)
            handleHideApp(app)
          }}
          disabled={isAppBusy} // 🎯 应用忙碌时禁用
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
            // 🎯 新增：检查当前应用是否正在点击中
            const isClicking = clickingAppId === app.instanceId

            return (
              <div className="group relative" key={app.instanceId}>
                <SidebarListButton
                  icon={getAppIcon(app)}
                  onClick={() => handleAppClick(app)}
                  active={isSelected}
                  isLoading={isClicking} // 🎯 显示点击加载状态
                  hasOpenDropdown={openDropdownId === app.instanceId}
                  disableHover={!!openDropdownId || isClicking} // 🎯 点击时禁用悬停
                  moreActionsTrigger={
                    <div className={cn(
                      "transition-opacity",
                      // 🎯 点击时隐藏more button，避免干扰
                      isClicking
                        ? "opacity-0 pointer-events-none"
                        : openDropdownId === app.instanceId
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
                    // 🎯 点击时的特殊样式
                    isClicking && "opacity-75 cursor-wait",
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
                    {/* 🎯 新增：点击时显示状态提示 */}
                    {isClicking && (
                      <span className={cn(
                        "ml-2 text-xs opacity-75 font-serif",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        切换中...
                      </span>
                    )}
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