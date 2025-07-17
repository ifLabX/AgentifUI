import { useRef } from 'react';

/**
 * Custom hook to manage input focus for a textarea element.
 *
 * Provides methods to get, set, and control the focus state of a text input.
 */
export function useInputFocus() {
  // Reference to the textarea input element
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Set the input reference
  const setInputRef = (ref: HTMLTextAreaElement | null) => {
    inputRef.current = ref;
  };

  // Focus the input and move the cursor to the end
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();

      // Move the cursor to the end of the text
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  };

  // Remove focus from the input
  const blurInput = () => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return {
    inputRef,
    setInputRef,
    focusInput,
    blurInput,
  };
}
