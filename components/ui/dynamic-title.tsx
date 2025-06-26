'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useChatStore } from '@lib/stores/chat-store'
import { useCombinedConversations } from '@lib/hooks/use-combined-conversations'
import { useAppListStore } from '@lib/stores/app-list-store'

/**
 * 动态标题组件 - 重构版本
 * 
 * 采用稳定的标题管理策略，防止状态冲突导致的标题回退问题
 * 核心原则：
 * 1. 优先级管理：明确不同数据源的优先级
 * 2. 防抖机制：避免频繁的标题更新
 * 3. 状态缓存：保留上一次有效的标题作为fallback
 * 4. 分离关注点：将标题计算逻辑与状态监听分离
 */
export function DynamicTitle() {
  // --- 状态获取 ---
  const pathname = usePathname()
  const currentConversationId = useChatStore(state => state.currentConversationId)
  const { conversations, isLoading: isConversationsLoading } = useCombinedConversations()
  const { apps, isLoading: isAppsLoading } = useAppListStore()
  
  // --- 本地状态管理 ---
  const [currentTitle, setCurrentTitle] = useState<string>('AgentifUI')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // --- 状态缓存 ---
  const stableStateRef = useRef<{
    lastValidConversationTitle: string | null;
    lastValidAppTitle: string | null;
    lastKnownConversationId: string | null;
    titleUpdateCount: number;
  }>({
    lastValidConversationTitle: null,
    lastValidAppTitle: null,
    lastKnownConversationId: null,
    titleUpdateCount: 0
  })
  
  // --- 防抖定时器 ---
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // 基础应用名称
  const baseTitle = 'AgentifUI'
  
  // --- 辅助函数：获取设置页面标题 ---
  const getSettingsTitle = useCallback((path: string): string => {
    if (path === '/settings') return '设置 | ' + baseTitle
    if (path === '/settings/profile') return '个人资料 | ' + baseTitle
    if (path === '/settings/account') return '账号设置 | ' + baseTitle
    if (path === '/settings/appearance') return '外观设置 | ' + baseTitle
    
    const settingName = path.split('/').pop() || ''
    const formattedName = settingName.charAt(0).toUpperCase() + settingName.slice(1)
    return `设置 - ${formattedName} | ${baseTitle}`
  }, [baseTitle])
  
  // --- 辅助函数：获取管理页面标题 ---
  const getAdminTitle = useCallback((path: string): string => {
    if (path === '/admin') return '管理后台 | ' + baseTitle
    if (path === '/admin/users') return '用户管理 | ' + baseTitle
    if (path === '/admin/organizations') return '组织管理 | ' + baseTitle
    if (path === '/admin/api-config') return 'API配置 | ' + baseTitle
    if (path === '/admin/security') return '安全设置 | ' + baseTitle
    if (path === '/admin/analytics') return '数据分析 | ' + baseTitle
    if (path === '/admin/content') return '关于与通知 | ' + baseTitle
    
    const adminSection = path.split('/').pop() || ''
    const formattedName = adminSection.charAt(0).toUpperCase() + adminSection.slice(1)
    return `管理后台 - ${formattedName} | ${baseTitle}`
  }, [baseTitle])
  
  // --- 辅助函数：获取应用标题 ---
  const getAppTitle = useCallback((
    path: string, 
    appsList: any[], 
    isLoading: boolean
  ): { title: string; isStable: boolean } => {
    const pathSegments = path.split('/')
    if (pathSegments.length >= 4) {
      const instanceId = pathSegments[3]
      
      const targetApp = appsList.find(app => app.instance_id === instanceId)
      if (targetApp) {
        const appDisplayName = targetApp.display_name || targetApp.name || instanceId
        return { 
          title: `${appDisplayName} | ${baseTitle}`, 
          isStable: true 
        }
      }
      
      if (isLoading) {
        return { 
          title: '加载应用... | ' + baseTitle, 
          isStable: false 
        }
      }
    }
    
    return { title: baseTitle, isStable: false }
  }, [baseTitle])
  
  // --- 辅助函数：获取聊天标题 ---
  const getChatTitle = useCallback((
    conversationId: string,
    conversationsList: any[],
    isLoading: boolean
  ): { title: string; isStable: boolean } => {
    const currentChat = conversationsList.find(chat => 
      chat.id === conversationId || chat.tempId === conversationId
    )
    
    if (currentChat) {
      const chatTitle = currentChat.title || '新对话'
      return { 
        title: `${chatTitle} | ${baseTitle}`, 
        isStable: true 
      }
    }
    
    if (isLoading) {
      return { 
        title: '加载对话... | ' + baseTitle, 
        isStable: false 
      }
    }
    
    return { title: baseTitle, isStable: false }
  }, [baseTitle])
  
  // --- 标题计算逻辑 ---
  const calculateTitle = useCallback((
    currentPath: string | null,
    conversationId: string | null,
    conversationsList: any[],
    appsList: any[],
    isConvLoading: boolean,
    isAppsDataLoading: boolean
  ): { title: string; priority: number; isStable: boolean } => {
    
    // 优先级说明：数值越小优先级越高
    // 1-10: 确定性强的标题（路由相关）
    // 11-20: 动态内容标题（对话、应用）
    // 90+: fallback标题
    
    try {
      // --- 静态路由标题（最高优先级，最稳定）---
      if (currentPath?.startsWith('/settings')) {
        const settingsTitle = getSettingsTitle(currentPath)
        return { title: settingsTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/login')) {
        return { title: '登录 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/register')) {
        return { title: '注册 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/phone-login')) {
        return { title: '手机号登录 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/admin')) {
        const adminTitle = getAdminTitle(currentPath)
        return { title: adminTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/reset-password')) {
        return { title: '重置密码 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/about')) {
        return { title: '关于 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/forgot-password')) {
        return { title: '忘记密码 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      if (currentPath?.startsWith('/sso/processing')) {
        return { title: 'SSO登录处理中 | ' + baseTitle, priority: 1, isStable: true }
      }
      
      // --- 应用相关标题 ---
      if (currentPath?.startsWith('/apps')) {
        if (currentPath === '/apps') {
          return { title: '应用市场 | ' + baseTitle, priority: 2, isStable: true }
        }
        
        // 应用详情页面 - 增强匹配逻辑
        const appTitle = getAppTitle(currentPath, appsList, isAppsDataLoading)
        if (appTitle.title !== baseTitle) {
          // 成功获取到应用标题，缓存它
          stableStateRef.current.lastValidAppTitle = appTitle.title
          return { title: appTitle.title, priority: 11, isStable: appTitle.isStable }
        }
        
        // 如果无法获取当前应用标题，但有缓存的应用标题，使用缓存
        if (stableStateRef.current.lastValidAppTitle) {
          return { 
            title: stableStateRef.current.lastValidAppTitle, 
            priority: 85, 
            isStable: false 
          }
        }
        
        // 根据应用类型提供更具体的fallback标题
        if (currentPath.includes('/agent/')) {
          return { title: 'Agent应用 | ' + baseTitle, priority: 90, isStable: false }
        } else if (currentPath.includes('/chatbot/')) {
          return { title: 'Chatbot应用 | ' + baseTitle, priority: 90, isStable: false }
        } else if (currentPath.includes('/chatflow/')) {
          return { title: 'Chatflow应用 | ' + baseTitle, priority: 90, isStable: false }
        } else if (currentPath.includes('/workflow/')) {
          return { title: 'Workflow应用 | ' + baseTitle, priority: 90, isStable: false }
        } else if (currentPath.includes('/text-generation/')) {
          return { title: '文本生成应用 | ' + baseTitle, priority: 90, isStable: false }
        }
        
        return { title: '应用详情 | ' + baseTitle, priority: 95, isStable: false }
      }
      
      // --- 聊天相关标题 ---
      if (currentPath?.startsWith('/chat')) {
        if (currentPath === '/chat/new') {
          return { title: '新对话 | ' + baseTitle, priority: 2, isStable: true }
        }
        
        if (currentPath === '/chat/history') {
          return { title: '历史对话 | ' + baseTitle, priority: 2, isStable: true }
        }
        
        if (conversationId) {
          const chatTitle = getChatTitle(
            conversationId, 
            conversationsList, 
            isConvLoading
          )
          
          if (chatTitle.title !== baseTitle && !chatTitle.title.includes('加载中')) {
            // 成功获取到对话标题，缓存它
            stableStateRef.current.lastValidConversationTitle = chatTitle.title
            stableStateRef.current.lastKnownConversationId = conversationId
            return { 
              title: chatTitle.title, 
              priority: 12, 
              isStable: chatTitle.isStable 
            }
          }
          
          // 如果当前对话ID和上次已知的相同，且有缓存标题，使用缓存
          if (conversationId === stableStateRef.current.lastKnownConversationId && 
              stableStateRef.current.lastValidConversationTitle) {
            return { 
              title: stableStateRef.current.lastValidConversationTitle, 
              priority: 80, 
              isStable: false 
            }
          }
          
          // 对话数据仍在加载中，使用温和的加载提示
          if (isConvLoading) {
            return { title: '加载对话... | ' + baseTitle, priority: 95, isStable: false }
          }
          
          // 完全找不到对话
          return { title: '对话不存在 | ' + baseTitle, priority: 98, isStable: false }
        }
        
        // 在聊天页面但没有具体对话ID，默认情况
        if (currentPath === '/chat') {
          return { title: '聊天 | ' + baseTitle, priority: 3, isStable: true }
        }
        
        // 其他聊天子页面
        return { title: '聊天 | ' + baseTitle, priority: 4, isStable: true }
      }
      
      // --- 默认首页 ---
      return { title: baseTitle, priority: 99, isStable: true }
      
    } catch (error) {
      console.error('计算标题时出错:', error)
      return { title: baseTitle, priority: 100, isStable: false }
    }
  }, [baseTitle, getSettingsTitle, getAdminTitle, getAppTitle, getChatTitle])
  
  // --- 防抖更新标题 ---
  const debouncedUpdateTitle = useCallback((newTitle: string, priority: number, isStable: boolean) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    // 如果是稳定的高优先级标题，立即更新
    if (isStable && priority <= 10) {
      setCurrentTitle(newTitle)
      document.title = newTitle
      stableStateRef.current.titleUpdateCount++
      return
    }
    
    // 其他情况使用防抖
    updateTimeoutRef.current = setTimeout(() => {
      setCurrentTitle(newTitle)
      document.title = newTitle
      stableStateRef.current.titleUpdateCount++
    }, isStable ? 50 : 200) // 稳定标题延迟更短
  }, [])
  
  // --- 智能标题更新逻辑 ---
  const titleInfo = useMemo(() => 
    calculateTitle(
      pathname,
      currentConversationId,
      conversations,
      apps,
      isConversationsLoading,
      isAppsLoading
    ),
    [
      pathname, 
      currentConversationId, 
      conversations, 
      apps, 
      isConversationsLoading, 
      isAppsLoading, 
      calculateTitle
    ]
  )
  
  // --- 主要副作用：监听标题变化 ---
  useEffect(() => {
    setIsUpdating(true)
    
    const { title: newTitle, priority, isStable } = titleInfo
    
    // 只有在标题真正改变时才更新
    if (newTitle !== currentTitle) {
      console.log(`[DynamicTitle] 标题更新: "${currentTitle}" -> "${newTitle}" (优先级: ${priority}, 稳定: ${isStable})`)
      debouncedUpdateTitle(newTitle, priority, isStable)
    }
    
    setIsUpdating(false)
  }, [titleInfo, currentTitle, debouncedUpdateTitle])
  
  // --- 清理副作用 ---
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])
  
  // --- 组件卸载时重置标题 ---
  useEffect(() => {
    return () => {
      if (document.title.includes('加载中') || document.title.includes('加载')) {
        document.title = baseTitle
      }
    }
  }, [baseTitle])
  
  return null
}

