'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';

import React from 'react';

import { useFeedbackAction } from '../hooks/use-feedback-action';

interface FeedbackButtonProps {
  onFeedback: (isPositive: boolean) => void;
  isPositive: boolean;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip尺寸
  showTooltipArrow?: boolean; // 是否显示tooltip箭头
  className?: string;
  active?: boolean; // 是否处于激活状态
}

/**
 * 反馈按钮组件
 *
 * 封装了反馈功能的按钮，点击后会触发反馈回调
 * 可以是点赞或踩按钮，取决于isPositive属性
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
  // 如果提供了active属性，使用外部控制，否则使用内部状态
  const { handleFeedback, hasFeedback } = useFeedbackAction(onFeedback);

  return (
    <MessageActionButton
      icon={isPositive ? FiThumbsUp : FiThumbsDown}
      // 不使用激活图标，而是使用染色效果
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
