'use client';

import type { PageSection } from '@lib/types/about-page-components';
import { cn } from '@lib/utils';
import { Columns, Grid2x2, Grid3x3 } from 'lucide-react';

import React from 'react';

interface SectionDragPreviewProps {
  section: PageSection;
  sectionIndex: number;
  className?: string;
}

/**
 * Simplified drag preview renderer for sections
 *
 * Displays a compact preview that shows the section layout and component count
 * without taking up too much screen space during drag operations
 */
export function SectionDragPreview({
  section,
  sectionIndex,
  className,
}: SectionDragPreviewProps) {
  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'single-column':
        return <Columns className="h-4 w-4" />;
      case 'two-column':
        return <Grid2x2 className="h-4 w-4" />;
      case 'three-column':
        return <Grid3x3 className="h-4 w-4" />;
      default:
        return <Columns className="h-4 w-4" />;
    }
  };

  const getLayoutName = (layout: string): string => {
    switch (layout) {
      case 'single-column':
        return 'single-column';
      case 'two-column':
        return 'two-column';
      case 'three-column':
        return 'three-column';
      default:
        return layout;
    }
  };

  // Calculate total component count across all columns
  const totalComponents = section.columns.reduce(
    (total, column) => total + column.length,
    0
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 transition-colors',
        'min-h-[60px] max-w-[280px]',
        'border-stone-300 bg-stone-100 shadow-sm',
        'dark:border-stone-500 dark:bg-stone-800',
        className
      )}
    >
      {/* Section Icon */}
      <div
        className={cn(
          'flex-shrink-0 rounded-md p-2',
          'bg-stone-200 text-stone-600',
          'dark:bg-stone-600 dark:text-stone-300'
        )}
      >
        {getLayoutIcon(section.layout)}
      </div>

      {/* Section Info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            'text-stone-900 dark:text-stone-100'
          )}
        >
          Section {sectionIndex + 1} • {getLayoutName(section.layout)}
        </p>
        <p className={cn('text-xs', 'text-stone-600 dark:text-stone-400')}>
          {totalComponents} component{totalComponents !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
