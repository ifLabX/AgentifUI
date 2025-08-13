'use client';

import { useLogout } from '@lib/hooks/use-logout';
import { useMobile } from '@lib/hooks/use-mobile';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { LogOut, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Logout confirmation dialog component - Stone style design
 * Desktop: Centered modal with rounded stone style
 * Mobile: Bottom sheet style with larger touch areas
 * Supports internationalization and responsive design
 */
export function LogoutConfirmDialog({
  isOpen,
  onClose,
}: LogoutConfirmDialogProps) {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const { logout } = useLogout();
  const t = useTranslations('common.ui.logoutDialog');
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Can only use Portal after client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key close
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoggingOut) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isLoggingOut]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !isLoggingOut
      ) {
        onClose();
      }
    };

    // Add delay to prevent immediate close when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isLoggingOut]);

  // Handle mobile swipe to close
  useEffect(() => {
    if (!isOpen || !isMobile || !dialogRef.current || isLoggingOut) return;

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
  }, [isOpen, isMobile, onClose, isLoggingOut]);

  // Click background to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoggingOut) {
      onClose();
    }
  };

  // Handle logout confirmation
  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!mounted) return null;

  // Desktop modal style - Stone design with compact layout
  const desktopDialog = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
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
                isDark
                  ? 'bg-red-900/20 text-red-400 ring-stone-600/50'
                  : 'bg-red-50 text-red-500 ring-stone-200/60'
              )}
            >
              <LogOut className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  'mb-2 font-serif text-lg font-semibold',
                  'text-stone-900 dark:text-stone-100'
                )}
              >
                {t('title')}
              </h3>

              <p
                className={cn(
                  'font-serif text-sm leading-relaxed',
                  'text-stone-600 dark:text-stone-400'
                )}
              >
                {t('message')}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop button area - right-aligned horizontal layout */}
        <div className="flex justify-end gap-2 px-6 py-4 pt-6">
          <button
            onClick={onClose}
            disabled={isLoggingOut}
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
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
            className={cn(
              'rounded-lg px-4 py-2 font-serif text-sm font-medium',
              'transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:ring-2 focus:ring-offset-1 focus:outline-none',
              'bg-red-600 text-white shadow-md shadow-red-900/20 hover:bg-red-700 focus:ring-red-500/40',
              isDark ? 'focus:ring-offset-stone-800' : 'focus:ring-offset-white'
            )}
          >
            {isLoggingOut ? t('loggingOut') : t('confirm')}
          </button>
        </div>

        {/* Close button - top right corner, smaller and more subtle */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
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

  // Mobile bottom sheet style - Stone style design
  const mobileDialog = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-end justify-center',
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
              isDark
                ? 'bg-red-900/20 text-red-400 ring-stone-700/50'
                : 'bg-red-50 text-red-500 ring-stone-200/50'
            )}
          >
            <LogOut className="h-8 w-8" />
          </div>

          <h3
            className={cn(
              'mb-4 text-center font-serif text-xl font-semibold',
              'text-stone-900 dark:text-stone-100'
            )}
          >
            {t('title')}
          </h3>

          <p
            className={cn(
              'mb-8 max-w-sm text-center font-serif text-base leading-relaxed',
              'text-stone-600 dark:text-stone-400'
            )}
          >
            {t('message')}
          </p>

          {/* Mobile button area - vertical layout with larger touch areas */}
          <div className="w-full space-y-3">
            <button
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className={cn(
                'w-full rounded-2xl py-4 font-serif text-base font-medium',
                'transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                'bg-red-600 text-white shadow-lg shadow-red-900/30 hover:bg-red-700 focus:ring-red-500/40',
                isDark
                  ? 'focus:ring-offset-stone-900'
                  : 'focus:ring-offset-white'
              )}
            >
              {isLoggingOut ? t('loggingOut') : t('confirm')}
            </button>
            <button
              onClick={onClose}
              disabled={isLoggingOut}
              className={cn(
                'w-full rounded-2xl py-4 font-serif text-base',
                'border transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700/50 focus:ring-stone-500/40 focus:ring-offset-stone-900'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50 focus:ring-stone-500/40 focus:ring-offset-white'
              )}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Return the corresponding dialog based on the device type
  return createPortal(isMobile ? mobileDialog : desktopDialog, document.body);
}
