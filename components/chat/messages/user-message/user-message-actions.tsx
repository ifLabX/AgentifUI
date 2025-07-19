'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { MessageActionsContainer } from '@components/ui/message-actions-container';
import { FiCheck, FiCopy, FiEdit2 } from 'react-icons/fi';

import React from 'react';

import { useTranslations } from 'next-intl';

interface UserMessageActionsProps {
  messageId: string;
  onCopy: () => void;
  onEdit: () => void;
  className?: string;
}

/**
 * UserMessageActions component
 *
 * Renders action buttons (copy and edit) for user messages.
 * Uses MessageActionButton for consistent UI and tooltip behavior.
 */
export const UserMessageActions: React.FC<UserMessageActionsProps> = ({
  onCopy,
  onEdit,
  className,
}) => {
  const t = useTranslations('components.chat.messageActions');

  return (
    <MessageActionsContainer align="right" className={className}>
      {/* Copy button: shows check icon and "Copied" label when active */}
      <MessageActionButton
        icon={FiCopy}
        activeIcon={FiCheck}
        label={t('copy')}
        activeLabel={t('copied')}
        onClick={onCopy}
        tooltipPosition="bottom"
      />
      {/* Edit button: allows editing the user message */}
      <MessageActionButton
        icon={FiEdit2}
        label={t('edit')}
        onClick={onEdit}
        tooltipPosition="bottom"
      />
    </MessageActionsContainer>
  );
};
