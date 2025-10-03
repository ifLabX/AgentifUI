import { create } from 'zustand';

/**
 * Chat transition state management
 *
 * Controls the transition effect of the chat interface, especially the transition from the conversation view to the welcome screen.
 */
interface ChatTransitionState {
  /** Whether the interface is transitioning from the conversation view to the welcome screen.
   *  If true, use a flash effect instead of a slide transition. */
  isTransitioningToWelcome: boolean;

  /** Set the transition state */
  setIsTransitioningToWelcome: (value: boolean) => void;
}

export const useChatTransitionStore = create<ChatTransitionState>(set => ({
  isTransitioningToWelcome: false,
  setIsTransitioningToWelcome: value =>
    set({ isTransitioningToWelcome: value }),
}));
