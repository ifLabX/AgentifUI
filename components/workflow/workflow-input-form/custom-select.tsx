'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Check, ChevronDown } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
  className?: string;
}

/**
 * Modernized custom dropdown select component
 *
 * Features:
 * - Modernized design
 * - Smooth animation effect
 * - Support keyboard navigation
 * - Unified stone color theme
 */
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  className,
}: CustomSelectProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex]);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, options, onChange]);

  // Scroll to highlighted option
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  const selectedOption = options.find(option => option === value);

  const triggerClasses = cn(
    'w-full rounded-xl border-2 px-4 py-3 font-serif transition-all duration-300',
    'focus:border-stone-500 focus:ring-4 focus:ring-stone-500/20 focus:outline-none',
    'backdrop-blur-sm focus:shadow-lg focus:shadow-stone-500/25',
    'flex cursor-pointer items-center justify-between select-none',
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' +
          (isDark ? ' bg-red-900/10' : ' bg-red-50/50')
      : isDark
        ? 'border-stone-600 bg-stone-800/90 text-stone-100 hover:border-stone-500'
        : 'border-stone-300 bg-white/90 text-stone-900 hover:border-stone-400',
    className
  );

  const dropdownClasses = cn(
    'absolute top-full right-0 left-0 z-40 mt-2',
    'rounded-xl border-2 shadow-xl backdrop-blur-xl',
    'max-h-60 overflow-y-auto',
    'transform transition-all duration-300 ease-out',
    isOpen
      ? 'translate-y-0 scale-100 opacity-100'
      : 'pointer-events-none -translate-y-2 scale-95 opacity-0',
    isDark ? 'border-stone-600 bg-stone-800/95' : 'border-stone-300 bg-white/95'
  );

  const optionClasses = (index: number, isSelected: boolean) =>
    cn(
      'cursor-pointer px-4 py-3 transition-all duration-200',
      'flex items-center justify-between font-serif',
      'first:rounded-t-xl last:rounded-b-xl',
      index === highlightedIndex
        ? isDark
          ? 'bg-stone-700 text-stone-100 shadow-sm'
          : 'bg-stone-100 text-stone-900 shadow-sm'
        : isSelected
          ? isDark
            ? 'bg-stone-700/50 text-stone-200'
            : 'bg-stone-50 text-stone-800'
          : isDark
            ? 'text-stone-300 hover:bg-stone-700/30'
            : 'text-stone-700 hover:bg-stone-50'
    );

  return (
    <div ref={selectRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClasses}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className={cn(
            selectedOption ? '' : isDark ? 'text-stone-500' : 'text-stone-400'
          )}
        >
          {selectedOption || placeholder}
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        />
      </div>

      <div className={dropdownClasses}>
        <div ref={optionsRef} role="listbox">
          {options.map((option, index) => {
            const isSelected = option === value;
            return (
              <div
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                  setHighlightedIndex(-1);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={optionClasses(index, isSelected)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{option}</span>
                {isSelected && (
                  <Check
                    className={cn(
                      'ml-2 h-4 w-4',
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
