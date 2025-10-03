'use client';

import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';

export function SidebarBackdrop() {
  const { isExpanded, hideMobileNav } = useSidebarStore();

  return (
    <div
      className={cn(
        'fixed inset-0 z-10 bg-black/20 backdrop-blur-sm',
        'transition-opacity duration-300 ease-in-out',
        'md:hidden', // Only display on mobile devices
        isExpanded
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      )}
      onClick={() => hideMobileNav()}
      aria-hidden="true"
    />
  );
}
