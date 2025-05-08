'use client';

import React from 'react';
import { cn } from '@lib/utils';

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[50vh] w-full",
      className
    )}>
      <div className="relative flex flex-col items-center">
        {/* 加载动画 */}
        <div className="w-16 h-16 mb-4">
          <svg 
            className="animate-spin w-full h-full text-primary" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        
        {/* 加载文本 */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            正在加载
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            请稍候，正在获取数据...
          </p>
        </div>
      </div>
    </div>
  );
}

// 骨架屏组件
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// 资料页面骨架屏
export function ProfileSkeleton() {
  return (
    <div className="max-w-md w-full mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-1/3 mb-6" />
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <Skeleton className="h-10 w-full mt-6" />
      </div>
    </div>
  );
}

// 聊天页面骨架屏
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
