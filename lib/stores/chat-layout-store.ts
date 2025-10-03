import { create } from 'zustand';

/**
 * Chat layout state interface
 * @description Manages the actual height of the chat input box and related actions
 */
interface ChatLayoutState {
  /** Actual height of the input box */
  inputHeight: number;
  /** Set the input box height */
  setInputHeight: (height: number) => void;
  /** Reset the input box height to initial value */
  resetInputHeight: () => void;
}

/**
 * Initial minimum height for the textarea in chat input (matches chat-input/index.tsx)
 */
const INITIAL_INPUT_HEIGHT = 48;

export const useChatLayoutStore = create<ChatLayoutState>(set => ({
  inputHeight: INITIAL_INPUT_HEIGHT, // Initial height
  setInputHeight: height => set({ inputHeight: height }),
  resetInputHeight: () => set({ inputHeight: INITIAL_INPUT_HEIGHT }),
}));

/**
 * Export initial input height constant for use in other components
 */
export { INITIAL_INPUT_HEIGHT };
