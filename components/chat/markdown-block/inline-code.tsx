'use client';

import { cn } from '@lib/utils';

import React from 'react';

// Use CSS variables instead of React state or Tailwind classes

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

// Use React.memo to wrap the component to prevent unnecessary re-renders
export const InlineCode: React.FC<InlineCodeProps> = React.memo(
  ({ children, className }) => {
    // Do not use any React state, rely entirely on CSS variables

    // Modern inline code style:
    // - Use monospace font (font-mono).
    // - Adjust padding, border radius, background color, and text color for contrast and aesthetics.
    // - Responsive design to ensure good appearance on different screen sizes and themes.
    return (
      <code
        className={cn(
          'mx-0.5 transform-gpu rounded-md border px-1.5 py-0.5 align-baseline font-mono text-sm',
          className
        )}
        style={{
          backgroundColor: 'var(--md-inline-code-bg)',
          borderColor: 'var(--md-inline-code-border)',
          color: 'var(--md-inline-code-text)',
        }}
      >
        {children}
      </code>
    );
  }
);

InlineCode.displayName = 'InlineCode';
