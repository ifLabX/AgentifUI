/**
 * Message loading indicator component
 */
import { LoadingState } from '@lib/hooks/use-conversation-messages';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface MessagesLoadingIndicatorProps {
  loadingState: LoadingState;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function MessagesLoadingIndicator({
  loadingState,
  isLoadingMore,
  hasMoreMessages,
  error,
  onRetry,
}: MessagesLoadingIndicatorProps) {
  const { colors, isDark } = useThemeColors();
  const t = useTranslations('loading');
  const [isAtTop, setIsAtTop] = useState(false);

  // Listen to scroll events on the scroll container.
  // Use debounce and delay initial check to avoid triggering load more immediately after initial load.
  const initialCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadCompleteRef = useRef<boolean>(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement;
      if (!container) return;

      // Clear previous debounce timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Add debounce delay to avoid frequent triggers during scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        // Only allow setting top state after initial load is complete
        if (isInitialLoadCompleteRef.current) {
          setIsAtTop(container.scrollTop < 50);
        }
      }, 200);
    };

    // Get the scroll container
    const scrollContainer = document.querySelector('.chat-scroll-container');

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, {
        passive: true,
      });

      // Delay initial check, wait for initial load to complete
      initialCheckTimeoutRef.current = setTimeout(() => {
        isInitialLoadCompleteRef.current = true;
        handleScroll({ target: scrollContainer } as unknown as Event);
      }, 1000); // After initial load and centering, wait 1s before allowing top detection

      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (initialCheckTimeoutRef.current) {
          clearTimeout(initialCheckTimeoutRef.current);
        }
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // If there is an error, show error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            isDark ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800',
            'mb-3'
          )}
        >
          <p>{t('loadingFailed', { error: error.message })}</p>
        </div>
        <button
          onClick={onRetry}
          className={cn(
            'rounded-full px-4 py-2 text-sm',
            colors.sidebarBackground.tailwind,
            colors.buttonHover.tailwind
          )}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  // Show loading indicator when loading more messages
  if (loadingState === 'loading' && isLoadingMore) {
    return (
      <div className="flex justify-center py-4">
        <div
          className={cn(
            'flex items-center space-x-2 rounded-full px-4 py-2',
            colors.sidebarBackground.tailwind
          )}
        >
          <LoadingSpinner />
          <span className="text-sm">{t('messages')}</span>
        </div>
      </div>
    );
  }

  // Show "load more" button only if there are more messages, at top, and not currently loading
  if (hasMoreMessages && isAtTop && loadingState !== 'loading') {
    return (
      <div className="flex justify-center py-4">
        <button
          onClick={onRetry}
          className={cn(
            'rounded-full px-4 py-2 text-sm',
            colors.sidebarBackground.tailwind,
            colors.buttonHover.tailwind,
            'transition-colors duration-200'
          )}
        >
          {t('moreMessages')}
        </button>
      </div>
    );
  }

  return null;
}

// Simple loading spinner component
function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-stone-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
