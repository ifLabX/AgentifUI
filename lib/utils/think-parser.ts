export type ThinkBlockStatus = 'open' | 'closed';

export interface MessageBlock {
  type: 'text' | 'think';
  content: string;
  status?: ThinkBlockStatus; // Only for 'think' type
}

type ThinkTagType = 'think' | 'details';

/**
 * Parses a message string into a sequence of think blocks and text blocks.
 * Supports:
 * - Multiple interleaved think and text blocks
 * - Nested think tags (treats outer tags as boundaries)
 * - Unclosed think tags (optimistic handling)
 * - <details> tags (as legacy/alternative think blocks)
 *
 * @param content The raw message content
 * @returns Array of MessageBlocks
 */
export function parseThinkBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const tagRegex = /<\/?(think|details)(?:\s[^>]*)?>/gi;

  let lastIndex = 0;
  let depth = 0;
  let activeTagType: ThinkTagType | null = null; // 'think' or 'details'
  let blockStartIndex = 0; // Where the current Think block content started (after the opening tag)

  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tagFull = match[0];
    const tagName = match[1].toLowerCase() as ThinkTagType;
    const isCloseTag = tagFull.startsWith('</');
    const matchIndex = match.index;

    if (activeTagType === null) {
      // We are in Text mode
      if (!isCloseTag) {
        // Found a start tag (<think> or <details>)
        // 1. Capture text before this tag
        if (matchIndex > lastIndex) {
          const textContent = content.slice(lastIndex, matchIndex);
          blocks.push({ type: 'text', content: textContent });
        }

        // 2. Start Think mode
        activeTagType = tagName;
        depth = 1;
        blockStartIndex = tagRegex.lastIndex; // Content starts after this tag
      } else {
        // Found a closing tag while in text mode (e.g., "some text </think>").
        // Orphaned closing tags are treated as plain text by ignoring the match.
        // The tag content will be captured as part of the next text block.
      }
    } else {
      // We are in Think mode
      if (tagName === activeTagType) {
        // Matching tag type
        if (!isCloseTag) {
          // Nested start tag
          depth++;
        } else {
          // Close tag
          depth--;
        }

        if (depth === 0) {
          // Closed the block
          const thinkContent = content.slice(blockStartIndex, matchIndex);
          blocks.push({
            type: 'think',
            content: thinkContent,
            status: 'closed',
          });

          activeTagType = null;
          lastIndex = tagRegex.lastIndex; // Next text starts after this closing tag
        }
      } else {
        // Different tag type (e.g. <details> inside <think>)
        // Treat as content.
        // Just continue.
      }
    }
  }

  // Handle remaining content
  if (activeTagType !== null) {
    // We are still in a think block -> Unclosed (Optimistic)
    // Content is everything from blockStartIndex to the end
    const thinkContent = content.slice(blockStartIndex);
    blocks.push({ type: 'think', content: thinkContent, status: 'open' });
  } else {
    // We are in text mode
    if (lastIndex < content.length) {
      const textContent = content.slice(lastIndex);
      blocks.push({ type: 'text', content: textContent });
    }
  }

  // Post-processing: Merge adjacent text blocks and filter empty text blocks
  return blocks.reduce((acc, block) => {
    // Skip empty text blocks (empty think blocks are preserved for UI state)
    if (block.content.length === 0 && block.type === 'text') {
      return acc;
    }

    // Merge adjacent text blocks
    if (block.type === 'text' && acc[acc.length - 1]?.type === 'text') {
      acc[acc.length - 1].content += block.content;
    } else {
      // Add think blocks (including empty ones) or new text blocks
      acc.push(block);
    }

    return acc;
  }, [] as MessageBlock[]);
}
