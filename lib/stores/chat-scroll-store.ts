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
  scrollToBottom: (behavior?: ScrollBehavior, onScrollEnd?: () => void) => void; // Added onScrollEnd
  // 添加重置滚动状态的方法
  resetScrollState: (onScrollEnd?: () => void) => void; // Added onScrollEnd
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
      // console.log(`[ChatScrollStore] Setting userScrolledUp to: ${scrolledUp}`);
      set({ userScrolledUp: scrolledUp });
    }
  },
  setIsAtBottom: (isBottom) => {
    if (get().isAtBottom !== isBottom) {
      // console.log(`[ChatScrollStore] Setting isAtBottom to: ${isBottom}`);
      set({ isAtBottom: isBottom });
    }
  },
  setScrollRef: (ref) => {
    if (get().scrollRef !== ref) {
      set({ scrollRef: ref });
    }
  },
  
  // 增强版 scrollToBottom 方法，确保一定会滚动到底部
  scrollToBottom: (behavior = 'auto', onScrollEnd) => { // Added onScrollEnd parameter
    const { scrollRef } = get();
    if (scrollRef?.current) {
      requestAnimationFrame(() => { 
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: behavior
          });
          // Ensure state is consistent after programmatic scroll
          if (get().userScrolledUp !== false || get().isAtBottom !== true) {
            set({ userScrolledUp: false, isAtBottom: true });
          }
          // Call the onScrollEnd callback if provided
          if (onScrollEnd) {
            onScrollEnd();
          }
        } else {
          // If scrollRef.current became null somehow, still call onScrollEnd
          if (onScrollEnd) {
            onScrollEnd();
          }
        }
      });
    } else {
      // If there's no scrollRef, call onScrollEnd immediately
      if (onScrollEnd) {
        onScrollEnd();
      }
    }
  },
  
  // 添加一个新方法，用于关键事件后重置滚动状态
  resetScrollState: (onScrollEnd) => { // Added onScrollEnd parameter
    // Set state first, then scroll if ref is available
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
