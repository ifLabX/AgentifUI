'use client';

import { UserMessageActions } from '@components/chat/message-actions';
import { useMobile, useMounted, useTheme } from '@lib/hooks';
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
  onCopy = () => console.log('Copy message', id),
  onEdit = () => console.log('Edit message', id),
}) => {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const isMounted = useMounted();
  const hasAttachments = attachments && attachments.length > 0;

  if (!isMounted) {
    return null;
  }

  return (
    <div className="group mb-6 flex w-full justify-end" data-message-id={id}>
      <div className="flex w-full max-w-3xl flex-col items-end">
        {/* 附件显示区域 - 直接右对齐 */}
        {hasAttachments && (
          <FileAttachmentDisplay
            attachments={attachments.map(att => ({
              id: att.id,
              name: att.name,
              size: att.size,
              type: att.type,
              upload_file_id: att.upload_file_id,
            }))}
            isDark={isDark}
            className={cn('mb-2 w-full')}
          />
        )}
        {/* 消息气泡 - 现代化设计，石色主题 */}
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

        {/* 消息操作按钮 */}
        <UserMessageActions messageId={id} content={content} onEdit={onEdit} />
      </div>
    </div>
  );
};
