export type ThinkBlockStatus = 'open' | 'closed';

export interface MessageBlock {
  type: 'text' | 'think';
  content: string;
  status?: ThinkBlockStatus; // Only for 'think' type
}

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
  let activeTagType: string | null = null; // 'think' or 'details'
  let blockStartIndex = 0; // Where the current Think block content started (after the opening tag)

  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tagFull = match[0];
    const tagName = match[1].toLowerCase();
    const isCloseTag = tagFull.startsWith('</');
    const matchIndex = match.index;

    if (activeTagType === null) {
      // We are in Text mode
      if (!isCloseTag) {
        // Found a start tag (<think> or <details>)
        // 1. Capture text before this tag
        if (matchIndex > lastIndex) {
          const textContent = content.slice(lastIndex, matchIndex);
          // Merge with previous text block if exists?
          // For now, just push
          blocks.push({ type: 'text', content: textContent });
        }

        // 2. Start Think mode
        activeTagType = tagName;
        depth = 1;
        blockStartIndex = tagRegex.lastIndex; // Content starts after this tag
      } else {
        // Found a close tag but we are not in a block.
        // Treat as text.
        // We don't do anything special, just let the loop continue.
        // Ideally we treat this tag as part of the text.
        // But wait, if we skip it here, it will be captured in the next "text before tag" or "end of string".
        // Actually, if we ignore it, `lastIndex` is still at the previous position.
        // We need to make sure we don't skip it in the final capture.
        // The issue is `tagRegex` consumes it.
        // If we want to treat it as text, we should NOT treat it as a boundary.
        // BUT `tagRegex` finds it.
        // If we ignore it, we just continue. `lastIndex` needs to update?
        // No, `lastIndex` tracks "end of last processed valid block".
        // If we ignore this tag, it becomes part of the next text block.
        // So we just continue.
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

  // Post-processing: Merge adjacent text blocks (if any)
  // Also remove empty text blocks if desired, though empty text blocks might be useful for structure.
  const mergedBlocks: MessageBlock[] = [];
  blocks.forEach(block => {
    if (
      mergedBlocks.length > 0 &&
      block.type === 'text' &&
      mergedBlocks[mergedBlocks.length - 1].type === 'text'
    ) {
      mergedBlocks[mergedBlocks.length - 1].content += block.content;
    } else {
      mergedBlocks.push(block);
    }
  });

  // Filter out empty text blocks? Maybe not, " " is valid text.
  // But empty string "" is useless.
  return mergedBlocks.filter(b => b.content.length > 0 || b.type === 'think');
}
