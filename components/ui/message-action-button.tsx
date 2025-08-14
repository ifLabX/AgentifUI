'use client';

import { cn } from '@lib/utils';
import { IconType } from 'react-icons';

import React from 'react';

import { TooltipWrapper } from './tooltip-wrapper';

interface MessageActionButtonProps {
  icon: IconType;
  activeIcon?: IconType;
  label: string;
  activeLabel?: string;
  onClick: () => void;
  className?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  active?: boolean;
  tooltipSize?: 'sm' | 'md';
  showTooltipArrow?: boolean;
}

export const MessageActionButton: React.FC<MessageActionButtonProps> = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  activeLabel,
  onClick,
  className,
  tooltipPosition = 'bottom',
  disabled = false,
  active = false,
  tooltipSize = 'sm',
  showTooltipArrow = false,
}) => {
  // Use the external active property to control the state, instead of the internal state
  // The current displayed icon and label
  // If the button is active and an active icon is provided, use the active icon
  const DisplayIcon = active && ActiveIcon ? ActiveIcon : Icon;
  const displayLabel = active && activeLabel ? activeLabel : label;

  const tooltipId = `tooltip-${displayLabel.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={displayLabel}
      className={cn(
        'flex items-center justify-center rounded-md p-1.5 transition-all',
        'text-sm',
        // Button style, do not change background when active
        'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700',
        'dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200',
        // Keep the original color when active, do not use blue
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
        className
      )}
    >
      <DisplayIcon
        className={cn('h-4 w-4', active && !ActiveIcon && 'fill-current')}
      />
    </button>
  );

  if (disabled) {
    return button;
  }

  return (
    <TooltipWrapper
      content={displayLabel}
      id={tooltipId}
      placement={tooltipPosition}
      size={tooltipSize}
      showArrow={showTooltipArrow}
      _desktopOnly={true}
    >
      {button}
    </TooltipWrapper>
  );
};
