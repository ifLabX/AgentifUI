import {
  INITIAL_INPUT_HEIGHT,
  useChatLayoutStore,
} from '@lib/stores/chat-layout-store';

import { useMemo } from 'react';

// Input box bottom margin constant (1.5rem = 24px)
const INPUT_BOTTOM_MARGIN = 24;
// Extra safety margin (about 1cm = 92px)
const SAFETY_MARGIN = 92;
// Bottom container height (px-4 pt-4 pb-1 = 36px)
const CONTAINER_PADDING = 36;

/**
 * Hook to provide chat message bottom spacing.
 * Dynamically calculates the bottom spacing based on the current input box height.
 * Ensures consistent visual spacing between messages and the input box.
 */
export function useChatBottomSpacing() {
  const { inputHeight } = useChatLayoutStore();

  // Calculate bottom spacing: base spacing + extra input height
  const bottomSpacing = useMemo(() => {
    // Base spacing = initial input height + input bottom margin + container padding + safety margin
    const BASE_SPACING =
      INITIAL_INPUT_HEIGHT +
      INPUT_BOTTOM_MARGIN +
      CONTAINER_PADDING +
      SAFETY_MARGIN;

    // Extra height = current height - initial height (extra height from input expansion)
    const extraHeight = Math.max(0, inputHeight - INITIAL_INPUT_HEIGHT);

    // Total spacing = base spacing + extra height
    return BASE_SPACING + extraHeight;
  }, [inputHeight]);

  return {
    bottomSpacing,
    // Due to Tailwind's JIT compilation limitations, we need to create dynamic class names this way
    paddingBottomStyle: { paddingBottom: `${bottomSpacing}px` },
  };
}
