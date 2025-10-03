'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { MoreHorizontal } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

interface TableDropdownProps {
  children: React.ReactNode;
  className?: string;
}

export function TableDropdown({ children, className }: TableDropdownProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'rounded-lg p-2 transition-colors',
          isDark
            ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
            : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 z-50 mt-1 min-w-[160px] rounded-lg border shadow-lg',
            isDark
              ? 'border-stone-700 bg-stone-800'
              : 'border-stone-200 bg-white'
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
