'use client';

import { cn } from '@lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

// 基础骨架屏组件
export function Skeleton({ className, width, height }: SkeletonProps) {
  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div 
      className={cn("bg-gray-200 animate-pulse rounded-md", className)}
      style={style}
    />
  );
}

// 文本输入框骨架屏
export function InputSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// 按钮骨架屏
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-full", className)} />;
}

// 头像骨架屏
export function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return <Skeleton className="rounded-full" width={size} height={size} />;
}

// 标题骨架屏
export function TitleSkeleton({ width = "1/3" }: { width?: string }) {
  return <Skeleton className={`h-8 w-${width} mb-6`} />;
}

// 资料表单骨架屏
export function ProfileFormSkeleton() {
  return (
    <div className="max-w-md w-full mx-auto p-4 space-y-6">
      <TitleSkeleton />
      <div className="space-y-4">
        <InputSkeleton />
        <InputSkeleton />
        <ButtonSkeleton className="mt-6" />
      </div>
    </div>
  );
}

// 聊天消息骨架屏
export function ChatMessageSkeleton() {
  return (
    <div className="flex items-start space-x-3 mb-4">
      <AvatarSkeleton />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

// 聊天列表骨架屏
export function ChatListSkeleton({ messageCount = 3 }: { messageCount?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: messageCount }).map((_, index) => (
        <ChatMessageSkeleton key={index} />
      ))}
    </div>
  );
}
