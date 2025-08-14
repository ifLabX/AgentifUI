'use client';

import { cn } from '@lib/utils';

import React from 'react';

// Define the property interface for the TypingDots component
interface TypingDotsProps {
  // Optional CSS class name
  className?: string;
  // Optional size, default is 'md'
  size?: 'sm' | 'md' | 'lg';
}

// Define the Tailwind classes corresponding to different sizes
const sizeClasses = {
  sm: {
    container: 'space-x-0.5', // The spacing between the points
    dot: 'h-1 w-1', // The size of the point
  },
  md: {
    container: 'space-x-1',
    dot: 'h-1.5 w-1.5',
  },
  lg: {
    container: 'space-x-1.5',
    dot: 'h-2 w-2',
  },
};

/**
 * TypingDots component
 * Display a loading indicator with an animation effect, simulating the typing state.
 * Supports three sizes: sm, md, lg.
 */
export function TypingDots({ className, size = 'md' }: TypingDotsProps) {
  // Get the corresponding style class based on the incoming size
  const currentSizeClasses = sizeClasses[size];

  return (
    // Container div, apply the spacing corresponding to the size and the incoming className
    <div
      className={cn(
        'flex items-center',
        currentSizeClasses.container,
        className
      )}
    >
      {[0, 1, 2].map(i => (
        // Single point
        <div
          key={i}
          className={cn(
            // Base style: round dot
            'rounded-full',
            // Size style
            currentSizeClasses.dot,
            // Color changes based on theme
            'bg-gray-700 dark:bg-gray-400',
            // Apply pulse animation
            'animate-pulse'
            // Apply different animation delays, achieve staggered effect (Tailwind class way)
            // {
            //   "animation-delay-0": i === 0,
            //   "animation-delay-200": i === 1,
            //   "animation-delay-400": i === 2,
            // }
          )}
          // Apply different animation delays (inline style way, more reliable)
          style={{
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Add global CSS (need to add in app/globals.css)
// @keyframes pulse {
//   0%, 100% {
//     opacity: 0.5;
//     transform: scale(0.8);
//   }
//   50% {
//     opacity: 1;
//     transform: scale(1);
//   }
// }
//
// .animate-pulse {
//   animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
// }
//
// .animation-delay-0 {
//   animation-delay: 0ms;
// }
//
// .animation-delay-200 {
//   animation-delay: 200ms;
// }
//
// .animation-delay-400 {
//   animation-delay: 400ms;
// }
