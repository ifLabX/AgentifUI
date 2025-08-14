'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { MessageActionsContainer } from '@components/ui/message-actions-container';
import { cn } from '@lib/utils';
import {
  FiCheck,
  FiCopy,
  FiRefreshCw,
  FiThumbsDown,
  FiThumbsUp,
} from 'react-icons/fi';

import React from 'react';

import { useTranslations } from 'next-intl';

interface AssistantMessageActionsProps {
  messageId: string;
  onCopy: () => void;
  onRegenerate: () => void;
  onFeedback: (isPositive: boolean) => void;
  className?: string;
  isRegenerating?: boolean;
}

/**
 * Assistant message action buttons component
 *
 * Combines copy, regenerate, and feedback buttons for the assistant message action area.
 */
export const AssistantMessageActions: React.FC<
  AssistantMessageActionsProps
> = ({
  onCopy,
  onRegenerate,
  onFeedback,
  className,
  isRegenerating = false,
}) => {
  const t = useTranslations('components.chat.messageActions');

  return (
    <MessageActionsContainer
      align="left"
      isAssistantMessage={true}
      className={className}
    >
      {/* Copy button, shows check icon and label when active */}
      <MessageActionButton
        icon={FiCopy}
        activeIcon={FiCheck}
        label={t('copy')}
        activeLabel={t('copied')}
        onClick={onCopy}
        tooltipPosition="bottom"
      />
      {/* Regenerate button, shows spinning animation when regenerating */}
      <MessageActionButton
        icon={FiRefreshCw}
        label={t('regenerate')}
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={isRegenerating ? 'animate-spin' : ''}
        tooltipPosition="bottom"
      />
      {/* Divider between main actions and feedback */}
      <div
        className={cn(
          'mx-1 self-stretch border-r border-gray-300 dark:border-gray-700'
        )}
      />
      {/* Thumbs up feedback button */}
      <MessageActionButton
        icon={FiThumbsUp}
        label={t('useful')}
        activeLabel={t('rated')}
        onClick={() => onFeedback(true)}
        tooltipPosition="bottom"
      />
      {/* Thumbs down feedback button */}
      <MessageActionButton
        icon={FiThumbsDown}
        label={t('notUseful')}
        activeLabel={t('rated')}
        onClick={() => onFeedback(false)}
        tooltipPosition="bottom"
      />
    </MessageActionsContainer>
  );
};
