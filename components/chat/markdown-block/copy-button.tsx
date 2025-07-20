'use client';

import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { FiCheck, FiCopy } from 'react-icons/fi';

import React from 'react';

import { useTranslations } from 'next-intl';

interface CopyButtonProps {
  content?: string;
  className?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // whether to show tooltip arrow
  onCopy?: () => void;
}

// Use a random ID generator to ensure each copy button's tooltip is unique
const generateUniqueId = () =>
  `copy-btn-${Math.random().toString(36).substring(2, 11)}`;

/**
 * Generic copy button component
 * Suitable for code blocks, quote blocks, and other places where copy functionality is needed
 * Follows the stone color theme of the app, with good visual effect in both light and dark modes
 */
export const CopyButton: React.FC<CopyButtonProps> = React.memo(
  ({
    content,
    className,
    tooltipPlacement = 'bottom',
    tooltipSize = 'sm',
    showTooltipArrow = false,
    onCopy,
  }) => {
    const { isDark } = useTheme();
    const t = useTranslations('components.ui.copyButton');

    // State for copy status
    const [isCopied, setIsCopied] = React.useState(false);

    // Generate a unique tooltip ID for each copy button
    const tooltipId = React.useRef(generateUniqueId()).current;

    // Handle copy action
    const handleCopy = React.useCallback(async () => {
      if (!content) return;

      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);

        // Call the external onCopy callback if provided
        if (onCopy) {
          onCopy();
        }

        // Reset the state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to copy content:', error);
      }
    }, [content, onCopy]);

    if (!content) return null;

    return (
      <TooltipWrapper
        content={isCopied ? t('copied') : t('copy')}
        id={tooltipId}
        placement={tooltipPlacement}
        size={tooltipSize}
        showArrow={showTooltipArrow}
        _desktopOnly={true}
      >
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            // Base text color - matches stone theme
            isDark ? 'text-stone-400' : 'text-stone-500',
            // Hover text color - darker in light mode, lighter in dark mode
            isDark ? 'hover:text-stone-300' : 'hover:text-stone-700',
            // Hover background color - uses semi-transparent mid-tone, suitable for both modes
            isDark ? 'hover:bg-stone-600/40' : 'hover:bg-stone-300/40',
            'focus:outline-none',
            className
          )}
          style={{ transform: 'translateZ(0)' }} // Add hardware acceleration to reduce flicker
          aria-label={isCopied ? t('copied') : t('copy')}
        >
          {isCopied ? (
            <FiCheck className="h-4 w-4" />
          ) : (
            <FiCopy className="h-4 w-4" />
          )}
        </button>
      </TooltipWrapper>
    );
  }
);

// Set display name for easier debugging
CopyButton.displayName = 'CopyButton';
