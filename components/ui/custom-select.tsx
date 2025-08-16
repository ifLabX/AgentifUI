'use client';

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
          'border-stone-300 bg-white text-stone-900 hover:border-stone-400',
          'dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:hover:border-stone-500',
          isOpen && 'border-stone-400 dark:border-stone-500'
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
            'text-stone-500 dark:text-stone-400'
          )}
        />
      </button>

      {/* Dropdown options list */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg',
            'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-700'
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
                  ? 'bg-stone-100 text-stone-900 dark:bg-stone-600 dark:text-stone-100'
                  : 'text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-600'
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check
                  className={cn(
                    'h-4 w-4',
                    'text-stone-600 dark:text-stone-300'
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
