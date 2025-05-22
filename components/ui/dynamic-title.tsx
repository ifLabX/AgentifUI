'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useChatStore } from '@lib/stores/chat-store'
import { useCombinedConversations } from '@lib/hooks/use-combined-conversations'

/**
 * 动态标题组件
 * 
 * 根据当前路由和对话状态动态更新网页标题
 * 确保与路由更新同步，处理加载状态和错误情况
 */
export function DynamicTitle() {
  // 获取当前路径
  const pathname = usePathname()
  
  // 从 chat store 获取当前对话 ID
  const currentConversationId = useChatStore(state => state.currentConversationId)
  
  // 使用 useCombinedConversations 获取对话列表
  const { conversations, isLoading } = useCombinedConversations()
  
  // 本地状态，用于跟踪标题更新状态
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastTitle, setLastTitle] = useState<string | null>(null)
  
  // 基础应用名称
  const baseTitle = 'if-agent-ui'
  useEffect(() => {
    // 标记开始更新标题
    setIsUpdating(true)
    
    // 默认标题
    let newTitle = baseTitle
    let fallbackTitle = '加载中... | ' + baseTitle
    
    try {
      // 如果是设置页面
      if (pathname?.startsWith('/settings')) {
        // 根据路径设置标题
        if (pathname === '/settings') {
          newTitle = '设置 | ' + baseTitle
        } else if (pathname === '/settings/profile') {
          newTitle = '个人资料 | ' + baseTitle
        } else if (pathname === '/settings/account') {
          newTitle = '账号设置 | ' + baseTitle
        } else if (pathname === '/settings/appearance') {
          newTitle = '外观设置 | ' + baseTitle
        } else {
          // 其他设置页面
          const settingName = pathname.split('/').pop() || ''
          const formattedName = settingName.charAt(0).toUpperCase() + settingName.slice(1)
          newTitle = `设置 - ${formattedName} | ${baseTitle}`
        }
      }
      // 如果是聊天页面
      else if (pathname?.startsWith('/chat')) {
        if (pathname === '/chat/new') {
          // 新对话页面
          newTitle = '新对话 | ' + baseTitle
        } else if (pathname === '/chat/recents') {
          // 历史对话页面
          newTitle = '历史对话 | ' + baseTitle
        } else if (currentConversationId) {
          // 查找当前对话
          const currentChat = conversations.find(chat => 
            chat.id === currentConversationId || chat.tempId === currentConversationId
          )
          
          if (currentChat) {
            // 如果找到对话，使用其标题
            const chatTitle = currentChat.title || '新对话'
            newTitle = `${chatTitle} | ${baseTitle}`
            
            // 不管是临时ID还是正在加载的对话，都使用相同的标题格式
            // 根据用户要求，不显示“(加载中...)”标记
            newTitle = `${chatTitle} | ${baseTitle}`
          } else if (isLoading) {
            // 如果对话列表正在加载，显示加载状态
            newTitle = fallbackTitle
          } else {
            // 如果找不到对话，但有ID，显示加载状态
            newTitle = fallbackTitle
            
            // 设置一个超时，如果一段时间后仍未找到对话，显示错误状态
            const timeoutId = setTimeout(() => {
              if (document.title === fallbackTitle) {
                document.title = `对话加载失败 | ${baseTitle}`
              }
            }, 5000) // 5秒后如果仍未加载，显示错误
            
            return () => clearTimeout(timeoutId)
          }
        }
      }
      
      // 保存上一次成功设置的标题
      if (newTitle !== fallbackTitle) {
        setLastTitle(newTitle)
      }
      
      // 设置网页标题
      document.title = newTitle
    } catch (error) {
      console.error('更新标题时出错:', error)
      
      // 发生错误时，使用上一次的标题或默认标题
      document.title = lastTitle || baseTitle
    } finally {
      // 标记标题更新完成
      setIsUpdating(false)
    }
    
    // 清理函数
    return () => {
      // 如果组件卸载，重置为基础标题
      if (document.title.includes('加载中')) {
        document.title = baseTitle
      }
    }
  }, [pathname, currentConversationId, conversations, isLoading, lastTitle, baseTitle])
  
  // 这个组件不渲染任何内容
  return null
}
