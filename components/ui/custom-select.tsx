'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Check, ChevronDown } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder,
  className,
}: CustomSelectProps) {
  const { isDark } = useTheme();
  const t = useTranslations('common.ui.customSelect');
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      {/* Selector trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
          isDark
            ? 'border-stone-600 bg-stone-700 text-stone-100 hover:border-stone-500'
            : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400',
          isOpen && (isDark ? 'border-stone-500' : 'border-stone-400')
        )}
      >
        <span
          className={cn(selectedOption ? 'text-inherit' : 'text-stone-500')}
        >
          {selectedOption
            ? selectedOption.label
            : placeholder || t('placeholder')}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        />
      </button>

      {/* Dropdown options list */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg',
            isDark
              ? 'border-stone-600 bg-stone-700'
              : 'border-stone-300 bg-white'
          )}
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                'first:rounded-t-lg last:rounded-b-lg',
                value === option.value
                  ? isDark
                    ? 'bg-stone-600 text-stone-100'
                    : 'bg-stone-100 text-stone-900'
                  : isDark
                    ? 'text-stone-200 hover:bg-stone-600'
                    : 'text-stone-700 hover:bg-stone-50'
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check
                  className={cn(
                    'h-4 w-4',
                    isDark ? 'text-stone-300' : 'text-stone-600'
                  )}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
