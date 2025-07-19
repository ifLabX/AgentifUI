'use client';

import { cn } from '@lib/utils';
import { CodeIcon } from 'lucide-react';

import React from 'react';

import { CopyButton } from './copy-button';
import { ExportButton } from './export-button';

interface CodeBlockHeaderProps {
  language: string | null;
  className?: string;
  codeContent?: string; // code content prop for copy functionality
}

// Use React.memo to prevent unnecessary re-renders
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = React.memo(
  ({ language, className, codeContent }) => {
    // Note: Copy functionality is handled in the CopyButton component

    // Note: This component only handles the header UI and copy/export actions, does not affect code highlighting

    if (!language) {
      return null; // Don't render header if language is not specified
    }

    return (
      <div
        className={cn(
          'flex transform-gpu items-center justify-between rounded-t-lg border-b px-3 py-1', // Reduce header height
          className
        )}
        style={{
          backgroundColor: 'var(--md-code-header-bg)',
          borderColor: 'var(--md-code-header-border)',
          color: 'var(--md-code-header-text)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <CodeIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium tracking-wide select-none">
            {language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
        </div>

        {/* Button group: export button on left, copy button on right */}
        {/* Uses flex layout with moderate spacing to maintain visual balance */}
        {codeContent && (
          <div className="flex items-center gap-1">
            {/* Export button */}
            <ExportButton
              content={codeContent}
              language={language}
              tooltipPlacement="bottom"
            />

            {/* Copy button */}
            <CopyButton content={codeContent} tooltipPlacement="bottom" />
          </div>
        )}
      </div>
    );
  }
);

CodeBlockHeader.displayName = 'CodeBlockHeader';
