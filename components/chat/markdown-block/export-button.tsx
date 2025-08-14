'use client';

import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { cn } from '@lib/utils';
import { FiCheck, FiDownload } from 'react-icons/fi';

import React from 'react';

import { useTranslations } from 'next-intl';

interface ExportButtonProps {
  content?: string;
  language?: string;
  className?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // whether to show tooltip arrow
  onExport?: () => void;
}

// Use a random ID generator to ensure each export button's tooltip is unique
const generateUniqueId = () =>
  `export-btn-${Math.random().toString(36).substring(2, 11)}`;

// Get the appropriate file extension based on programming language
const getFileExtension = (language: string): string => {
  const extensionMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'py',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    bash: 'sh',
    shell: 'sh',
    sql: 'sql',
    json: 'json',
    yaml: 'yml',
    yml: 'yml',
    markdown: 'md',
    html: 'html',
    css: 'css',
    scss: 'scss',
    php: 'php',
    ruby: 'rb',
    swift: 'swift',
    kotlin: 'kt',
    dart: 'dart',
    r: 'r',
    matlab: 'm',
    xml: 'xml',
  };

  return extensionMap[language.toLowerCase()] || 'txt';
};

// Generate a suitable file name
const generateFileName = (language: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const extension = getFileExtension(language);
  return `code_${timestamp}.${extension}`;
};

/**
 * Generic export button component
 * Suitable for code blocks and other export scenarios
 * Follows the stone color theme for both light and dark modes
 * Styles and interaction logic are similar to CopyButton
 */
export const ExportButton: React.FC<ExportButtonProps> = React.memo(
  ({
    content,
    language = 'text',
    className,
    tooltipPlacement = 'bottom',
    tooltipSize = 'sm',
    showTooltipArrow = false,
    onExport,
  }) => {
    const t = useTranslations('common.ui.exportButton');

    // Export state
    const [isExported, setIsExported] = React.useState(false);

    // Generate a unique tooltip ID for each export button
    const tooltipId = React.useRef(generateUniqueId()).current;

    // Handle export action
    const handleExport = React.useCallback(async () => {
      if (!content) return;

      try {
        // Create a Blob object and trigger download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Create a temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = generateFileName(language);

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Set success state
        setIsExported(true);

        // Call external onExport callback if provided
        if (onExport) {
          onExport();
        }

        // Reset state after 2 seconds
        setTimeout(() => {
          setIsExported(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to export content:', error);
      }
    }, [content, language, onExport]);

    if (!content) return null;

    return (
      <TooltipWrapper
        content={t('tooltip')}
        id={tooltipId}
        placement={tooltipPlacement}
        size={tooltipSize}
        showArrow={showTooltipArrow}
        _desktopOnly={true}
      >
        <button
          onClick={handleExport}
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            // Base text color - matches stone theme, consistent with CopyButton
            'text-stone-500 dark:text-stone-400',
            // Hover text color - darker in light mode, lighter in dark mode
            'hover:text-stone-700 dark:hover:text-stone-300',
            // Hover background color - uses semi-transparent mid-tone, suitable for both modes
            'hover:bg-stone-300/40 dark:hover:bg-stone-600/40',
            'focus:outline-none',
            className
          )}
          style={{ transform: 'translateZ(0)' }} // Enable hardware acceleration to reduce flicker
          aria-label={t('ariaLabel')}
        >
          {isExported ? (
            <FiCheck className="h-4 w-4" />
          ) : (
            <FiDownload className="h-4 w-4" />
          )}
        </button>
      </TooltipWrapper>
    );
  }
);

// Set display name for easier debugging
ExportButton.displayName = 'ExportButton';
