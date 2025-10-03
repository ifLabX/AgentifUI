'use client';

import { Tooltip, type TooltipProps } from '@components/ui/tooltip';
import { ClientRender } from '@lib/utils/client-render';

import { ReactNode } from 'react';

interface TooltipWrapperProps extends Omit<TooltipProps, 'children'> {
  children: ReactNode;
  /**
   * Whether to display the tooltip only on non-mobile devices
   * If true, the tooltip will not be displayed on mobile devices (default handled by Tooltip component)
   */
  _desktopOnly?: boolean;
}

/**
 * Tooltip wrapper component
 *
 * Enhance the original Tooltip component, solving the problem of server-side rendering and client-side rendering mismatch
 * Only render the child element on the server-side rendering, and add the Tooltip function on the client-side rendering
 */
export function TooltipWrapper({
  children,
  ...tooltipProps
}: TooltipWrapperProps) {
  return (
    <ClientRender fallback={children}>
      {() => <Tooltip {...tooltipProps}>{children}</Tooltip>}
    </ClientRender>
  );
}
