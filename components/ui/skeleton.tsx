'use client';

import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks/use-theme';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

// 基础骨架屏组件
export function Skeleton({ className, width, height }: SkeletonProps) {
  const { isDark } = useTheme()
  
  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div 
      className={cn(
        "animate-pulse rounded-md",
        isDark ? "bg-stone-700/50" : "bg-gray-200",
        className
      )}
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

// 卡片骨架屏
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg p-4", className)}>
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// 表格骨架屏
export function TableSkeleton({ rows = 3, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex space-x-4 pb-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4 py-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ))}
    </div>
  );
}

// API配置页面骨架屏
export function ApiConfigSkeleton() {
  const { isDark } = useTheme()
  
  return (
    <div className="space-y-8">
      {/* 标题区域 */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
      </div>
      
      {/* API密钥管理提示区域 */}
      <div className={cn(
        "p-4 rounded-lg border",
        isDark ? "bg-blue-900/20 border-blue-800/30" : "bg-blue-50/80 border-blue-100"
      )}>
        <Skeleton className={cn(
          "h-6 w-1/4 mb-2",
          isDark ? "bg-blue-700/30" : "bg-blue-200/50"
        )} />
        <Skeleton className={cn(
          "h-4 w-full mb-1",
          isDark ? "bg-blue-700/30" : "bg-blue-200/50"
        )} />
        <Skeleton className={cn(
          "h-4 w-full mb-1",
          isDark ? "bg-blue-700/30" : "bg-blue-200/50"
        )} />
        <Skeleton className={cn(
          "h-4 w-3/4",
          isDark ? "bg-blue-700/30" : "bg-blue-200/50"
        )} />
      </div>
      
      {/* 选项卡区域 */}
      <div>
        <div className={cn(
          "flex pb-2 mb-6 border-b",
          isDark ? "border-stone-700/50" : "border-stone-200/50"
        )}>
          <Skeleton className="h-10 w-24 mr-4" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        {/* 应用实例列表区域 */}
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* 表格 - 使用卡片包裹 */}
          <div className={cn(
            "rounded-lg overflow-hidden border",
            isDark ? "bg-stone-800 border-stone-700/30" : "bg-white border-stone-300/50"
          )}>
            {/* 表头 */}
            <div className={cn(
              "flex p-4",
              isDark ? "bg-stone-800/60" : "bg-stone-100/80"
            )}>
              <Skeleton className="h-6 w-1/5 mr-4" />
              <Skeleton className="h-6 w-1/5 mr-4" />
              <Skeleton className="h-6 w-1/5 mr-4" />
              <Skeleton className="h-6 w-1/5 mr-4" />
              <Skeleton className="h-6 w-1/5" />
            </div>
            
            {/* 表行 */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={cn(
                "flex p-4 border-t",
                isDark ? "border-stone-700/20" : "border-stone-200/50"
              )}>
                <Skeleton className="h-6 w-1/5 mr-4" />
                <Skeleton className="h-6 w-1/5 mr-4" />
                <Skeleton className="h-6 w-1/5 mr-4" />
                <Skeleton className="h-6 w-1/5 mr-4" />
                <Skeleton className="h-6 w-1/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
