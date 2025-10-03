import { create } from 'zustand';

interface TypewriterState {
  isWelcomeTypewriterComplete: boolean;
  setWelcomeTypewriterComplete: (complete: boolean) => void;
  resetWelcomeTypewriter: () => void;
}

/**
 * Typewriter state management
 * Used to coordinate the display timing of welcome text typewriter and recommended questions
 */
export const useTypewriterStore = create<TypewriterState>(set => ({
  isWelcomeTypewriterComplete: false,

  setWelcomeTypewriterComplete: (complete: boolean) => {
    console.log(
      '[TypewriterStore] Welcome text typewriter state:',
      complete ? 'Complete' : 'Reset'
    );
    set({ isWelcomeTypewriterComplete: complete });
  },

  resetWelcomeTypewriter: () => {
    console.log('[TypewriterStore] Reset welcome text typewriter state');
    set({ isWelcomeTypewriterComplete: false });
  },
}));
