'use client';

import { createPortal } from 'react-dom';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
type TooltipSize = 'sm' | 'md';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  id: string;
  placement?: TooltipPlacement;
  size?: TooltipSize;
  showArrow?: boolean;
  className?: string;
  delayShow?: number;
  delayHide?: number;
}

// Utility function, used to merge class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Global state, ensure it is defined outside the component
let activeTooltipId: string | null = null;
const listeners: ((id: string | null) => void)[] = [];

const tooltipState = {
  showTooltip(id: string) {
    activeTooltipId = id;
    listeners.forEach(listener => listener(activeTooltipId));
  },

  hideTooltip() {
    activeTooltipId = null;
    listeners.forEach(listener => listener(activeTooltipId));
  },

  subscribe(listener: (id: string | null) => void) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  },

  getActiveId() {
    return activeTooltipId;
  },
};

// Tooltip container component
export function TooltipContainer() {
  const [_isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Ensure the container exists
    if (!document.getElementById('tooltip-root')) {
      const tooltipRoot = document.createElement('div');
      tooltipRoot.id = 'tooltip-root';
      tooltipRoot.className =
        'fixed z-[9999] top-0 left-0 w-full h-0 overflow-visible pointer-events-none';
      document.body.appendChild(tooltipRoot);
    }

    return () => setIsMounted(false);
  }, []);

  return null; // No need to render anything, because we have created the container in useEffect
}

export function Tooltip({
  children,
  content,
  id,
  placement = 'top',
  size = 'md',
  showArrow = true,
  className,
  delayShow = 100, // Reduce delay, make response faster
  delayHide = 100,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get the style based on the size
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-0.5 rounded text-xs leading-snug',
          arrow: 'w-1.5 h-1.5',
          arrowOffset: '3px',
        };
      case 'md':
      default:
        return {
          container: 'px-2 py-1 rounded-md text-sm leading-snug',
          arrow: 'w-2 h-2',
          arrowOffset: '4px',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Client-side mount detection
  useEffect(() => {
    setMounted(true);

    // Subscribe to the global tooltip state
    const unsubscribe = tooltipState.subscribe(activeId => {
      setIsVisible(activeId === id);
    });

    return () => {
      // Do not call setMounted(false) in the cleanup function, this may cause an infinite loop update
      unsubscribe();
    };
  }, [id]);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const tooltipRoot = document.getElementById('tooltip-root');
    if (!tooltipRoot) return;

    const tooltipEl = tooltipRef.current;
    const triggerRect = triggerRef.current.getBoundingClientRect();

    // First make the tooltip visible but outside the screen to measure the size
    tooltipEl.style.visibility = 'hidden';
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.top = '-9999px';
    tooltipEl.style.left = '-9999px';

    // Get the tooltip size
    const tooltipRect = tooltipEl.getBoundingClientRect();

    if (tooltipRect.width === 0 || tooltipRect.height === 0) {
      tooltipEl.style.visibility = 'hidden';
      return;
    }

    // Calculate the position
    let top: number;
    let left: number;
    // The gap between the tooltip and the trigger element - the right placement increases the distance
    const gap = placement === 'right' ? 10 : 8;
    let effectivePlacement = placement;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + gap;
        break;
      default:
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    }

    // Boundary check
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const margin = 10; // The minimum distance from the edge of the viewport

    // Horizontal boundary check
    if (left < margin) {
      left = margin;
    } else if (left + tooltipRect.width > viewportWidth - margin) {
      left = viewportWidth - tooltipRect.width - margin;
    }

    // Vertical boundary check, including flip logic
    if (placement === 'top' && top < margin) {
      // Try to flip down
      const newTop = triggerRect.bottom + gap;
      if (newTop + tooltipRect.height <= viewportHeight - margin) {
        top = newTop;
        effectivePlacement = 'bottom';
      } else {
        top = margin;
      }
    } else if (
      placement === 'bottom' &&
      top + tooltipRect.height > viewportHeight - margin
    ) {
      // Try to flip up
      const newTop = triggerRect.top - tooltipRect.height - gap;
      if (newTop >= margin) {
        top = newTop;
        effectivePlacement = 'top';
      } else {
        top = viewportHeight - tooltipRect.height - margin;
      }
    }

    // Apply the final position
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.visibility = 'visible';

    // Update the arrow direction
    tooltipEl.setAttribute('data-placement', effectivePlacement);
  };

  const handleMouseEnter = () => {
    // Detect if it is a mobile device (simplified version)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    showTimeoutRef.current = setTimeout(() => {
      tooltipState.showTooltip(id);
    }, delayShow);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      tooltipState.hideTooltip();
    }, delayHide);
  };

  // When the tooltip visibility changes, update its position
  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(updatePosition);
    }
  }, [isVisible, id]);

  // Listen for scroll and window size adjustment events
  useEffect(() => {
    if (!isVisible) return;

    const handleScroll = () => requestAnimationFrame(updatePosition);
    const handleResize = () => requestAnimationFrame(updatePosition);

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible]);

  // Clean up the timer when the component is unmounted
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Detect if it is a mobile device (simplified version)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Do not render the tooltip on mobile devices
  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-tooltip-id={id} // Add data attribute for debugging
      >
        {children}
      </div>

      {/* Tooltip content */}
      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`pointer-events-none fixed z-[9999] transition-opacity duration-200 ${
              isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{
              visibility: isVisible ? 'visible' : 'hidden',
              top: '-9999px',
              left: '-9999px',
            }}
            data-placement={placement}
            data-tooltip-content-id={id} // Add data attribute for debugging
          >
            <div
              className={cn(
                'pointer-events-auto relative max-w-sm break-words',
                'bg-opacity-95 border border-gray-200/10 shadow-md backdrop-blur-sm',
                sizeStyles.container,
                'bg-gray-800 text-gray-100',
                className
              )}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {content}
              {/* Arrow element - optional display */}
              {showArrow && (
                <div
                  className={cn(
                    'absolute rotate-45 border-inherit bg-inherit',
                    sizeStyles.arrow,
                    placement === 'top' &&
                      `bottom-[-${sizeStyles.arrowOffset}] left-1/2 -translate-x-1/2 border-r border-b`,
                    placement === 'bottom' &&
                      `top-[-${sizeStyles.arrowOffset}] left-1/2 -translate-x-1/2 border-t border-l`,
                    placement === 'left' &&
                      `right-[-${sizeStyles.arrowOffset}] top-1/2 -translate-y-1/2 border-t border-r`,
                    placement === 'right' &&
                      `left-[-${sizeStyles.arrowOffset}] top-1/2 -translate-y-1/2 border-b border-l`
                  )}
                />
              )}
            </div>
          </div>,
          document.getElementById('tooltip-root') || document.body
        )}
    </>
  );
}

// Simplified TooltipProvider component, only responsible for rendering TooltipContainer
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TooltipContainer />
      {children}
    </>
  );
}

// Export hideTooltip function for external use
export const hideActiveTooltip = tooltipState.hideTooltip;
