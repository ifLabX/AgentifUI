'use client';

import { UserMessageActions } from '@components/chat/message-actions';
import { useMobile, useMounted, useTheme } from '@lib/hooks';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { MessageAttachment } from '@lib/stores/chat-store';
import { cn } from '@lib/utils';

import React from 'react';

import { FileAttachmentDisplay } from './file-attachment-display';

interface UserMessageProps {
  content: string;
  attachments?: MessageAttachment[];
  id: string;
  className?: string;
  onCopy?: () => void;
  onEdit?: () => void;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  attachments = [],
  id,
  className,
  onEdit = () => console.log('Edit message', id),
}) => {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const isMounted = useMounted();
  const { currentAppId } = useCurrentApp();
  const hasAttachments = attachments && attachments.length > 0;

  if (!isMounted) {
    return null;
  }

  return (
    <div className="group mb-6 flex w-full justify-end" data-message-id={id}>
      <div className="flex w-full max-w-3xl flex-col items-end">
        {/* Attachment display area - right aligned */}
        {hasAttachments && (
          <FileAttachmentDisplay
            attachments={attachments.map(att => ({
              id: att.id,
              name: att.name,
              size: att.size,
              type: att.type,
              upload_file_id: att.upload_file_id,
              app_id: att.app_id || currentAppId || undefined, // Preserve app_id or use current app ID
            }))}
            appId={currentAppId || undefined} // Pass current app ID for file preview
            isDark={isDark}
            className={cn('mb-2 w-full')}
          />
        )}
        {/* Message bubble - modern design, stone color theme */}
        <div
          className={cn(
            'max-w-full rounded-2xl px-4 py-3 text-base leading-relaxed',
            'markdown-body assistant-message-content shadow-sm',
            isDark
              ? 'bg-stone-700/70 text-stone-100'
              : 'bg-stone-200/80 text-stone-800',
            'border',
            isDark ? 'border-stone-600/30' : 'border-stone-300/80',
            isMobile ? 'max-w-[85%]' : 'max-w-[75%]',
            className
          )}
        >
          {content}
        </div>

        {/* Message action buttons */}
        <UserMessageActions messageId={id} content={content} onEdit={onEdit} />
      </div>
    </div>
  );
};
