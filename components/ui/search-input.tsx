'use client';

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
    return (
      <div className={cn('relative', containerClassName)}>
        <Search
          className={cn(
            'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
            'text-stone-500 dark:text-stone-400',
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
            'border-stone-300 bg-stone-50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-400 focus:ring-offset-white',
            'dark:border-stone-600 dark:bg-stone-700 dark:text-stone-200 dark:placeholder-stone-400 dark:focus:border-stone-500 dark:focus:ring-stone-500 dark:focus:ring-offset-stone-800',
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
