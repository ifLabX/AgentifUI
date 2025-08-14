'use client';

import { useMobile } from '@lib/hooks';
import { cn } from '@lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import React, { useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

/**
 * Mobile-specific bottom modal component
 * Pop up from the bottom of the screen, covering part of the screen, suitable for mobile user interaction
 * Use Portal to ensure rendering at the page level, not limited by parent component layout
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
}: BottomSheetProps) {
  const isMobile = useMobile();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Only use Portal after client mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Click on the backdrop to close the popup
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle clicking outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add delay to avoid closing immediately when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle sliding to close
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    let startY = 0;
    let currentY = 0;
    const sheet = sheetRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        sheet.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      const deltaY = currentY - startY;

      if (deltaY > 100) {
        // Slide down beyond threshold, close popup
        onClose();
      } else {
        // Restore original position
        sheet.style.transform = '';
      }
    };

    sheet.addEventListener('touchstart', handleTouchStart);
    sheet.addEventListener('touchmove', handleTouchMove);
    sheet.addEventListener('touchend', handleTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose, sheetRef]);

  // Not rendered on non-mobile devices
  if (!isMobile) {
    return null;
  }

  // Popup content
  const sheetContent = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-end justify-center',
        'bg-black/40 backdrop-blur-sm',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        'transition-opacity duration-300 ease-in-out'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={cn(
          'w-full max-w-md rounded-t-2xl',
          'transform transition-transform duration-300 ease-in-out',
          'bg-white border-t border-stone-200 dark:bg-stone-800 dark:border-stone-700',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          'shadow-2xl'
        )}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Top drag bar */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="h-1 w-12 rounded-full bg-stone-300 dark:bg-stone-600"></div>
        </div>

        {/* Title and close button */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-medium text-stone-800 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-white transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  // Use Portal to render the component to the body, ensuring it is within the entire screen range
  return mounted ? createPortal(sheetContent, document.body) : null;
}
