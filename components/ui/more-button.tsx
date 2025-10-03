'use client';

import { useMobile } from '@lib/hooks/use-mobile';
import { useDropdownStore } from '@lib/stores/ui/dropdown-store';
import { cn } from '@lib/utils';
import { MoreHorizontal } from 'lucide-react';

import React, { useRef } from 'react';

import { useTranslations } from 'next-intl';

interface MoreButtonProps {
  id: string;
  className?: string;
  tooltipText?: string;
}

export function MoreButton({ id, className, tooltipText }: MoreButtonProps) {
  const isMobile = useMobile();
  const { toggleDropdown, isOpen, activeDropdownId } = useDropdownStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations('common.ui.moreButton');

  // Use translation as default tooltip text if not provided
  const defaultTooltipText = tooltipText || t('ariaLabel');

  // Check if the current button is active
  const isActive = isOpen && activeDropdownId === id;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation();

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      toggleDropdown(id, {
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'cursor-pointer rounded-full p-1.5 transition-colors duration-200',
        'focus:outline-none',
        isMobile
          ? 'flex items-center justify-center'
          : 'opacity-0 group-hover:opacity-100',
        // Show when active
        isActive && 'opacity-100',
        // Base theme styles
        'text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200',
        'dark:text-gray-400 dark:hover:bg-stone-600/60 dark:hover:text-gray-200 dark:active:bg-stone-600/80',
        // Active state styles
        isActive &&
          'bg-gray-100 text-gray-700 dark:bg-stone-600/60 dark:text-gray-200',
        className
      )}
      onClick={handleClick}
      aria-label={defaultTooltipText}
      title={defaultTooltipText}
      data-more-button-id={id}
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );
}
