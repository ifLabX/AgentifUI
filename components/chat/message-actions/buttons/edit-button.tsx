'use client';

import { MessageActionButton } from '@components/ui/message-action-button';
import { FiEdit2 } from 'react-icons/fi';

import React from 'react';

import { useEditAction } from '../hooks/use-edit-action';

interface EditButtonProps {
  onEdit: () => void;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip size
  showTooltipArrow?: boolean; // whether to show tooltip arrow
  className?: string;
}

/**
 * Edit button component
 *
 * A button component encapsulating edit functionality.
 * When clicked, it triggers the edit callback.
 */
export const EditButton: React.FC<EditButtonProps> = ({
  onEdit,
  tooltipPosition = 'bottom',
  tooltipSize = 'sm',
  showTooltipArrow = false,
  className,
}) => {
  const { handleEdit } = useEditAction(onEdit);

  return (
    <MessageActionButton
      icon={FiEdit2}
      label="编辑"
      onClick={handleEdit}
      tooltipPosition={tooltipPosition}
      tooltipSize={tooltipSize}
      showTooltipArrow={showTooltipArrow}
      className={className}
    />
  );
};
