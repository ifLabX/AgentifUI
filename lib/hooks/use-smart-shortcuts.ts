"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlatformKeys } from './use-platform-keys'
import { useChatStore } from '@lib/stores/chat-store'
import { useChatInputStore } from '@lib/stores/chat-input-store'
import { useChatTransitionStore } from '@lib/stores/chat-transition-store'
import { useChatInterface } from './use-chat-interface'
import { useSidebarStore } from '@lib/stores/sidebar-store'

/**
 * 快捷键分类定义
 */
export const SHORTCUT_CATEGORIES = {
  /** 导航类快捷键 - 即使在输入框中也应该可用 */
  NAVIGATION: 'navigation',
  /** 编辑类快捷键 - 输入框中应该禁用，避免冲突 */
  EDITING: 'editing',
  /** 系统类快捷键 - 始终可用 */
  SYSTEM: 'system'
} as const

type ShortcutCategory = typeof SHORTCUT_CATEGORIES[keyof typeof SHORTCUT_CATEGORIES]

/**
 * 快捷键定义接口
 */
export interface SmartShortcut {
  /** 快捷键组合 */
  keys: {
    key: string
    metaKey?: boolean
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
  }
  /** 快捷键分类 */
  category: ShortcutCategory
  /** 回调函数 */
  handler: (event: KeyboardEvent) => void
  /** 描述 */
  description: string
  /** 是否阻止默认行为 */
  preventDefault?: boolean
}

/**
 * 智能快捷键Hook
 * 
 * 特点：
 * 1. 导航类快捷键（如新对话、切换应用）即使在输入框中也可用
 * 2. 编辑类快捷键（如复制粘贴）在输入框中禁用，避免冲突
 * 3. 系统类快捷键始终可用
 * 
 * @param options 配置选项
 */
export function useSmartShortcuts(options: {
  /** 是否启用快捷键 */
  enabled?: boolean
  /** 自定义快捷键列表 */
  customShortcuts?: SmartShortcut[]
} = {}) {
  const { enabled = true, customShortcuts = [] } = options
  
  const router = useRouter()
  const platformKeys = usePlatformKeys()
  const { clearConversationState } = useChatInterface()
  
  useEffect(() => {
    if (!enabled) return
    
    // --- BEGIN COMMENT ---
    // 🎯 默认快捷键定义
    // 按分类组织，便于在不同场景下选择性启用
    // --- END COMMENT ---
    const defaultShortcuts: SmartShortcut[] = [
      // 导航类快捷键 - 即使在输入框中也可用
      {
        keys: { key: 'k', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac },
        category: SHORTCUT_CATEGORIES.NAVIGATION,
        handler: handleNewChat,
        description: '新对话',
        preventDefault: true
      },
      {
        keys: { key: 'h', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac },
        category: SHORTCUT_CATEGORIES.NAVIGATION,
        handler: () => router.push('/chat/history'),
        description: '历史对话',
        preventDefault: true
      },
      {
        keys: { key: 'a', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac, shiftKey: true },
        category: SHORTCUT_CATEGORIES.NAVIGATION, 
        handler: () => router.push('/apps'),
        description: '应用市场',
        preventDefault: true
      },
      // 系统类快捷键 - 始终可用
      {
        keys: { key: '\\', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac },
        category: SHORTCUT_CATEGORIES.SYSTEM,
        handler: () => {
          const { toggleSidebar } = useSidebarStore.getState()
          toggleSidebar()
        },
        description: '切换侧栏',
        preventDefault: true
      }
    ]
    
    // 合并默认快捷键和自定义快捷键
    const allShortcuts = [...defaultShortcuts, ...customShortcuts]
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable ||
                       target.closest('[contenteditable="true"]')
      
      // --- BEGIN COMMENT ---
      // 🎯 智能快捷键过滤逻辑
      // 根据当前焦点状态和快捷键分类决定是否执行
      // --- END COMMENT ---
      for (const shortcut of allShortcuts) {
        // 检查是否应该在当前上下文中执行此快捷键
        if (isInInput && shortcut.category === SHORTCUT_CATEGORIES.EDITING) {
          continue // 在输入框中时跳过编辑类快捷键
        }
        
        // 检查按键匹配
        if (matchesShortcut(event, shortcut.keys)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          
          console.log(`[SmartShortcuts] 执行快捷键: ${shortcut.description}`)
          shortcut.handler(event)
          return // 只执行第一个匹配的快捷键
        }
      }
    }
    
    // 新对话处理函数
    function handleNewChat() {
      const isAlreadyOnNewChat = window.location.pathname === '/chat/new'
      if (isAlreadyOnNewChat) {
        return
      }
      
      console.log('[SmartShortcuts] Cmd+K: 开始新对话')
      
      // 立即路由到新对话页面
      router.push('/chat/new')
      
      // 延迟清理状态，确保路由完成
      setTimeout(() => {
        // 清理chatStore状态
        const { clearMessages, setCurrentConversationId } = useChatStore.getState()
        const { setIsWelcomeScreen } = useChatInputStore.getState()
        const { setIsTransitioningToWelcome } = useChatTransitionStore.getState()
        const { selectItem } = useSidebarStore.getState()
        
        clearMessages()
        setCurrentConversationId(null)
        
        // 清理use-chat-interface中的对话状态
        clearConversationState()
        
        // 清理其他UI状态
        setIsWelcomeScreen(true)
        setIsTransitioningToWelcome(true)
        useChatStore.getState().setIsWaitingForResponse(false)
        
        selectItem('chat', null, true)
        
        console.log('[SmartShortcuts] 状态清理完成')
      }, 100)
    }
    
    // 快捷键匹配函数
    function matchesShortcut(event: KeyboardEvent, shortcutKeys: SmartShortcut['keys']): boolean {
      // 防止密码管理器等特殊事件触发toLowerCase错误
      if (!event.key || typeof event.key !== 'string') return false
      
      const keyMatch = event.key.toLowerCase() === shortcutKeys.key.toLowerCase()
      const metaMatch = shortcutKeys.metaKey ? event.metaKey : !event.metaKey
      const ctrlMatch = shortcutKeys.ctrlKey ? event.ctrlKey : !event.ctrlKey
      const shiftMatch = shortcutKeys.shiftKey ? event.shiftKey : !event.shiftKey
      const altMatch = shortcutKeys.altKey ? event.altKey : !event.altKey
      
      return keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch
    }
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown)
    
    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, customShortcuts, router, platformKeys.isMac, clearConversationState])
  
  // --- BEGIN COMMENT ---
  // 🎯 返回快捷键管理工具函数
  // 便于组件获取当前可用的快捷键信息
  // --- END COMMENT ---
  return {
    /** 获取当前上下文可用的快捷键列表 */
    getAvailableShortcuts: (context: 'input' | 'normal' = 'normal'): SmartShortcut[] => {
      const defaultShortcuts: SmartShortcut[] = [
        {
          keys: { key: 'k', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: '新对话'
        },
        {
          keys: { key: 'h', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: '历史对话'
        },
        {
          keys: { key: 'a', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac, shiftKey: true },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: '应用市场'
        },
        {
          keys: { key: '\\', metaKey: platformKeys.isMac, ctrlKey: !platformKeys.isMac },
          category: SHORTCUT_CATEGORIES.SYSTEM,
          handler: () => {},
          description: '切换侧栏'
        }
      ]
      
      const allShortcuts = [...defaultShortcuts, ...customShortcuts]
      
      if (context === 'input') {
        // 在输入框中时，只返回导航和系统类快捷键
        return allShortcuts.filter(s => 
          s.category === SHORTCUT_CATEGORIES.NAVIGATION || 
          s.category === SHORTCUT_CATEGORIES.SYSTEM
        )
      }
      
      return allShortcuts
    }
  }
}

/**
 * 创建自定义快捷键的辅助函数
 */
export function createShortcut(
  keys: SmartShortcut['keys'],
  category: ShortcutCategory,
  handler: (event: KeyboardEvent) => void,
  description: string,
  preventDefault: boolean = true
): SmartShortcut {
  return {
    keys,
    category,
    handler,
    description,
    preventDefault
  }
} 