import { useRef, useEffect, useCallback } from 'react';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import debounce from 'lodash/debounce'; // --- BEGIN MODIFIED COMMENT ---
// 移除了未使用的 throttle 导入
// --- END MODIFIED COMMENT ---

// --- BEGIN COMMENT ---
// 滚动阈值，单位像素，距离底部多少像素被认为是“在底部”
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
  // --- BEGIN MODIFIED COMMENT ---
  // 用于跟踪程序化滚动
  // --- END MODIFIED COMMENT ---
  const isProgrammaticScroll = useRef(false); 


  // --- BEGIN COMMENT ---
  // Effect 1: 设置滚动监听器，处理用户交互，并同步滚动状态
  // --- END COMMENT ---
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    storeSetScrollRef(scrollRef as React.RefObject<HTMLElement>);

    const handleUserInteractionEnd = debounce(() => {
      isUserInteractingRef.current = false;
      // --- BEGIN COMMENT ---
      // 用户停止滚动后，如果由于新消息而存在待处理的滚动请求，
      // 如果用户恰好滚动到底部，此时触发该请求可能是个好主意。
      // 然而，为简单起见，我们将让常规的消息驱动效果来处理它。
      // --- END COMMENT ---
    }, 300); // --- BEGIN MODIFIED COMMENT ---
    // 最后一次滚动事件后 300 毫秒被视为“交互结束”
    // --- END MODIFIED COMMENT ---

    const handleScroll = () => { 
      isUserInteractingRef.current = true; 
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      userInteractionEndTimerRef.current = setTimeout(handleUserInteractionEnd, 300);

      const el = scrollRef.current;
      if (!el) return;
      const currentIsAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
      
      // --- BEGIN MODIFIED COMMENT ---
      // Store action 内部有检查机制
      // --- END MODIFIED COMMENT ---
      setIsAtBottom(currentIsAtBottom); 

      // --- BEGIN COMMENT ---
      // 仅根据用户的直接滚动操作更新 userScrolledUp，
      // 而不是作为程序化滚动的副作用。
      // --- END COMMENT ---
      if (!isProgrammaticScroll.current) {
        // --- BEGIN COMMENT ---
        // 如果不是程序化滚动，则任何偏离底部的行为都是用户主动向上滚动。
        // 如果用户滚动回底部，userScrolledUp 应为 false。
        // --- END COMMENT ---
        const newScrolledUpState = !currentIsAtBottom;
        if (userScrolledUp !== newScrolledUpState) {
          setUserScrolledUp(newScrolledUpState);
        }
      }
      // --- BEGIN COMMENT ---
      // 如果 isProgrammaticScroll.current 为 true，则 userScrolledUp 由程序化滚动管理
      // (即 storeScrollToBottom 在完成后将其设置为 false)。
      // --- END COMMENT ---
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
      handleUserInteractionEnd.cancel(); // --- BEGIN MODIFIED COMMENT ---
      // 取消 lodash debounce
      // --- END MODIFIED COMMENT ---
    };
  }, [scrollRef, storeSetScrollRef, setIsAtBottom, setUserScrolledUp]);


  // --- BEGIN COMMENT ---
  // 旧的 Effect 2 和 Effect 3 现已移除。
  // 新的自动滚动逻辑由下面的 effect 处理。
  // --- END COMMENT ---


  // --- BEGIN COMMENT ---
  // 新 Effect：基于 isGenerating 和 userScrolledUp 进行自动滚动
  // --- END COMMENT ---
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    // --- BEGIN COMMENT ---
    // 在 effect 内部从 store 获取最新状态通常更安全，
    // 以避免陈旧闭包的问题，尤其是在依赖项复杂
    // 或 effect 逻辑本身可能触发应立即反映的状态更改时。
    // 然而，对于标准的 hook 依赖项，依赖 hook 作用域中的值是典型的做法。
    // 这里，`isGenerating` 和 `userScrolledUp` 已经在依赖项数组中，
    // 因此当 effect 因它们的变化而运行时，它们将是最新的。
    // --- END COMMENT ---

    if (isGenerating && !userScrolledUp) {
      isProgrammaticScroll.current = true;
      storeScrollToBottom('smooth', () => {
        // --- BEGIN COMMENT ---
        // 此回调在滚动操作启动后（且 store 中的状态已设置）执行。
        // 对于 'smooth' 滚动，动画可能仍在进行中。
        // 我们在此处重置标志，接受在平滑滚动动画期间，
        // handleScroll 可能仍将 isProgrammaticScroll 视为 true。
        // 更高级的解决方案是检测实际滚动动画的结束。
        // --- END COMMENT ---
        isProgrammaticScroll.current = false;
      }); 
    }
  }, [messages, isGenerating, userScrolledUp, storeScrollToBottom, scrollRef]);

  // --- BEGIN COMMENT ---
  // Effect：当 AI 停止生成且用户已向上滚动时，重置 userScrolledUp
  // --- END COMMENT ---
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 如果生成刚停止 且 用户之前处于向上滚动的状态
    // --- END COMMENT ---
    if (!isGenerating && userScrolledUp) {
      setUserScrolledUp(false);
    }
    // --- BEGIN COMMENT ---
    // 当 isGenerating 改变（以检测其变为 false）
    // 或 userScrolledUp 改变（以确保正确评估条件）时，此 effect 应运行。
    // --- END COMMENT ---
  }, [isGenerating, userScrolledUp, setUserScrolledUp]);

  return scrollRef;
}
