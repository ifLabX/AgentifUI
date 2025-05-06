import { useRef, useEffect, useCallback } from 'react';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import throttle from 'lodash/throttle';
import { ChatMessage } from '@lib/stores/chat-store'; // 引入 ChatMessage 类型

// --- BEGIN COMMENT ---
// useChatScroll Hook
// 负责管理聊天容器的自动滚动行为。
// 返回一个 ref，应将其附加到 *主* 可滚动聊天容器元素上 (通常是页面级或布局级的容器)。
//
// 功能：
// 1. 当依赖项 (dep) 改变时 (通常是消息列表长度)，如果用户未手动向上滚动，则自动滚动到底部。
// 2. 监听滚动事件，检测用户是否手动滚动。
// 3. 如果用户向上滚动，则禁用自动滚动。
// 4. 如果用户滚动回底部，则重新启用自动滚动。
// 5. 尝试区分程序化滚动和用户滚动，以避免错误地禁用自动滚动。
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// 定义滚动判断的阈值（像素）
// 当滚动位置距离底部小于此值时，我们认为用户在底部
// --- END COMMENT ---
const SCROLL_THRESHOLD = 50;

// --- BEGIN COMMENT ---
// 定义 NavBar 高度和下方间距 (需要与实际 NavBar 高度 h-12 匹配)
// --- END COMMENT ---
const NAVBAR_HEIGHT_PX = 48; // NavBar h-12 高度 (3rem = 48px)
const MARGIN_BELOW_NAVBAR_PX = 16; // 滚动到 NavBar 下方留出的额外间距 (1rem = 16px)

// 检查是否为流式响应的函数 (简化，假设最后一个消息有 isStreaming 属性)
const isStreamingResponse = (messages: ChatMessage[]): boolean => {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const lastMessage = messages[messages.length - 1];
  return lastMessage && lastMessage.isStreaming === true;
}

export function useChatScroll<T extends HTMLElement>(
  messages: ChatMessage[], // 依赖改为整个 messages 数组
) {
  const scrollRef = useRef<T>(null);
  const prevMessagesRef = useRef<ChatMessage[]>([]); // 存储上一次的 messages
  const animationFrameRef = useRef<number | null>(null); 
  
  const { 
    userScrolledUp, 
    setUserScrolledUp, 
    isAtBottom, // 读取 isAtBottom 状态
    setIsAtBottom,
    setScrollRef,
  } = useChatScrollStore();

  // --- BEGIN COMMENT ---
  // 使用常量定义的 NavBar 高度和边距
  // --- END COMMENT ---
  const navBarHeight = NAVBAR_HEIGHT_PX; 
  const marginBelowNavBar = MARGIN_BELOW_NAVBAR_PX;

  // --- BEGIN COMMENT ---
  // 注册 scrollRef 到 store
  // --- END COMMENT ---
  useEffect(() => {
    if (scrollRef.current) {
      setScrollRef(scrollRef as React.RefObject<HTMLElement>);
      const element = scrollRef.current;
      const atBottomNow = element.scrollHeight - element.scrollTop - element.clientHeight < SCROLL_THRESHOLD;
      if (isAtBottom !== atBottomNow) {
        setIsAtBottom(atBottomNow);
      }
      if (!atBottomNow && !useChatScrollStore.getState().userScrolledUp) { 
        setUserScrolledUp(true);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [setScrollRef, setIsAtBottom, setUserScrolledUp, userScrolledUp, isAtBottom]);

  // --- BEGIN COMMENT ---
  // 使用 useCallback 和 throttle 优化滚动事件处理函数
  // 减少 throttle 时间从 100ms 到 50ms 使滚动更平滑
  // --- END COMMENT ---
  const handleScroll = useCallback(throttle(() => {
    const element = scrollRef.current;
    if (element) {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const currentAtBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
      const currentScrolledUp = !currentAtBottom;
      
      if (currentAtBottom !== useChatScrollStore.getState().isAtBottom) {
        setIsAtBottom(currentAtBottom);
      }
      if (currentScrolledUp !== useChatScrollStore.getState().userScrolledUp) {
        setUserScrolledUp(currentScrolledUp);
      }
    }
  }, 50), [setIsAtBottom, setUserScrolledUp]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => {
        element.removeEventListener('scroll', handleScroll);
        handleScroll.cancel();
      };
    }
  }, [handleScroll]);

  // CONSOLIDATED SCROLL LOGIC EFFECT
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    if (!Array.isArray(messages)) {
      console.warn('[useChatScroll] messages prop is not an array. Aborting scroll logic for this cycle.');
      return;
    }

    const prevMessages = prevMessagesRef.current; 
    const currentMessages = messages; 
    let newLastUserMessage: ChatMessage | null = null;

    if (currentMessages.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage.isUser) {
        const prevWasEmptyOrDifferent = !Array.isArray(prevMessages) || prevMessages.length === 0 || 
                                      (prevMessages.length > 0 && lastMessage.id !== prevMessages[prevMessages.length - 1]?.id);
        if (currentMessages.length > prevMessages.length || prevWasEmptyOrDifferent) {
          newLastUserMessage = lastMessage;
        }
      }
    }
    
    if (newLastUserMessage && newLastUserMessage.id) {
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        const messageElement = scrollRef.current.querySelector(`[data-message-id="${newLastUserMessage!.id}"]`) as HTMLElement;
        
        if (messageElement) {
          let targetScrollTop = messageElement.offsetTop - navBarHeight - marginBelowNavBar;
          targetScrollTop = Math.max(0, targetScrollTop);
          
          scrollRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'auto'
          });
          
          setUserScrolledUp(true);
          const atBottomAfterScroll = scrollRef.current.scrollHeight - targetScrollTop - scrollRef.current.clientHeight < SCROLL_THRESHOLD;
          setIsAtBottom(atBottomAfterScroll);
        } else {
          if (!useChatScrollStore.getState().userScrolledUp) {
             scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
             setIsAtBottom(true);
          }
        }
      });
      prevMessagesRef.current = [...currentMessages];
      return;
    }

    if (!userScrolledUp) { 
      const streaming = isStreamingResponse(messages);
      if (streaming) {
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        if (distanceFromBottom < SCROLL_THRESHOLD * 3) {
          animationFrameRef.current = requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
              setIsAtBottom(true);
            }
          });
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(() => {
          if (scrollRef.current) {
            if (element.scrollHeight - element.scrollTop - element.clientHeight >= SCROLL_THRESHOLD) {
               scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
            }
            setIsAtBottom(true);
          }
        });
      }
    }

    prevMessagesRef.current = [...currentMessages];

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [messages, userScrolledUp, navBarHeight, marginBelowNavBar, setIsAtBottom, setUserScrolledUp]);
  
  return scrollRef; // 返回 ref
} 