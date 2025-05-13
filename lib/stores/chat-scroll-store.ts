import { create } from 'zustand';
import { RefObject } from 'react';

// --- BEGIN COMMENT ---
// 定义滚动状态接口
// --- END COMMENT ---
interface ChatScrollState {
  // --- BEGIN COMMENT ---
  // 标记用户是否已手动向上滚动，离开聊天底部。
  // 如果为 true，则禁用自动滚动到底部的行为。
  // --- END COMMENT ---
  userScrolledUp: boolean;
  // --- BEGIN COMMENT ---
  // 更新 userScrolledUp 状态的方法。
  // --- END COMMENT ---
  setUserScrolledUp: (scrolledUp: boolean) => void;
  isAtBottom: boolean;
  setIsAtBottom: (isBottom: boolean) => void;
  scrollRef: RefObject<HTMLElement> | null;
  setScrollRef: (ref: RefObject<HTMLElement>) => void;
  scrollToBottom: (behavior?: ScrollBehavior, onScrollEnd?: () => void) => void;
  // --- BEGIN COMMENT ---
  // 添加重置滚动状态的方法
  // --- END COMMENT ---
  resetScrollState: (onScrollEnd?: () => void) => void;
}

// --- BEGIN COMMENT ---
// 创建 Zustand store 来管理聊天滚动状态。
// --- END COMMENT ---
export const useChatScrollStore = create<ChatScrollState>((set, get) => ({
  // --- BEGIN COMMENT ---
  // 初始状态：默认用户在底部，自动滚动是激活的。
  // --- END COMMENT ---
  userScrolledUp: false,
  isAtBottom: true,
  scrollRef: null,
  // --- BEGIN COMMENT ---
  // 实现状态更新方法。
  // --- END COMMENT ---
  setUserScrolledUp: (scrolledUp) => {
    if (get().userScrolledUp !== scrolledUp) {
      set({ userScrolledUp: scrolledUp });
    }
  },
  setIsAtBottom: (isBottom) => {
    if (get().isAtBottom !== isBottom) {
      set({ isAtBottom: isBottom });
    }
  },
  setScrollRef: (ref) => {
    if (get().scrollRef !== ref) {
      set({ scrollRef: ref });
    }
  },
  
  // --- BEGIN COMMENT ---
  // 增强版 scrollToBottom 方法，确保一定会滚动到底部
  // --- END COMMENT ---
  scrollToBottom: (behavior = 'auto', onScrollEnd) => {
    const { scrollRef } = get();
    if (scrollRef?.current) {
      requestAnimationFrame(() => { 
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: behavior
          });
          // --- BEGIN COMMENT ---
          // 确保程序化滚动后状态一致
          // --- END COMMENT ---
          if (get().userScrolledUp !== false || get().isAtBottom !== true) {
            set({ userScrolledUp: false, isAtBottom: true });
          }
          // --- BEGIN COMMENT ---
          // 如果提供了 onScrollEnd 回调，则调用它
          // --- END COMMENT ---
          if (onScrollEnd) {
            onScrollEnd();
          }
        } else {
          // --- BEGIN COMMENT ---
          // 如果 scrollRef.current 不知何故变为空，仍然调用 onScrollEnd
          // --- END COMMENT ---
          if (onScrollEnd) {
            onScrollEnd();
          }
        }
      });
    } else {
      // --- BEGIN COMMENT ---
      // 如果没有 scrollRef，立即调用 onScrollEnd
      // --- END COMMENT ---
      if (onScrollEnd) {
        onScrollEnd();
      }
    }
  },
  
  // --- BEGIN COMMENT ---
  // 添加一个新方法，用于关键事件后重置滚动状态
  // --- END COMMENT ---
  resetScrollState: (onScrollEnd) => {
    // --- BEGIN COMMENT ---
    // 首先设置状态，如果 ref 可用则滚动
    // --- END COMMENT ---
    if (get().userScrolledUp !== false || get().isAtBottom !== true) {
      set({ userScrolledUp: false, isAtBottom: true });
    }
    const { scrollRef } = get();
    if (scrollRef?.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'auto' 
          });
          if (onScrollEnd) {
            onScrollEnd();
          }
        } else {
          if (onScrollEnd) {
            onScrollEnd();
          }
        }
      });
    } else {
      if (onScrollEnd) {
        onScrollEnd();
      }
    }
  }
}));
