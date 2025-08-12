'use client';

import { useMobile } from '@lib/hooks';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { AlertTriangle, Edit, Trash, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import React, { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
  icon?: 'edit' | 'delete' | 'warning';
}

/**
 * Responsive confirmation dialog component - Stone style design
 * Desktop: Centered modal with compact rectangular layout
 * Mobile: Bottom sheet style with larger touch areas
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
  icon = 'warning',
}: ConfirmDialogProps) {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const t = useTranslations('common.ui');
  const finalCancelText = cancelText || t('cancel');
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Can only use Portal after client-side mounting
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key close
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isLoading]);

  // Handle click outside to close and prevent event bubbling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Stop all mouse events from propagating to prevent interaction with background modal
      e.stopPropagation();

      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !isLoading
      ) {
        onClose();
      }
    };

    // Prevent all interactions with background elements
    const preventBackgroundInteraction = (e: MouseEvent | TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    // Add delay to avoid closing immediately when opened
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', preventBackgroundInteraction, true);
      document.addEventListener(
        'touchstart',
        preventBackgroundInteraction,
        true
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', preventBackgroundInteraction, true);
      document.removeEventListener(
        'touchstart',
        preventBackgroundInteraction,
        true
      );
    };
  }, [isOpen, onClose, isLoading]);

  // Handle mobile swipe to close
  useEffect(() => {
    if (!isOpen || !isMobile || !dialogRef.current || isLoading) return;

    let startY = 0;
    let currentY = 0;
    const dialog = dialogRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        dialog.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      const deltaY = currentY - startY;

      if (deltaY > 100) {
        // If the swipe down exceeds the threshold, close the dialog
        onClose();
      } else {
        // Restore to original position
        dialog.style.transform = '';
      }
    };

    dialog.addEventListener('touchstart', handleTouchStart);
    dialog.addEventListener('touchmove', handleTouchMove);
    dialog.addEventListener('touchend', handleTouchEnd);

    return () => {
      dialog.removeEventListener('touchstart', handleTouchStart);
      dialog.removeEventListener('touchmove', handleTouchMove);
      dialog.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, isMobile, onClose, isLoading]);

  // Click background to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  // Get icon component
  const getIcon = (size: 'sm' | 'lg' = 'sm') => {
    const iconClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';

    switch (icon) {
      case 'edit':
        return <Edit className={iconClass} />;
      case 'delete':
        return <Trash className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  // Get icon and background styles based on variant
  const getVariantStyles = () => {
    if (variant === 'danger') {
      return {
        iconColor: isDark ? 'text-red-400' : 'text-red-500',
        iconBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      };
    }

    return {
      iconColor: isDark ? 'text-stone-400' : 'text-stone-500',
      iconBg: isDark ? 'bg-stone-700/60' : 'bg-stone-100',
    };
  };

  const variantStyles = getVariantStyles();

  if (!mounted) return null;

  // Desktop modal style - Stone design with compact layout
  const desktopDialog = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-md',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        'transition-all duration-300 ease-out'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={cn(
          'mx-auto w-full max-w-md rounded-xl shadow-2xl',
          'transform transition-all duration-300 ease-out',
          isDark
            ? 'border border-stone-600/60 bg-stone-800/95 shadow-black/50'
            : 'border border-stone-300/60 bg-white/95 shadow-stone-800/15',
          'backdrop-blur-sm',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* Desktop compact header with horizontal layout */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start">
            <div
              className={cn(
                'mr-4 flex h-10 w-10 items-center justify-center rounded-lg',
                'ring-1 ring-inset',
                variantStyles.iconBg,
                variantStyles.iconColor,
                isDark ? 'ring-stone-600/50' : 'ring-stone-200/60'
              )}
            >
              {getIcon('sm')}
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  'mb-2 font-serif text-lg font-semibold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                {title}
              </h3>

              <p
                className={cn(
                  'font-serif text-sm leading-relaxed',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop button area - right-aligned horizontal layout */}
        <div className="flex justify-end gap-2 px-6 py-4 pt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'rounded-lg px-4 py-2 font-serif text-sm',
              'border transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:ring-2 focus:ring-offset-1 focus:outline-none',
              isDark
                ? 'border-stone-600 text-stone-300 hover:bg-stone-700/50 focus:ring-stone-500/40 focus:ring-offset-stone-800'
                : 'border-stone-300 text-stone-700 hover:bg-stone-100 focus:ring-stone-500/40 focus:ring-offset-white'
            )}
          >
            {finalCancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-lg px-4 py-2 font-serif text-sm font-medium',
              'transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:ring-2 focus:ring-offset-1 focus:outline-none',
              // Enhanced styling for the confirm button with better contrast
              variant === 'danger'
                ? isDark
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30 hover:bg-red-700 focus:ring-red-500/40 focus:ring-offset-stone-800'
                  : 'bg-red-600 text-white shadow-md shadow-red-900/15 hover:bg-red-700 focus:ring-red-500/40 focus:ring-offset-white'
                : isDark
                  ? 'bg-stone-600 text-white shadow-md shadow-stone-900/30 hover:bg-stone-700 focus:ring-stone-500/40 focus:ring-offset-stone-800'
                  : 'bg-stone-700 text-white shadow-md shadow-stone-900/15 hover:bg-stone-800 focus:ring-stone-500/40 focus:ring-offset-white'
            )}
          >
            {isLoading ? t('loading') : confirmText}
          </button>
        </div>

        {/* Close button - top right corner, smaller and more subtle */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute top-3 right-3 rounded-md p-1.5',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200',
            isDark
              ? 'text-stone-500 hover:bg-stone-700/60 hover:text-stone-300'
              : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // Mobile bottom sheet style - Stone design
  const mobileDialog = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-end justify-center',
        'bg-black/50 backdrop-blur-md',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        'transition-opacity duration-300 ease-out'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={cn(
          'w-full max-w-lg rounded-t-3xl',
          'transform transition-transform duration-300 ease-out',
          isDark
            ? 'border-t border-stone-700/50 bg-stone-900/95 shadow-black/40'
            : 'border-t border-stone-200/50 bg-white/95 shadow-stone-900/20',
          'shadow-2xl backdrop-blur-sm',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Mobile top drag handle - thicker and more visible */}
        <div className="flex items-center justify-center pt-4 pb-2">
          <div
            className={cn(
              'h-1.5 w-16 rounded-full',
              isDark ? 'bg-stone-600' : 'bg-stone-300'
            )}
          ></div>
        </div>

        {/* Mobile icon and content area */}
        <div className="flex flex-col items-center px-6 pt-4 pb-8">
          <div
            className={cn(
              'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
              'ring-1 ring-inset',
              variantStyles.iconBg,
              variantStyles.iconColor,
              isDark ? 'ring-stone-700/50' : 'ring-stone-200/50'
            )}
          >
            {getIcon('lg')}
          </div>

          <h3
            className={cn(
              'mb-4 text-center font-serif text-xl font-semibold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            {title}
          </h3>

          <p
            className={cn(
              'mb-8 max-w-sm text-center font-serif text-base leading-relaxed',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {message}
          </p>

          {/* Mobile button area - vertical layout with larger touch areas */}
          <div className="w-full space-y-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'w-full rounded-2xl py-4 font-serif text-base font-medium',
                'transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                // Mobile confirm button styling with proper variant handling
                variant === 'danger'
                  ? isDark
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30 hover:bg-red-700 focus:ring-red-500/40 focus:ring-offset-stone-900'
                    : 'bg-red-600 text-white shadow-lg shadow-red-900/15 hover:bg-red-700 focus:ring-red-500/40 focus:ring-offset-white'
                  : isDark
                    ? 'bg-stone-600 text-white shadow-lg shadow-stone-900/30 hover:bg-stone-700 focus:ring-stone-500/40 focus:ring-offset-stone-900'
                    : 'bg-stone-700 text-white shadow-lg shadow-stone-900/15 hover:bg-stone-800 focus:ring-stone-500/40 focus:ring-offset-white'
              )}
            >
              {isLoading ? t('loading') : confirmText}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'w-full rounded-2xl py-4 font-serif text-base',
                'border transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700/50 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50 focus:ring-stone-500/30 focus:ring-offset-white'
              )}
            >
              {finalCancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Return the corresponding dialog based on the device type
  return createPortal(isMobile ? mobileDialog : desktopDialog, document.body);
}
