'use client';

import { cn } from '@lib/utils';
import { CodeIcon } from 'lucide-react';

import React from 'react';

import { CopyButton } from './copy-button';
import { ExportButton } from './export-button';

interface CodeBlockHeaderProps {
  language: string | null;
  className?: string;
  codeContent?: string;
}

/**
 * Header component for code blocks with language display and action buttons
 * @description Displays programming language and provides copy/export functionality
 */
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = React.memo(
  ({ language, className, codeContent }) => {
    if (!language) {
      return null;
    }

    return (
      <div
        className={cn(
          'flex min-w-0 transform-gpu items-center justify-between rounded-t-lg border-b px-3 py-1',
          className
        )}
        style={{
          backgroundColor: 'var(--md-code-header-bg)',
          borderColor: 'var(--md-code-header-border)',
          color: 'var(--md-code-header-text)',
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <CodeIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate text-xs font-medium tracking-wide select-none">
            {language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
        </div>

        {codeContent && (
          <div className="flex flex-shrink-0 items-center gap-1">
            <ExportButton
              content={codeContent}
              language={language}
              tooltipPlacement="bottom"
            />
            <CopyButton content={codeContent} tooltipPlacement="bottom" />
          </div>
        )}
      </div>
    );
  }
);

CodeBlockHeader.displayName = 'CodeBlockHeader';
