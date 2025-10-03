import { create } from 'zustand';

import { RefObject } from 'react';

/**
 * Chat scroll state interface
 * Manages scroll position, user scroll intent, and scroll actions for chat UI
 */
interface ChatScrollState {
  /** Whether the user has manually scrolled up (not at the chat bottom).
   *  If true, auto-scroll to bottom is disabled. */
  userScrolledUp: boolean;
  /** Update userScrolledUp state */
  setUserScrolledUp: (scrolledUp: boolean) => void;
  /** Whether the scroll is currently at the bottom */
  isAtBottom: boolean;
  /** Update isAtBottom state */
  setIsAtBottom: (isBottom: boolean) => void;
  /** Ref to the scrollable chat container */
  scrollRef: RefObject<HTMLElement> | null;
  /** Set the scrollRef */
  setScrollRef: (ref: RefObject<HTMLElement>) => void;
  /** Scroll to the bottom of the chat, with optional behavior and callback */
  scrollToBottom: (behavior?: ScrollBehavior, onScrollEnd?: () => void) => void;
  /** Reset scroll state and scroll to bottom, with optional callback */
  resetScrollState: (onScrollEnd?: () => void) => void;
}

/**
 * Zustand store for managing chat scroll state and actions
 */
export const useChatScrollStore = create<ChatScrollState>((set, get) => ({
  // Initial state: user is at the bottom, auto-scroll enabled
  userScrolledUp: false,
  isAtBottom: true,
  scrollRef: null,

  // Update userScrolledUp state only if changed
  setUserScrolledUp: scrolledUp => {
    if (get().userScrolledUp !== scrolledUp) {
      set({ userScrolledUp: scrolledUp });
    }
  },

  // Update isAtBottom state only if changed
  setIsAtBottom: isBottom => {
    if (get().isAtBottom !== isBottom) {
      set({ isAtBottom: isBottom });
    }
  },

  // Set the scrollRef only if changed
  setScrollRef: ref => {
    if (get().scrollRef !== ref) {
      set({ scrollRef: ref });
    }
  },

  /**
   * Scroll to the bottom of the chat container.
   * Uses requestAnimationFrame for smoothness.
   * After scrolling, checks if actually at bottom and updates state accordingly.
   * Optionally calls onScrollEnd callback.
   */
  scrollToBottom: (behavior = 'auto', onScrollEnd) => {
    const { scrollRef } = get();
    if (scrollRef?.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: behavior,
          });

          // Delay state update to allow scroll event handlers to run first,
          // preventing override of user scroll intent
          setTimeout(
            () => {
              if (scrollRef.current) {
                const element = scrollRef.current;
                const currentIsAtBottom =
                  element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight <
                  50;

                // Only update state if actually at bottom
                if (currentIsAtBottom) {
                  const currentState = get();
                  if (
                    currentState.userScrolledUp !== false ||
                    currentState.isAtBottom !== true
                  ) {
                    set({ userScrolledUp: false, isAtBottom: true });
                  }
                }
              }

              if (onScrollEnd) {
                onScrollEnd();
              }
            },
            behavior === 'smooth' ? 100 : 0 // Smooth scroll may need more time
          );
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
  },

  /**
   * Reset scroll state and scroll to bottom.
   * Used when user explicitly requests to jump to bottom.
   * Forces state and scroll position, then calls optional callback.
   */
  resetScrollState: onScrollEnd => {
    set({ userScrolledUp: false, isAtBottom: true });

    const { scrollRef } = get();
    if (scrollRef?.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'auto',
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
  },
}));
