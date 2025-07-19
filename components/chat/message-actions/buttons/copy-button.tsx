'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { FiCheck, FiCopy } from 'react-icons/fi';

import React from 'react';

import { useCopyAction } from '../hooks/use-copy-action';

interface CopyButtonProps {
  content?: string;
  disabled?: boolean;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // whether to show tooltip arrow
  className?: string;
}

/**
 * Copy button component
 *
 * A button component encapsulating copy functionality.
 * When clicked, it copies the specified content and shows a copied state.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  disabled = false,
  tooltipPosition = 'bottom',
  tooltipSize = 'sm',
  showTooltipArrow = false,
  className,
}) => {
  const { handleCopy, isCopied } = useCopyAction(content || '');

  // Do not perform copy if there is no content or the button is disabled
  const handleClick = () => {
    if (disabled || !content || content.trim().length === 0) {
      return;
    }
    handleCopy();
  };

  return (
    <MessageActionButton
      icon={FiCopy}
      activeIcon={FiCheck}
      label={disabled ? '无内容可复制' : '复制'}
      activeLabel="已复制"
      onClick={handleClick}
      active={isCopied && !disabled}
      disabled={disabled}
      tooltipPosition={tooltipPosition}
      tooltipSize={tooltipSize}
      showTooltipArrow={showTooltipArrow}
      className={className}
    />
  );
};
