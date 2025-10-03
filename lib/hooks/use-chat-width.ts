import { useMobile } from './use-mobile';

/**
 * Provides unified chat component width configuration.
 * Ensures ChatInput, ChatLoader, and ChatInputBackdrop have consistent width.
 */
export function useChatWidth() {
  const isMobile = useMobile();

  // Use max-w-3xl (768px) for desktop, max-w-full for mobile devices
  const widthClass = isMobile ? 'max-w-full' : 'max-w-3xl';

  // Padding configuration
  const paddingClass = isMobile ? 'px-2' : 'px-4';

  return {
    widthClass,
    paddingClass,
    isMobile,
  };
}
