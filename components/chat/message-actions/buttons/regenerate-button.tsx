'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { cn } from '@lib/utils';
import { FiRefreshCw } from 'react-icons/fi';

import React from 'react';

import { useRegenerateAction } from '../hooks/use-regenerate-action';

interface RegenerateButtonProps {
  onRegenerate: () => void;
  isRegenerating?: boolean;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // whether to show tooltip arrow
  className?: string;
}

/**
 * Regenerate button component
 *
 * A button component encapsulating the regenerate functionality.
 * When clicked, it triggers the regenerate callback.
 * Supports displaying loading state.
 */
export const RegenerateButton: React.FC<RegenerateButtonProps> = ({
  onRegenerate,
  isRegenerating = false,
  tooltipPosition = 'bottom',
  tooltipSize = 'sm',
  showTooltipArrow = false,
  className,
}) => {
  const { handleRegenerate } = useRegenerateAction(
    onRegenerate,
    isRegenerating
  );

  return (
    <MessageActionButton
      icon={FiRefreshCw}
      label="重新生成"
      onClick={handleRegenerate}
      disabled={isRegenerating}
      tooltipPosition={tooltipPosition}
      tooltipSize={tooltipSize}
      showTooltipArrow={showTooltipArrow}
      className={cn(isRegenerating ? 'animate-spin' : '', className)}
    />
  );
};
