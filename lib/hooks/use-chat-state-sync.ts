import { useEffect } from 'react'
import { useTheme } from './use-theme'
import { useWelcomeScreen } from './use-welcome-screen'
import { useChatInputStore } from '@lib/stores/chat-input-store'

/**
 * 聊天状态同步钩子
 * 
 * 使用zustand实现简单的状态同步，将全局主题和欢迎屏幕状态同步到聊天输入组件
 */
export function useChatStateSync() {
  const { isDark } = useTheme()
  const { isWelcomeScreen } = useWelcomeScreen()
  
  // 直接从store获取所需的actions
  const setDarkMode = useChatInputStore(state => state.setDarkMode)
  const setIsWelcomeScreen = useChatInputStore(state => state.setIsWelcomeScreen)
  
  // 同步主题状态
  useEffect(() => {
    setDarkMode(isDark)
  }, [isDark, setDarkMode])
  
  // 同步欢迎屏幕状态
  useEffect(() => {
    setIsWelcomeScreen(isWelcomeScreen)
  }, [isWelcomeScreen, setIsWelcomeScreen])
  
  // --- BEGIN MODIFIED COMMENT ---
  // 返回当前状态和设置函数，方便页面使用
  // --- END MODIFIED COMMENT ---
  return { isDark, isWelcomeScreen, setIsWelcomeScreen }
} 