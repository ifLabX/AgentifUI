import { create } from 'zustand'

interface TypewriterState {
  isWelcomeTypewriterComplete: boolean
  setWelcomeTypewriterComplete: (complete: boolean) => void
  resetWelcomeTypewriter: () => void
}

/**
 * 打字机状态管理
 * 用于协调欢迎文字打字机和推荐问题的显示时机
 */
export const useTypewriterStore = create<TypewriterState>((set) => ({
  isWelcomeTypewriterComplete: false,
  
  setWelcomeTypewriterComplete: (complete: boolean) => {
    console.log('[TypewriterStore] 欢迎文字打字机状态:', complete ? '完成' : '重置')
    set({ isWelcomeTypewriterComplete: complete })
  },
  
  resetWelcomeTypewriter: () => {
    console.log('[TypewriterStore] 重置欢迎文字打字机状态')
    set({ isWelcomeTypewriterComplete: false })
  }
})) 