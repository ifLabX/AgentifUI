'use client';

import { useFilePreviewStore } from '@lib/stores/ui/file-preview-store';
import { cn } from '@lib/utils';

// File preview panel background backdrop component
// Only display on mobile devices (md breakpoint and below), and appear when preview is open
// Clicking the backdrop will call closePreview to close the panel
export function FilePreviewBackdrop() {
  const { isPreviewOpen, closePreview } = useFilePreviewStore();

  return (
    <div
      className={cn(
        // Basic style: fixed positioning, cover full screen, background blur, layer below panel
        'bg-background/70 fixed inset-0 z-40 backdrop-blur-sm',
        // Transition effect
        'transition-opacity duration-300 ease-in-out',
        // Responsive: only display on md breakpoint and below
        'md:hidden',
        // Visibility: control transparency and interaction based on isPreviewOpen
        isPreviewOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      )}
      // Click event: call closePreview
      onClick={closePreview}
      aria-hidden="true"
    />
  );
}
