'use client';

// Default icon
import { useDropdownStore } from '@lib/stores/ui/dropdown-store';
import { cn } from '@lib/utils';
import { User } from 'lucide-react';

import React, { useRef } from 'react';

import { useTranslations } from 'next-intl';

interface UserAvatarDisplayProps {
  // Future can pass in src to display picture avatar
  // src?: string;
  alt?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  dropdownId: string;
  isDark: boolean; // Add isDark prop
}

/**
 * User avatar button component
 * Used to display user avatar (currently placeholder icon), and as a trigger for dropdown menu
 * Design style consistent with the stone theme of the application, with enough contrast
 */
export function AvatarButton({
  alt,
  onClick,
  dropdownId,
  isDark, // Receive isDark prop
}: UserAvatarDisplayProps) {
  const t = useTranslations('navbar.user');
  const avatarRef = useRef<HTMLButtonElement>(null);
  const { toggleDropdown, isOpen, activeDropdownId } = useDropdownStore();

  // Use translation as default value
  const defaultAlt = alt || t('userMenu');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const menuWidthEstimate = 160;
      const screenPadding = 8;
      let left = rect.right + window.scrollX - menuWidthEstimate;
      if (left + menuWidthEstimate > window.innerWidth - screenPadding) {
        left = window.innerWidth - menuWidthEstimate - screenPadding;
      }
      if (left < screenPadding) {
        left = screenPadding;
      }
      const position = {
        top: rect.bottom + window.scrollY + 4,
        left: left,
      };
      toggleDropdown(dropdownId, position);
    }
    onClick?.(event);
  };

  const isDropdownActive = isOpen && activeDropdownId === dropdownId;

  // Select colors based on theme status
  const getButtonStyles = () => {
    // Dark mode, use dark stone color
    if (isDark) {
      return {
        base: 'bg-stone-700',
        hover: 'hover:bg-stone-600',
        active: isDropdownActive ? 'bg-stone-600' : 'bg-stone-700',
        iconColor: 'text-stone-300',
      };
    }
    // Light mode, use light stone color
    else {
      return {
        base: 'bg-stone-200',
        hover: 'hover:bg-stone-300',
        active: isDropdownActive ? 'bg-stone-300' : 'bg-stone-200',
        iconColor: 'text-stone-700',
      };
    }
  };

  const styles = getButtonStyles();

  return (
    <button
      ref={avatarRef}
      onClick={handleClick}
      className={cn(
        // Base styles
        'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full',
        styles.base,
        styles.hover,
        styles.active,
        'focus:outline-none', // Remove focus ring

        'mt-1', // Keep top margin
        'cursor-pointer hover:scale-105' // Add hover pointer and scale effect
      )}
      aria-label={defaultAlt}
      data-more-button-id={`${dropdownId}-trigger`}
    >
      {/* Future can replace with <Image /> component to display user avatar */}
      <User className={cn('h-5 w-5', styles.iconColor)} />
    </button>
  );
}
