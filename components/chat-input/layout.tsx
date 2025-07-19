'use client';

import { cn } from '@lib/utils';

// Button area component - handle button layout
interface ChatButtonAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatButtonArea = ({
  children,
  className,
}: ChatButtonAreaProps) => {
  return (
    <div
      className={cn('flex items-center justify-between px-0 py-2', className)}
    >
      {children}
    </div>
  );
};

// Text area component
interface ChatTextAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatTextArea = ({ children, className }: ChatTextAreaProps) => {
  return <div className={cn('px-4 pt-4 pb-1', className)}>{children}</div>;
};
