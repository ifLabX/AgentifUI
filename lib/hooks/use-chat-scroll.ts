import { useRef, useEffect, useCallback } from 'react';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import debounce from 'lodash/debounce'; // Removed unused throttle import

const SCROLL_THRESHOLD = 50; // Pixels from bottom to be considered "at bottom"

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

  // Track if user is actively interacting with scrollbar
  const isUserInteractingRef = useRef(false); 
  // Timer for detecting end of user scroll interaction
  const userInteractionEndTimerRef = useRef<NodeJS.Timeout | null>(null); 
  const isProgrammaticScroll = useRef(false); // Added for tracking programmatic scrolls


  // Effect 1: Setup scroll listener, handle user interaction, and sync scroll state
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    storeSetScrollRef(scrollRef as React.RefObject<HTMLElement>);

    const handleUserInteractionEnd = debounce(() => {
      isUserInteractingRef.current = false;
      // After user stops scrolling, if there was a pending scroll request due to new messages,
      // it might be good to trigger it now if they landed at the bottom.
      // However, for simplicity, we'll let the regular message-driven effect handle it.
    }, 300); // 300ms after last scroll event is considered "interaction ended"

    const handleScroll = () => { 
      isUserInteractingRef.current = true; 
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      userInteractionEndTimerRef.current = setTimeout(handleUserInteractionEnd, 300);

      const el = scrollRef.current;
      if (!el) return;
      const currentIsAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
      
      setIsAtBottom(currentIsAtBottom); // Store action has internal check

      // Only update userScrolledUp based on user's direct scroll actions,
      // not as a side effect of programmatic scrolling.
      if (!isProgrammaticScroll.current) {
        // If it's not a programmatic scroll, then any deviation from the bottom is user-initiated scrolling up.
        // And if user scrolls back to bottom, userScrolledUp should be false.
        const newScrolledUpState = !currentIsAtBottom;
        if (userScrolledUp !== newScrolledUpState) {
          setUserScrolledUp(newScrolledUpState);
        }
      }
      // If isProgrammaticScroll.current is true, userScrolledUp is managed by the programmatic scroll
      // (i.e., storeScrollToBottom sets it to false upon completion).
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    // Initial state sync
    const initialIsAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < SCROLL_THRESHOLD;
    setIsAtBottom(initialIsAtBottom);
    setUserScrolledUp(!initialIsAtBottom);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      handleUserInteractionEnd.cancel(); // Cancel lodash debounce
    };
  }, [scrollRef, storeSetScrollRef, setIsAtBottom, setUserScrolledUp]);


  // Old Effect 2 and Effect 3 are now removed.
  // The new automatic scrolling logic is handled by the effect below.


  // New Effect for Automatic Scrolling based on isGenerating and userScrolledUp
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      // console.log('[useChatScroll] Auto-scroll: No element');
      return;
    }

    // It's often safer to get the latest state from stores inside effects
    // to avoid issues with stale closures, especially if dependencies are complex
    // or if the effect logic itself might trigger state changes that should be immediately reflected.
    // However, for standard hook dependencies, relying on the values from the hook's scope is typical.
    // Here, `isGenerating` and `userScrolledUp` are already in the dependency array,
    // so they will be up-to-date when the effect runs due to their change.

    // console.log(`[useChatScroll] Auto-scroll check: isGenerating=${isGenerating}, userScrolledUp=${userScrolledUp}, messages.length=${messages.length}`);

    if (isGenerating && !userScrolledUp) {
      // console.log('[useChatScroll] Auto-scrolling triggered: isGenerating=true, userScrolledUp=false');
      isProgrammaticScroll.current = true;
      storeScrollToBottom('smooth', () => {
        // This callback is executed after the scroll action is initiated (and states in store are set).
        // For 'smooth' scroll, the animation might still be ongoing.
        // We reset the flag here, accepting that during the smooth scroll animation,
        // handleScroll might still see isProgrammaticScroll as true.
        // A more advanced solution would be to detect actual scroll animation end.
        isProgrammaticScroll.current = false;
        // console.log('[useChatScroll] Programmatic scroll ended (via callback), flag reset.');
      }); 
    }
  }, [messages, isGenerating, userScrolledUp, storeScrollToBottom, scrollRef]);

  // Effect to reset userScrolledUp when AI stops generating if user was scrolled up
  useEffect(() => {
    // If generation has just stopped AND the user was previously in a scrolled-up state
    if (!isGenerating && userScrolledUp) {
      // console.log('[useChatScroll] AI finished generating, resetting userScrolledUp to false.');
      setUserScrolledUp(false);
    }
    // This effect should run when isGenerating changes (to detect it becoming false)
    // or when userScrolledUp changes (to ensure the condition is correctly evaluated).
  }, [isGenerating, userScrolledUp, setUserScrolledUp]);

  return scrollRef;
}
