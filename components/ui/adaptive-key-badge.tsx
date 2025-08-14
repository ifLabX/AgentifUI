'use client';

import { cn } from '@lib/utils';

import React from 'react';

interface AdaptiveKeyBadgeProps {
  /** key text */
  keyText: string;
  /** size mode */
  size?: 'sm' | 'md';
  /** is dark theme */
  isDark?: boolean;
  /** extra css class name */
  className?: string;
}

/**
 * Adaptive key badge component
 *
 * Features:
 * - Automatically adjust container width based on key text length
 * - Use fixed square for short text (1-2 characters)
 * - Use adaptive width + padding for long text (3+ characters)
 * - Maintain visual consistency and readability
 * - Optimize vertical alignment
 */
export function AdaptiveKeyBadge({
  keyText,
  size = 'md',
  className,
}: AdaptiveKeyBadgeProps) {
  const isLongText = keyText.length > 2;

  // base styles - add vertical alignment optimization
  const baseClasses = cn(
    'inline-flex items-center justify-center',
    'rounded border font-medium select-none',
    'transition-all duration-75',
    // --- vertical alignment optimization ---
    'leading-none', // explicitly set line height to 1 to avoid default line height impact
    'font-sans' // use sans-serif font to ensure better small size rendering
  );

  // size configuration
  const sizeConfig = {
    sm: {
      height: 'h-3',
      fontSize: 'text-[10px]',
      fixedWidth: 'w-3',
      adaptiveWidth: 'min-w-[18px] px-1',
      shadow: '0 0.5px 1px rgba(0, 0, 0, 0.2)',
    },
    md: {
      height: 'h-4',
      fontSize: 'text-xs',
      fixedWidth: 'w-4',
      adaptiveWidth: 'min-w-[28px] px-1.5',
      shadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },
  };

  const config = sizeConfig[size];

  // theme styles - consistent with sidebar styles
  const themeClasses =
    size === 'sm'
      ? 'bg-black/10 text-white/70 border-white/10' // tooltip styles - keeping as is for small size
      : 'bg-white/90 text-stone-700 border-stone-300/70 shadow-sm backdrop-blur-sm dark:bg-stone-800/90 dark:text-stone-200 dark:border-stone-500/60';

  // width styles
  const widthClasses = isLongText ? config.adaptiveWidth : config.fixedWidth;

  return (
    <span
      className={cn(
        baseClasses,
        config.height,
        config.fontSize,
        widthClasses,
        themeClasses,
        className
      )}
      style={{
        // --- inline style optimization for vertical alignment ---
        ...(size === 'sm' ? { boxShadow: config.shadow } : {}),
        fontSizeAdjust: 'none', // disable font size adjustment to avoid vertical alignment impact
        textAlign: 'center',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1', // force line height to 1
      }}
    >
      {keyText}
    </span>
  );
}

/**
 * Key combination display component
 */
interface KeyCombinationProps {
  /** key array */
  keys: string[];
  /** size mode */
  size?: 'sm' | 'md';
  /** is dark theme */
  isDark?: boolean;
  /** extra css class name */
  className?: string;
}

export function KeyCombination({
  keys,
  size = 'md',
  className,
}: KeyCombinationProps) {
  const gapClass = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={cn('flex items-center', gapClass, className)}>
      {keys.map((key, index) => (
        <AdaptiveKeyBadge key={index} keyText={key} size={size} />
      ))}
    </div>
  );
}
