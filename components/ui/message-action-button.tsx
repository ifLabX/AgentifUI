'use client';

import { cn } from '@lib/utils';
import { IconType } from 'react-icons';

import React from 'react';

import { TooltipWrapper } from './tooltip-wrapper';

interface MessageActionButtonProps {
  icon: IconType;
  activeIcon?: IconType; // Optional: active state icon
  label: string;
  activeLabel?: string; // Optional: active state label
  onClick: () => void;
  className?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  active?: boolean; // Whether the button is active
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // Whether to show tooltip arrow
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
  tooltipSize = 'sm', // message-actions default use small size
  showTooltipArrow = false, // message-actions default do not show arrow
}) => {
  // Use the external active property to control the state, instead of the internal state
  // The current displayed icon and label
  // If the button is active and an active icon is provided, use the active icon
  const DisplayIcon = active && ActiveIcon ? ActiveIcon : Icon;
  const displayLabel = active && activeLabel ? activeLabel : label;

  // Create a unique tooltip ID
  const tooltipId = `tooltip-${displayLabel.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;

  const handleClick = () => {
    if (!disabled) {
      // Directly call the external click handler, do not manage the state internally
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
        className={cn(
          'h-4 w-4',
          // Only use fill effect when no active icon is provided
          // This way the copy button will show a checkmark, and the feedback button will fill the original icon
          active && !ActiveIcon && 'fill-current'
        )}
      />
    </button>
  );

  // If the button is disabled, do not use tooltip
  if (disabled) {
    return button;
  }

  // Use TooltipWrapper to wrap the button, pass new tooltip properties
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
