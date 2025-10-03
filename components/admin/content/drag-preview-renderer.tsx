'use client';

import type { ComponentInstance } from '@lib/types/about-page-components';
import { cn } from '@lib/utils';
import {
  AlignLeft,
  Grid3x3,
  Image as ImageIcon,
  Minus,
  MousePointer,
  Type,
} from 'lucide-react';

import React from 'react';

interface DragPreviewRendererProps {
  component: ComponentInstance;
  className?: string;
}

/**
 * Simplified drag preview renderer for components
 *
 * Displays a compact preview that shows the component type and key information
 * without taking up too much screen space during drag operations
 */
export function DragPreviewRenderer({
  component,
  className,
}: DragPreviewRendererProps) {
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'heading':
        return <Type className="h-4 w-4" />;
      case 'paragraph':
        return <AlignLeft className="h-4 w-4" />;
      case 'button':
        return <MousePointer className="h-4 w-4" />;
      case 'cards':
        return <Grid3x3 className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'divider':
        return <Minus className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const getPreviewText = (component: ComponentInstance): string => {
    const { type, props } = component;

    switch (type) {
      case 'heading':
        return `Heading: "${String(props.content || 'New Heading').slice(0, 30)}${String(props.content || '').length > 30 ? '...' : ''}"`;

      case 'paragraph':
        return `Paragraph: "${String(props.content || 'New paragraph').slice(0, 35)}${String(props.content || '').length > 35 ? '...' : ''}"`;

      case 'button':
        return `Button: "${String(props.text || 'Click me')}"`;

      case 'cards':
        const items = props.items as Array<{ title?: string }> | undefined;
        const itemCount = items?.length || 0;
        return `Cards: ${itemCount} item${itemCount !== 1 ? 's' : ''}`;

      case 'image':
        const alt = String(props.alt || 'Image');
        return `Image: ${alt}`;

      case 'divider':
        return `Divider`;

      default:
        return `Component: ${type}`;
    }
  };

  const getComponentTypeName = (type: string): string => {
    switch (type) {
      case 'heading':
        return 'Heading';
      case 'paragraph':
        return 'Paragraph';
      case 'button':
        return 'Button';
      case 'cards':
        return 'Cards';
      case 'image':
        return 'Image';
      case 'divider':
        return 'Divider';
      default:
        return 'Component';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 transition-colors',
        'min-h-[60px] max-w-[280px]',
        'border-stone-200 bg-stone-50 shadow-sm',
        'dark:border-stone-600 dark:bg-stone-700',
        className
      )}
    >
      {/* Component Icon */}
      <div
        className={cn(
          'flex-shrink-0 rounded-md p-2',
          'bg-stone-200 text-stone-600',
          'dark:bg-stone-600 dark:text-stone-300'
        )}
      >
        {getComponentIcon(component.type)}
      </div>

      {/* Component Info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            'text-stone-900 dark:text-stone-100'
          )}
        >
          {getComponentTypeName(component.type)}
        </p>
        <p
          className={cn(
            'truncate text-xs',
            'text-stone-600 dark:text-stone-400'
          )}
        >
          {getPreviewText(component)}
        </p>
      </div>
    </div>
  );
}
