import { useRef, useEffect, useCallback, useState } from 'react';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import { ChatMessage } from '@lib/stores/chat-store';

const SCROLL_THRESHOLD = 50; // Pixels from bottom to be considered "at bottom"
// For streaming, how far from bottom user can be for auto-scroll to still engage
const STREAMING_AUTO_SCROLL_MAX_DISTANCE = SCROLL_THRESHOLD * 4; 
// When streaming, only scroll if we are further than this from the actual bottom
const MIN_DISTANCE_FOR_STREAMING_SCROLL_ACTION = 5; 

export function useChatScroll(messages: ChatMessage[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    setUserScrolledUp, 
    setIsAtBottom,
    setScrollRef: storeSetScrollRef,
    // scrollToBottom action from store is NOT used directly by effects that respond to messages
    // to prevent its state-setting副作用 from causing loops with message updates.
    // Effects responding to messages will call raw scrollTo if needed.
  } = useChatScrollStore();

  // Track if user is actively interacting with scrollbar
  const isUserInteractingRef = useRef(false);
  // Timer for detecting end of user scroll interaction
  const userInteractionEndTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to track previous messages state for precise change detection
  const prevMessagesLengthRef = useRef(messages.length);
  const prevLastMessageIdRef = useRef<string | null>(messages.length > 0 ? messages[messages.length - 1].id : null);
  const prevLastMessageTextLengthRef = useRef<number>(messages.length > 0 ? messages[messages.length - 1].text.length : 0);
  
  // State to signal a scroll request from message changes
  // 'auto' or 'smooth' for behavior, or null if no request
  const [scrollRequest, setScrollRequest] = useState<ScrollBehavior | null>(null);


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

    const handleScroll = () => { // Not throttled, but sets a flag and uses debounce for end
      isUserInteractingRef.current = true;
      if (userInteractionEndTimerRef.current) {
        clearTimeout(userInteractionEndTimerRef.current);
      }
      userInteractionEndTimerRef.current = setTimeout(handleUserInteractionEnd, 300);

      const el = scrollRef.current;
      if (!el) return;
      const currentIsAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
      const currentScrolledUp = !currentIsAtBottom;
      
      setIsAtBottom(currentIsAtBottom); // Store action has internal check
      setUserScrolledUp(currentScrolledUp); // Store action has internal check
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


  // Effect 2: Detect message changes and set a scroll request
  useEffect(() => {
    const currentMessages = messages;
    const userIsCurrentlyScrolledUp = useChatScrollStore.getState().userScrolledUp;

    const newMessagesAdded = currentMessages.length > prevMessagesLengthRef.current;
    const lastMessageIdChanged = currentMessages.length > 0 && 
                                 currentMessages[currentMessages.length - 1].id !== prevLastMessageIdRef.current;
    
    let lastMessageTextChanged = false;
    if (currentMessages.length > 0 && !newMessagesAdded && !lastMessageIdChanged) {
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (!lastMessage.isUser && lastMessage.isStreaming) {
            lastMessageTextChanged = lastMessage.text.length > prevLastMessageTextLengthRef.current;
        }
    }

    let shouldScroll: ScrollBehavior | null = null;

    if (newMessagesAdded || lastMessageIdChanged) {
      const newLastMessage = currentMessages[currentMessages.length - 1];
      if (newLastMessage.isUser) {
        shouldScroll = 'auto'; // User sent a message, always scroll
      } else if (!userIsCurrentlyScrolledUp) { // New assistant message and user is at/near bottom
        shouldScroll = 'smooth';
      }
    } else if (lastMessageTextChanged) { // Streaming update to the existing last message
      if (!userIsCurrentlyScrolledUp) {
        shouldScroll = 'smooth'; // Request smooth scroll for streaming
      }
    }

    if (shouldScroll) {
      setScrollRequest(shouldScroll);
    }

    // Update refs for the next comparison
    prevMessagesLengthRef.current = currentMessages.length;
    if (currentMessages.length > 0) {
      prevLastMessageIdRef.current = currentMessages[currentMessages.length - 1].id;
      prevLastMessageTextLengthRef.current = currentMessages[currentMessages.length - 1].text.length;
    } else {
      prevLastMessageIdRef.current = null;
      prevLastMessageTextLengthRef.current = 0;
    }
  }, [messages]); // Only depends on messages


  // Effect 3: Execute scroll request if conditions are met
  useEffect(() => {
    if (!scrollRequest || !scrollRef.current) return;

    const element = scrollRef.current;
    const userIsCurrentlyScrolledUp = useChatScrollStore.getState().userScrolledUp; // Get fresh state

    // Only execute scroll if user is not interacting OR if it's an 'auto' scroll (typically for user's own new message)
    if (!isUserInteractingRef.current || scrollRequest === 'auto') {
      if (scrollRequest === 'auto') { // Usually for user's own message
        useChatScrollStore.getState().scrollToBottom('auto'); // Use store action to also reset flags
      } else if (scrollRequest === 'smooth' && !userIsCurrentlyScrolledUp) {
        // For streaming or new assistant message when user is at bottom
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        if (distanceFromBottom < STREAMING_AUTO_SCROLL_MAX_DISTANCE && distanceFromBottom > MIN_DISTANCE_FOR_STREAMING_SCROLL_ACTION) {
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
          });
        } else if (distanceFromBottom <= MIN_DISTANCE_FOR_STREAMING_SCROLL_ACTION) {
          // Already at bottom, ensure state is correct if not already by handleScroll
           if(!useChatScrollStore.getState().isAtBottom) setIsAtBottom(true);
        }
      }
    }
    setScrollRequest(null); // Reset the request
  }, [scrollRequest, setIsAtBottom]); // Depends on scrollRequest signal

  return scrollRef;
}
