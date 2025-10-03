/**
 * Performance optimization utilities
 *
 * Provides debouncing, throttling, and lazy loading utilities
 * for better performance in dynamic component editing.
 */
import { PageContent } from '@lib/types/about-page-components';

import React from 'react';

/**
 * Debounce function - delays execution until after delay period of inactivity
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function - limits execution to at most once per delay period
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now();
          func(...args);
          timeoutId = null;
        },
        delay - (now - lastCall)
      );
    }
  };
}

/**
 * Create a debounced callback using React hooks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): (...args: Parameters<T>) => void {
  const debouncedCallback = React.useMemo(
    () => debounce(callback, delay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Cancel any pending debounced calls
      const debouncedFn = debouncedCallback as { cancel?: () => void };
      if (debouncedFn.cancel) {
        debouncedFn.cancel();
      }
    };
  }, [debouncedCallback]);

  return debouncedCallback;
}

/**
 * Throttled callback hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): (...args: Parameters<T>) => void {
  const throttledCallback = React.useMemo(
    () => throttle(callback, delay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps]
  );

  return throttledCallback;
}

/**
 * Virtual scrolling helper for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

export function calculateVirtualScroll(
  scrollTop: number,
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 2 } = options;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    totalHeight: itemCount * itemHeight,
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isElementIntersecting = entry.isIntersecting;
      setIsIntersecting(isElementIntersecting);

      if (isElementIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static endMeasurement(name: string): number | null {
    const startTime = this.measurements.get(name);
    if (!startTime) return null;

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.measurements.delete(name);

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(
        `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`
      );
    }

    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasurement(name);
    return fn().finally(() => {
      this.endMeasurement(name);
    });
  }

  static measure<T>(name: string, fn: () => T): T {
    this.startMeasurement(name);
    try {
      return fn();
    } finally {
      this.endMeasurement(name);
    }
  }
}

/**
 * Memoization utilities
 */
export function createMemoizedSelector<T, R>(
  selector: (input: T) => R,
  areEqual: (a: T, b: T) => boolean = Object.is
): (input: T) => R {
  let lastInput: T;
  let lastResult: R;
  let hasResult = false;

  return (input: T): R => {
    if (!hasResult || !areEqual(input, lastInput)) {
      lastInput = input;
      lastResult = selector(input);
      hasResult = true;
    }
    return lastResult;
  };
}

/**
 * Deep comparison for React dependency arrays
 */
export function useDeepCompareMemoize<T>(value: T): T {
  const ref = React.useRef<T>(value);
  const signalRef = React.useRef<number>(0);

  if (!deepEqual(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => ref.current, [signalRef.current]);
}

/**
 * Simple deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (
      !deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    )
      return false;
  }

  return true;
}

/**
 * Optimized deep clone using structuredClone with fallback
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }

  // Fallback for older browsers
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Specialized clone function for PageContent with optimized structure copying
 */
export function clonePageContent(pageContent: PageContent): PageContent {
  return {
    ...pageContent,
    sections: pageContent.sections.map(section => ({
      ...section,
      columns: section.columns.map(column =>
        column.map(comp => ({ ...comp, props: { ...comp.props } }))
      ),
    })),
    metadata: pageContent.metadata ? { ...pageContent.metadata } : undefined,
  };
}
