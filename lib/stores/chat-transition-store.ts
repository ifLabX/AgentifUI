import { create } from 'zustand';

/**
 * 聊天界面过渡状态管理
 * 
 * 用于控制聊天界面的过渡效果，特别是从对话界面到欢迎界面的过渡
 */
interface ChatTransitionState {
  // 是否正在从对话界面过渡到欢迎界面
  // 当为 true 时，使用闪烁效果而不是滑动
  isTransitioningToWelcome: boolean;
  
  // 设置过渡状态
  setIsTransitioningToWelcome: (value: boolean) => void;
}

export const useChatTransitionStore = create<ChatTransitionState>((set) => ({
  isTransitioningToWelcome: false,
  setIsTransitioningToWelcome: (value) => set({ isTransitioningToWelcome: value }),
}));
