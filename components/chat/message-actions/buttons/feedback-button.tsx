'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';

import React from 'react';

import { useFeedbackAction } from '../hooks/use-feedback-action';

interface FeedbackButtonProps {
  onFeedback: (isPositive: boolean) => void;
  isPositive: boolean;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // whether to show tooltip arrow
  className?: string;
  active?: boolean; // whether the button is in active state
}

/**
 * Feedback button component
 *
 * A button component encapsulating feedback functionality.
 * When clicked, it triggers the feedback callback.
 * Can be a thumbs up or thumbs down button, depending on the isPositive property.
 */
export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  onFeedback,
  isPositive,
  tooltipPosition = 'bottom',
  tooltipSize = 'sm',
  showTooltipArrow = false,
  className,
  active = false,
}) => {
  // If the active property is provided, use external control; otherwise, use internal state
  const { handleFeedback, hasFeedback } = useFeedbackAction(onFeedback);

  return (
    <MessageActionButton
      icon={isPositive ? FiThumbsUp : FiThumbsDown}
      // Do not use an active icon, use color effect instead
      // activeIcon={FiCheck}
      label={isPositive ? '有用' : '无用'}
      activeLabel="已评价"
      onClick={() => handleFeedback(isPositive)}
      active={active || hasFeedback}
      tooltipPosition={tooltipPosition}
      tooltipSize={tooltipSize}
      showTooltipArrow={showTooltipArrow}
      className={className}
    />
  );
};
