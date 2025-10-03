'use client';

import { useMobile } from '@lib/hooks/use-mobile';
import { cn } from '@lib/utils';
import { GripVertical } from 'lucide-react';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number; // Default left width percentage
  minLeftWidth?: number; // Minimum left width percentage
  maxLeftWidth?: number; // Maximum left width percentage
  className?: string;
  storageKey?: string; // localStorage key name
}

/**
 * Resizable split pane component
 *
 * Features:
 * - Support dragging to adjust the size of the left and right panels
 * - Clear split button indicator
 * - State persistence to localStorage
 * - Automatic disable on mobile
 * - Smooth animation effect
 */
export function ResizableSplitPane({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className,
  storageKey = 'resizable-split-pane',
}: ResizableSplitPaneProps) {
  const isMobile = useMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('components.ui.resizableSplitPane');

  // --- Restore state from localStorage ---
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === 'undefined') return defaultLeftWidth;
    const saved = localStorage.getItem(storageKey);
    return saved
      ? Math.max(minLeftWidth, Math.min(maxLeftWidth, parseInt(saved)))
      : defaultLeftWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // --- Save state to localStorage ---
  useEffect(() => {
    localStorage.setItem(storageKey, leftWidth.toString());
  }, [leftWidth, storageKey]);

  // --- Start dragging ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;

      e.preventDefault();
      setIsDragging(true);
      setStartX(e.clientX);
      setStartWidth(leftWidth);

      // Set global cursor and disable text selection
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';

      // Set special style for the split line
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = 'auto';
      }
    },
    [isMobile, leftWidth]
  );

  // --- Dragging ---
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(
        maxLeftWidth,
        Math.max(minLeftWidth, startWidth + deltaPercent)
      );

      setLeftWidth(newWidth);
    },
    [isDragging, startX, startWidth, minLeftWidth, maxLeftWidth]
  );

  // --- End dragging ---
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Restore global styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';

    if (containerRef.current) {
      containerRef.current.style.pointerEvents = '';
    }
  }, [isDragging]);

  // --- Add global event listener ---
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // --- Reset to default size ---
  const handleReset = useCallback(() => {
    setLeftWidth(defaultLeftWidth);
  }, [defaultLeftWidth]);

  // Mobile devices return simple flex layout
  if (isMobile) {
    return (
      <div className={cn('flex h-full', className)} ref={containerRef}>
        <div className="min-w-0 flex-1">{left}</div>
        <div className="min-w-0 flex-1">{right}</div>
      </div>
    );
  }

  return (
    <div className={cn('relative flex h-full', className)} ref={containerRef}>
      {/* Left panel */}
      <div
        className="min-w-0 transition-all duration-200 ease-out"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>

      {/* Split line and dragging area */}
      <div className="group relative z-10 flex items-center justify-center">
        {/* Visible split line */}
        <div
          className={cn(
            'h-full w-px transition-all duration-200',
            'bg-stone-300 dark:bg-stone-600',
            isDragging && 'bg-stone-400 dark:bg-stone-500'
          )}
        />

        {/* Dragging hot area */}
        <div
          className={cn(
            'absolute inset-y-0 -right-2 -left-2 cursor-col-resize',
            'flex items-center justify-center',
            'transition-all duration-150',
            isDragging && 'bg-stone-500/5'
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleReset}
          title={t('tooltip')}
        >
          {/* Split button indicator */}
          <div
            className={cn(
              'flex items-center justify-center',
              'h-8 w-4 rounded-full border transition-all duration-150',
              'shadow-sm',
              // Default state
              'border-stone-300/50 bg-white/80 text-stone-500',
              'dark:border-stone-600/50 dark:bg-stone-800/80 dark:text-stone-400',
              // Hover state
              'group-hover:scale-105',
              'group-hover:border-stone-400/70 group-hover:bg-white/90 group-hover:text-stone-600',
              'dark:group-hover:border-stone-500/70 dark:group-hover:bg-stone-700/90 dark:group-hover:text-stone-300',
              // Dragging state
              isDragging &&
                'scale-105 border-stone-400/80 bg-white/95 text-stone-700',
              isDragging &&
                'dark:border-stone-500/80 dark:bg-stone-700/95 dark:text-stone-200'
            )}
          >
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="min-w-0 flex-1 transition-all duration-200 ease-out"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>

      {/* Global mask when dragging */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}
