'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useDropdownStore } from '@lib/stores/ui/dropdown-store';
import { cn } from '@lib/utils';

import React, { useEffect, useRef } from 'react';

interface DropdownItemProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}

function DropdownItem({
  icon,
  children,
  onClick,
  className,
  danger = false,
}: DropdownItemProps) {
  const { isDark } = useTheme();
  const { closeDropdown } = useDropdownStore();

  const handleClick = (e: React.MouseEvent) => {
    // prevent event bubbling
    e.stopPropagation();
    closeDropdown();
    onClick?.();
  };

  return (
    <button
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
        'transition-all duration-200',
        isDark
          ? [
              danger
                ? 'text-red-300 hover:bg-red-900/40 active:bg-red-900/60'
                : 'text-gray-200 hover:bg-stone-600/60 active:bg-stone-600/80',
            ]
          : [
              danger
                ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
            ],
        className
      )}
      onClick={handleClick}
    >
      {icon && <span className="h-4 w-4 flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
}

interface DropdownDividerProps {
  className?: string;
}

function DropdownDivider({ className }: DropdownDividerProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={cn(
        'mx-3 my-1.5 h-px',
        isDark ? 'bg-stone-600/80' : 'bg-gray-200/80',
        className
      )}
    />
  );
}

interface DropdownMenuProps {
  id: string;
  className?: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  minWidth?: number;
}

export function DropdownMenu({
  id,
  className,
  children,
  minWidth = 180,
}: DropdownMenuProps) {
  const { isDark } = useTheme();
  const { isOpen, activeDropdownId, position, closeDropdown } =
    useDropdownStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isVisible = isOpen && activeDropdownId === id;

  // modify the listener to close the dropdown menu when clicking outside
  useEffect(() => {
    // use mouseup event instead of mousedown to avoid conflict with button click
    const handleClickOutside = (event: MouseEvent) => {
      // check if the clicked element is more-button or its child element
      const target = event.target as Element;
      const isMoreButton = target.closest('[data-more-button-id]');

      // if it is more-button, do not execute the close operation, let the button's own click event handle it
      if (isMoreButton) {
        return;
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isVisible) {
      // use setTimeout to delay adding the listener to avoid conflict with the current click event
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, closeDropdown, id]);

  // close the dropdown menu when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        closeDropdown();
      }
    };

    // use capture mode to listen to all scroll events, including scroll events inside the container
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isVisible, closeDropdown]);

  // handle ESC key to close the menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        closeDropdown();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, closeDropdown]);

  if (!isVisible || !position) return null;

  const handleMenuClick = (e: React.MouseEvent) => {
    // prevent menu click event from bubbling
    e.stopPropagation();
  };

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'animate-fade-in fixed z-50',
        'rounded-xl py-2 shadow-lg backdrop-blur-sm',
        'overflow-hidden',
        isDark
          ? 'border border-stone-600/80 bg-stone-800/95 shadow-black/20'
          : 'border border-gray-200/80 bg-white/95 shadow-gray-200/40',
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        minWidth: `${minWidth}px`,
      }}
      onClick={handleMenuClick}
    >
      {children}
    </div>
  );
}

DropdownMenu.Item = DropdownItem;
DropdownMenu.Divider = DropdownDivider;
