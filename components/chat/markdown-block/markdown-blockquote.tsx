'use client';

import { cn } from '@lib/utils';

import React from 'react';

/**
 * Blockquote component for markdown rendering.
 * Uses CSS variables for styling instead of React state or Tailwind theme classes.
 */
interface MarkdownBlockquoteProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownBlockquote: React.FC<MarkdownBlockquoteProps> = ({
  children,
  className,
}) => {
  // No React state is used; all styling relies on CSS variables.

  // Modern blockquote style:
  // - Adjusts padding, margin, left border, and border radius.
  // - Uses a soft background color and clear text color for good contrast and aesthetics.
  // - Responsive design for good appearance on different screen sizes and themes.
  // - Dark mode compatible.
  return (
    <blockquote
      className={cn(
        'my-3 rounded-r-md border-l-4 py-2 pr-3 pl-4 leading-relaxed shadow-sm', // Added shadow and adjusted padding/margin
        className
      )}
      style={{
        borderLeftColor: 'var(--md-blockquote-border)',
        backgroundColor: 'var(--md-blockquote-bg)',
        color: 'var(--md-blockquote-text)',
      }}
    >
      {children}
    </blockquote>
  );
};
