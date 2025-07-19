'use client';

import { Spinner } from '@components/ui/spinner';
// Remove useTheme and useThemeColors imports, use CSS variables instead
import { useMobile } from '@lib/hooks/use-mobile';
// Removed react-i18next import
import { cn } from '@lib/utils';

import React from 'react';

/**
 * Status types for the ThinkBlock
 */
export type ThinkBlockStatus = 'thinking' | 'completed' | 'stopped';

/**
 * Props for the ThinkBlockHeader component
 */
interface ThinkBlockHeaderProps {
  /** Current status of the think block */
  status: ThinkBlockStatus;
  /** Whether the content area is expanded */
  isOpen: boolean;
  /** Callback function triggered when header is clicked */
  onToggle: () => void;
}

/**
 * ThinkBlockHeader is a horizontal button-style header component.
 * It displays an expand/collapse icon, status text, and a loading spinner when thinking.
 */
export const ThinkBlockHeader: React.FC<ThinkBlockHeaderProps> = ({
  status,
  isOpen,
  onToggle,
}) => {
  // Determine if the current device is mobile
  const isMobile = useMobile();

  // Check if the current status is "thinking"
  const isThinking = status === 'thinking';

  // Get the status text based on the current status
  const getStatusText = () => {
    switch (status) {
      case 'thinking':
        return '正在深度思考';
      case 'stopped':
        return '思考已停止';
      case 'completed':
      default:
        return '已深度思考';
    }
  };

  return (
    <button
      className={cn(
        // Layout: flex, center vertically, space between
        'flex items-center justify-between',
        // Responsive width: full on mobile, 22% on desktop
        isMobile ? 'w-full' : 'w-[22%]',
        'mb-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm',
        // Focus and transition styles
        'focus:outline-none'
      )}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="think-block-content"
      style={{
        backgroundColor: isThinking
          ? 'var(--md-think-thinking-bg)'
          : 'var(--md-think-header-bg)',
        borderColor: isThinking
          ? 'var(--md-think-thinking-border)'
          : 'var(--md-think-header-border)',
        color: isThinking
          ? 'var(--md-think-thinking-text)'
          : 'var(--md-think-header-text)',
      }}
    >
      {/* Left section: expand/collapse icon and status text */}
      <div className="flex items-center">
        {/* Expand/collapse icon */}
        <svg
          className={cn('mr-2 h-4 w-4', isOpen ? 'rotate-90' : 'rotate-0')}
          style={{
            color: isThinking
              ? 'var(--md-think-thinking-icon)'
              : 'var(--md-think-header-icon)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {/* Status text */}
        <span
          className={cn('font-medium whitespace-nowrap')}
          style={{
            color: isThinking
              ? 'var(--md-think-thinking-text)'
              : 'var(--md-think-header-text)',
          }}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Right section: Spinner, only shown when thinking */}
      <div className="h-4 w-4 flex-shrink-0">
        {isThinking && <Spinner size="md" className="text-current" />}
      </div>
    </button>
  );
};
