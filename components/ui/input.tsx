import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { isDark } = useTheme();

    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border-2 px-4 py-2 font-serif text-sm transition-all duration-200',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDark
            ? 'border-stone-600 bg-stone-800/50 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 focus:ring-stone-500/20'
            : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-500 focus:border-stone-500 focus:ring-stone-500/20',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
