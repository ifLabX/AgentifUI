'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Search } from 'lucide-react';

import * as React from 'react';

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  containerClassName?: string;
  iconClassName?: string;
}

/**
 * Reusable search input component with search icon
 * Provides consistent styling and theming across the application
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      iconClassName,
      value,
      onValueChange,
      placeholder,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();

    return (
      <div className={cn('relative', containerClassName)}>
        <Search
          className={cn(
            'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
            isDark ? 'text-stone-400' : 'text-stone-500',
            iconClassName
          )}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onValueChange(e.target.value)}
          className={cn(
            'w-full rounded-lg border py-2.5 pr-4 pl-10 font-serif text-sm transition-all duration-200',
            'focus:ring-2 focus:ring-offset-2 focus:outline-none',
            isDark
              ? 'border-stone-600 bg-stone-700 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800'
              : 'border-stone-300 bg-stone-50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-400 focus:ring-offset-white',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
