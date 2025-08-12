import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: '',
        secondary: '',
        ghost: '',
        link: '',
        gradient:
          'bg-gradient-to-r from-stone-700 to-stone-500 text-white shadow-sm hover:from-stone-800 hover:to-stone-600 hover:shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-12 rounded-md px-8 text-base',
        xl: 'h-14 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const { isDark } = useTheme();

    // generate styles dynamically based on variant and isDark
    const getVariantStyles = () => {
      switch (variant) {
        case 'outline':
          return cn(
            'border-2 bg-transparent hover:border-gray-400 hover:bg-gray-100',
            isDark
              ? 'border-gray-600 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
              : 'border-gray-300 text-gray-800'
          );
        case 'secondary':
          return cn(
            'shadow-sm hover:shadow',
            isDark
              ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          );
        case 'ghost':
          return cn(
            isDark
              ? 'hover:bg-gray-800 hover:text-gray-100'
              : 'hover:bg-gray-100 hover:text-gray-900'
          );
        case 'link':
          return cn(
            'underline-offset-4 hover:underline',
            isDark ? 'text-stone-400' : 'text-stone-700'
          );
        default:
          return '';
      }
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          getVariantStyles()
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
