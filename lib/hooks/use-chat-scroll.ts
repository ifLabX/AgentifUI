import { useRef, useEffect, useCallback } from 'react';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import debounce from 'lodash/debounce'; // --- BEGIN MODIFIED COMMENT ---
// 移除了未使用的 throttle 导入
// --- END MODIFIED COMMENT ---

// --- BEGIN COMMENT ---
// 滚动阈值，单位像素，距离底部多少像素被认为是"在底部"
// --- END COMMENT ---
const SCROLL_THRESHOLD = 50; 

export function useChatScroll(messages: ChatMessage[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    userScrolledUp, 
    setUserScrolledUp, 
    setIsAtBottom,
    setScrollRef: storeSetScrollRef,
    scrollToBottom: storeScrollToBottom, 
  } = useChatScrollStore();

  const isGenerating = useChatStore(selectIsProcessing);

  // --- BEGIN COMMENT ---
  // 跟踪用户是否正在与滚动条交互
  // --- END COMMENT ---
  const isUserInteractingRef = useRef(false); 
  // --- BEGIN COMMENT ---
  // 用于检测用户滚动交互结束的计时器
  // --- END COMMENT ---
  const userInteractionEndTimerRef = useRef<NodeJS.Timeout | null>(null); 
  // --- BEGIN COMMENT ---
  // 用于跟踪程序化滚动
  // --- END COMMENT ---
  const isProgrammaticScroll = useRef(false); 

  // --- BEGIN COMMENT ---
  // 🎯 新增：跟踪用户是否有意向上滚动的标志
  // 一旦用户在流式期间向上滚动，就记住这个意图，直到流式结束
  // --- END COMMENT ---
  const userIntentionallyScrolledUp = useRef(false);

  // --- BEGIN COMMENT ---
  // Effect 1: 设置滚动监听器，处理用户交互，并同步滚动状态
  // --- END COMMENT ---
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    storeSetScrollRef(scrollRef as React.RefObject<HTMLElement>);

    const handleUserInteractionEnd = debounce(() => {
      isUserInteractingRef.current = false;
    }, 300);

    const handleScroll = () => { 
      isUserInteractingRef.current = true; 
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      userInteractionEndTimerRef.current = setTimeout(handleUserInteractionEnd, 300);

      const el = scrollRef.current;
      if (!el) return;
      const currentIsAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
      
      // --- BEGIN COMMENT ---
      // 🎯 修复：始终更新 isAtBottom 状态，不管是否在程序化滚动中
      // 这确保按钮的显示/隐藏逻辑能正确工作
      // --- END COMMENT ---
      setIsAtBottom(currentIsAtBottom);

      // --- BEGIN COMMENT ---
      // 🎯 修复：改进用户滚动意图检测逻辑
      // --- END COMMENT ---
      if (!isProgrammaticScroll.current) {
        // 用户主动滚动
        const newScrolledUpState = !currentIsAtBottom;
        
        // --- BEGIN COMMENT ---
        // 🎯 关键修复：如果用户在流式期间向上滚动，记住这个意图
        // --- END COMMENT ---
        if (isGenerating && newScrolledUpState && !userIntentionallyScrolledUp.current) {
          console.log('[useChatScroll] 检测到用户在流式期间向上滚动，记住用户意图');
          userIntentionallyScrolledUp.current = true;
        }
        
        if (userScrolledUp !== newScrolledUpState) {
          setUserScrolledUp(newScrolledUpState);
        }
      } else {
        // --- BEGIN COMMENT ---
        // 🎯 修复：即使在程序化滚动期间，也要检查用户是否有向上滚动的意图
        // 如果用户之前表达了向上滚动的意图，且当前不在底部，保持 userScrolledUp 状态
        // --- END COMMENT ---
        if (userIntentionallyScrolledUp.current && !currentIsAtBottom) {
          if (!userScrolledUp) {
            console.log('[useChatScroll] 程序化滚动期间保持用户向上滚动意图');
            setUserScrolledUp(true);
          }
        }
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    // --- BEGIN COMMENT ---
    // 初始状态同步
    // --- END COMMENT ---
    const initialIsAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < SCROLL_THRESHOLD;
    setIsAtBottom(initialIsAtBottom);
    setUserScrolledUp(!initialIsAtBottom);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      handleUserInteractionEnd.cancel();
    };
  }, [scrollRef, storeSetScrollRef, setIsAtBottom, setUserScrolledUp, isGenerating, userScrolledUp]);

  // --- BEGIN COMMENT ---
  // 🎯 修复：改进自动滚动逻辑，尊重用户的滚动意图
  // --- END COMMENT ---
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    // --- BEGIN COMMENT ---
    // 🎯 关键修复：只有在用户没有表达向上滚动意图时才自动滚动
    // --- END COMMENT ---
    if (isGenerating && !userScrolledUp && !userIntentionallyScrolledUp.current) {
      isProgrammaticScroll.current = true;
      storeScrollToBottom('smooth', () => {
        isProgrammaticScroll.current = false;
      }); 
    }
  }, [messages, isGenerating, userScrolledUp, storeScrollToBottom, scrollRef]);

  // --- BEGIN COMMENT ---
  // 🎯 修复：当流式生成结束时，重置用户意图标志
  // --- END COMMENT ---
  useEffect(() => {
    if (!isGenerating) {
      // --- BEGIN COMMENT ---
      // 流式生成结束，重置用户向上滚动意图标志
      // --- END COMMENT ---
      if (userIntentionallyScrolledUp.current) {
        console.log('[useChatScroll] 流式生成结束，重置用户向上滚动意图标志');
        userIntentionallyScrolledUp.current = false;
      }
      
      // --- BEGIN COMMENT ---
      // 如果用户之前处于向上滚动状态，保持这个状态
      // 不要自动重置为 false，让用户自己决定是否滚动到底部
      // --- END COMMENT ---
    }
  }, [isGenerating]);

  return scrollRef;
}
