'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

import * as React from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const { isDark } = useTheme();

  return (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        isDark
          ? 'focus-visible:ring-stone-500 focus-visible:ring-offset-stone-900 data-[state=checked]:bg-stone-600 data-[state=unchecked]:bg-stone-700'
          : 'focus-visible:ring-stone-500 focus-visible:ring-offset-white data-[state=checked]:bg-stone-800 data-[state=unchecked]:bg-stone-300',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full shadow-md ring-0 transition-all duration-200',
          isDark
            ? 'bg-stone-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5'
            : 'bg-white data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5'
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
