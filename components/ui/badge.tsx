/**
 * Modern Badge Component
 * @description Elegant badge component with multiple variants and animations
 * @module components/ui/badge
 */
import { cn } from '@lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

import * as React from 'react';

const badgeVariants = cva(
  'focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/80 border-transparent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent',
        outline: 'text-foreground',
        success:
          'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        info: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        purple:
          'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
