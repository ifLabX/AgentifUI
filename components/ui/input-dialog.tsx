'use client';

import { useMobile } from '@lib/hooks';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Pen, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText: string;
  cancelText?: string;
  isLoading?: boolean;
  maxLength?: number;
}

/**
 * Responsive input dialog component - Stone style design
 * Desktop: Centered modal, rounded stone style
 * Mobile: Bottom sheet style, keyboard-friendly design
 * Used for renaming and other user input operations
 */
export function InputDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  label,
  placeholder,
  defaultValue = '',
  confirmText,
  cancelText,
  isLoading = false,
  maxLength = 100,
}: InputDialogProps) {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const t = useTranslations('common.ui');
  const finalCancelText = cancelText || t('cancel');
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);

  // Can only use Portal after client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // When the dialog is opened, reset the input value and focus
  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      // Delay focus to ensure the component has rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 150);
    }
  }, [isOpen, defaultValue]);

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

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !isLoading
      ) {
        onClose();
      }
    };

    // Add delay to avoid closing immediately when opened
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !isLoading) {
      onConfirm(trimmedValue);
    }
  };

  // Check if the input is valid
  const isInputValid = inputValue.trim().length > 0;

  if (!mounted) return null;

  // Desktop modal style - Stone style design
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
        <form onSubmit={handleSubmit}>
          {/* Desktop compact header with horizontal layout */}
          <div className="flex items-center px-6 pt-6 pb-4">
            <div
              className={cn(
                'mr-4 flex h-10 w-10 items-center justify-center rounded-lg',
                'ring-1 ring-inset',
                isDark
                  ? 'bg-stone-700/60 text-stone-300 ring-stone-600/50'
                  : 'bg-stone-100 text-stone-600 ring-stone-200/60'
              )}
            >
              <Pen className="h-5 w-5" />
            </div>

            <h3
              className={cn(
                'flex-1 font-serif text-lg font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              {title}
            </h3>
          </div>

          {/* Desktop compact input area */}
          <div className="px-6 pb-4">
            <label
              className={cn(
                'mb-2 block font-serif text-sm font-medium',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              {label}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={isLoading}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 font-serif text-sm',
                  'border transition-all duration-200',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                  isDark
                    ? 'border-stone-600 bg-stone-700/50 text-white placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500/40 focus:ring-offset-stone-800'
                    : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder-stone-500 focus:border-stone-500 focus:ring-stone-500/40 focus:ring-offset-white'
                )}
              />
              {maxLength && (
                <div
                  className={cn(
                    'absolute right-0 -bottom-5 text-xs',
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}
                >
                  {inputValue.length}/{maxLength}
                </div>
              )}
            </div>
          </div>

          {/* Desktop button area - right-aligned horizontal layout */}
          <div className="flex justify-end gap-2 px-6 py-4 pt-6">
            <button
              type="button"
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
              type="submit"
              disabled={isLoading || !isInputValid}
              className={cn(
                'rounded-lg px-4 py-2 font-serif text-sm font-medium',
                'transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:ring-2 focus:ring-offset-1 focus:outline-none',
                isDark
                  ? 'bg-stone-600 text-white shadow-md shadow-stone-900/30 hover:bg-stone-700 focus:ring-stone-500/40 focus:ring-offset-stone-800'
                  : 'bg-stone-700 text-white shadow-md shadow-stone-900/15 hover:bg-stone-800 focus:ring-stone-500/40 focus:ring-offset-white'
              )}
            >
              {isLoading ? t('loading') : confirmText}
            </button>
          </div>

          {/* Close button - top right corner, smaller and more subtle */}
          <button
            type="button"
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
        </form>
      </div>
    </div>
  );

  // Mobile bottom sheet style - Stone style design, keyboard-friendly
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
        <form onSubmit={handleSubmit}>
          {/* Mobile top drag handle - thicker and more visible */}
          <div className="flex items-center justify-center pt-4 pb-2">
            <div
              className={cn(
                'h-1.5 w-16 rounded-full',
                isDark ? 'bg-stone-600' : 'bg-stone-300'
              )}
            ></div>
          </div>

          {/* Mobile icon and title area */}
          <div className="flex flex-col items-center px-6 pt-4 pb-6">
            <div
              className={cn(
                'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
                'ring-1 ring-inset',
                isDark
                  ? 'bg-stone-700/50 text-stone-400 ring-stone-700/50'
                  : 'bg-stone-100 text-stone-500 ring-stone-200/50'
              )}
            >
              <Pen className="h-8 w-8" />
            </div>

            <h3
              className={cn(
                'mb-6 text-center font-serif text-xl font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              {title}
            </h3>

            {/* Mobile input area - larger touch areas */}
            <div className="w-full">
              <label
                className={cn(
                  'mb-3 block font-serif text-base font-medium',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {label}
              </label>
              <div className="relative mb-8">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-2xl px-4 py-4 font-serif text-base',
                    'border-2 transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                    isDark
                      ? 'border-stone-600 bg-stone-800/50 text-white placeholder-stone-500 focus:border-stone-500 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                      : 'border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-500 focus:border-stone-600 focus:ring-stone-500/30 focus:ring-offset-white'
                  )}
                />
                {maxLength && (
                  <div
                    className={cn(
                      'absolute right-0 -bottom-6 text-sm',
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )}
                  >
                    {inputValue.length}/{maxLength}
                  </div>
                )}
              </div>

              {/* Mobile button area - vertical layout, larger touch areas */}
              <div className="w-full space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !isInputValid}
                  className={cn(
                    'w-full rounded-2xl py-4 font-serif text-base',
                    'transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                    isDark
                      ? 'bg-stone-600 text-white shadow-lg shadow-stone-900/20 hover:bg-stone-700 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                      : 'bg-stone-600 text-white shadow-lg shadow-stone-900/10 hover:bg-stone-700 focus:ring-stone-500/30 focus:ring-offset-white'
                  )}
                >
                  {isLoading ? t('loading') : confirmText}
                </button>
                <button
                  type="button"
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
        </form>
      </div>
    </div>
  );

  // Return the corresponding dialog based on the device type
  return createPortal(isMobile ? mobileDialog : desktopDialog, document.body);
}
