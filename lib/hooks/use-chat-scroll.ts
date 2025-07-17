import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import {
  ChatMessage,
  selectIsProcessing,
  useChatStore,
} from '@lib/stores/chat-store';
import debounce from 'lodash/debounce';

import { useEffect, useRef } from 'react';

// Scroll threshold in pixels - distance from bottom considered "at bottom"
const SCROLL_THRESHOLD = 50;

/**
 * Chat scroll management hook
 * @description Manages auto-scrolling behavior during chat streaming and user interactions
 *
 * @param messages - Array of chat messages
 * @returns Scroll container ref
 *
 * @features
 * - Auto-scroll during message streaming
 * - Respect user scroll intentions
 * - Debounced scroll event handling
 * - Programmatic vs user scroll detection
 */
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

  // Track whether user is actively interacting with scrollbar
  const isUserInteractingRef = useRef(false);
  // Timer for detecting end of user scroll interaction
  const userInteractionEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track programmatic scrolling
  const isProgrammaticScroll = useRef(false);

  // Track user's intentional upward scroll during streaming
  // Once user scrolls up during streaming, remember this intent until streaming ends
  const userIntentionallyScrolledUp = useRef(false);

  // Effect 1: Set up scroll listener, handle user interactions, and sync scroll state
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
      userInteractionEndTimerRef.current = setTimeout(
        handleUserInteractionEnd,
        300
      );

      const el = scrollRef.current;
      if (!el) return;
      const currentIsAtBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;

      // Always update isAtBottom state regardless of programmatic scroll
      // This ensures button show/hide logic works correctly
      setIsAtBottom(currentIsAtBottom);

      // Improved user scroll intent detection logic
      if (!isProgrammaticScroll.current) {
        // User-initiated scroll
        const newScrolledUpState = !currentIsAtBottom;

        // Key fix: If user scrolls up during streaming, remember this intent
        if (
          isGenerating &&
          newScrolledUpState &&
          !userIntentionallyScrolledUp.current
        ) {
          console.log(
            '[useChatScroll] Detected user scroll up during streaming, remembering user intent'
          );
          userIntentionallyScrolledUp.current = true;
        }

        if (userScrolledUp !== newScrolledUpState) {
          setUserScrolledUp(newScrolledUpState);
        }
      } else {
        // Even during programmatic scroll, check if user has upward scroll intent
        // If user previously expressed upward scroll intent and not at bottom, maintain userScrolledUp state
        if (userIntentionallyScrolledUp.current && !currentIsAtBottom) {
          if (!userScrolledUp) {
            console.log(
              '[useChatScroll] Maintaining user upward scroll intent during programmatic scroll'
            );
            setUserScrolledUp(true);
          }
        }
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    // Initial state sync
    const initialIsAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight <
      SCROLL_THRESHOLD;
    setIsAtBottom(initialIsAtBottom);
    setUserScrolledUp(!initialIsAtBottom);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      handleUserInteractionEnd.cancel();
    };
  }, [
    scrollRef,
    storeSetScrollRef,
    setIsAtBottom,
    setUserScrolledUp,
    isGenerating,
    userScrolledUp,
  ]);

  // Improved auto-scroll logic that respects user scroll intentions
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    // Key fix: Only auto-scroll when user hasn't expressed upward scroll intent
    if (
      isGenerating &&
      !userScrolledUp &&
      !userIntentionallyScrolledUp.current
    ) {
      isProgrammaticScroll.current = true;
      storeScrollToBottom('smooth', () => {
        isProgrammaticScroll.current = false;
      });
    }
  }, [messages, isGenerating, userScrolledUp, storeScrollToBottom, scrollRef]);

  // Reset user intent flag when streaming generation ends
  useEffect(() => {
    if (!isGenerating) {
      // Streaming generation ended, reset user upward scroll intent flag
      if (userIntentionallyScrolledUp.current) {
        console.log(
          '[useChatScroll] Streaming ended, resetting user upward scroll intent flag'
        );
        userIntentionallyScrolledUp.current = false;
      }

      // If user was previously in upward scroll state, maintain this state
      // Don't auto-reset to false, let user decide whether to scroll to bottom
    }
  }, [isGenerating]);

  return scrollRef;
}
