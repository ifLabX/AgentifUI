'use client';

import { cn } from '@lib/utils';

import React from 'react';

/**
 * Props for the MarkdownTableContainer component.
 * @property children - The table content to render.
 * @property className - Additional CSS classes for the container.
 */
interface MarkdownTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MarkdownTableContainer renders a responsive, styled table container for markdown content.
 *
 * Features:
 * - Responsive horizontal scrolling.
 * - Theming via CSS variables.
 * - Rounded corners and overflow handling.
 * - Adaptive width sizing.
 */
export const MarkdownTableContainer: React.FC<MarkdownTableProps> = ({
  children,
  className,
}) => {
  // The useThemeColors hook is not used for performance reasons.

  return (
    <div
      className={cn(
        'my-4 overflow-x-auto',
        'w-fit max-w-full', // The container width adapts to content but does not exceed the available space.
        className
      )}
    >
      <table
        className={cn(
          'border-collapse',
          'overflow-hidden rounded-lg' // Ensures rounded corners and hides overflow.
          // The table background is transparent and determined by the parent element.
          // Internal borders are handled by child elements.
          // The external border is set via CSS variables in the style prop.
        )}
        style={{
          // The table border uses a CSS variable for theme consistency.
          border: '1px solid var(--md-table-border)',
        }}
      >
        {children}
      </table>
    </div>
  );
};
