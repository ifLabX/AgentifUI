import { create } from "zustand"

interface ChatInputState {
  // 聊天消息
  message: string
  setMessage: (message: string) => void
  clearMessage: () => void
  
  // 输入法状态
  isComposing: boolean
  setIsComposing: (isComposing: boolean) => void
  
  // 聊天界面状态
  isWelcomeScreen: boolean
  setIsWelcomeScreen: (isWelcome: boolean) => void

  // 暗黑模式
  isDark: boolean
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
}

export const useChatInputStore = create<ChatInputState>((set, get) => ({
  // 聊天消息
  message: "",
  setMessage: (message) => {
    // 防止与当前值相同的更新，避免不必要的状态变化
    if (get().message === message) return;
    set({ message });
  },
  clearMessage: () => set({ message: "" }),
  
  // 输入法状态
  isComposing: false,
  setIsComposing: (isComposingValue: boolean) => {
    if (get().isComposing !== isComposingValue) {
      set({ isComposing: isComposingValue });
    }
  },
  
  // 聊天界面状态
  isWelcomeScreen: true,
  setIsWelcomeScreen: (isWelcome) => set({ isWelcomeScreen: isWelcome }),

  // 暗黑模式
  isDark: false,
  toggleDarkMode: () => set((state) => ({ isDark: !state.isDark })),
  setDarkMode: (isDark) => set({ isDark }),
}))
