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
 * Language display name mappings for common programming languages
 * Provides proper capitalization and spacing for special cases
 */
const LANGUAGE_DISPLAY_MAP: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  'c++': 'C++',
  'objective-c': 'Objective-C',
  'objective-cpp': 'Objective-C++',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  fish: 'Fish',
  md: 'Markdown',
  yml: 'YAML',
  yaml: 'YAML',
  plaintext: 'Plain Text',
  dockerfile: 'Dockerfile',
  graphql: 'GraphQL',
  'c#': 'C#',
  'f#': 'F#',
  'vue.js': 'Vue.js',
  'node.js': 'Node.js',
  'react.js': 'React',
  'next.js': 'Next.js',
};

/**
 * Get display name for programming language with proper formatting
 */
const getLanguageDisplayName = (language: string): string => {
  const lowerLang = language.toLowerCase();

  // Check mapping first
  if (LANGUAGE_DISPLAY_MAP[lowerLang]) {
    return LANGUAGE_DISPLAY_MAP[lowerLang];
  }

  // Fallback to capitalize first letter of each word segment
  return language.replace(
    /(^|[-_/.])(\p{L})/gu,
    (_, separator, char) => separator + char.toUpperCase()
  );
};

/**
 * Header component for code blocks with language display and action buttons
 * @description Displays programming language and provides copy/export functionality
 */
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = React.memo(
  ({ language, className, codeContent }) => {
    if (!language) {
      return null;
    }

    const displayLanguage = getLanguageDisplayName(language);

    return (
      <div
        className={cn(
          'flex min-w-0 transform-gpu items-center justify-between gap-2 rounded-t-lg border-b px-3 py-1',
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
          <span
            className="truncate text-xs font-medium tracking-wide select-none"
            title={displayLanguage}
          >
            {displayLanguage}
          </span>
        </div>

        {codeContent && (
          <div className="flex flex-shrink-0 items-center gap-1">
            <ExportButton
              content={codeContent}
              language={language}
              tooltipPlacement="bottom"
              aria-label={`Export ${displayLanguage} code`}
            />
            <CopyButton
              content={codeContent}
              tooltipPlacement="bottom"
              aria-label={`Copy ${displayLanguage} code`}
            />
          </div>
        )}
      </div>
    );
  }
);

CodeBlockHeader.displayName = 'CodeBlockHeader';
