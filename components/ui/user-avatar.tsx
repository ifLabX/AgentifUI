'use client';

import { cn } from '@lib/utils';
import { getAvatarBgColor, getInitials } from '@lib/utils/avatar';

import React, { useState } from 'react';

// --- BEGIN COMMENT ---
// 统一的用户头像组件接口
// 支持图片头像和自动生成头像，自动处理加载失败的情况
// --- END COMMENT ---
interface UserAvatarProps {
  // 用户信息
  avatarUrl?: string | null;
  userName: string;

  // 样式选项
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;

  // 其他属性
  alt?: string;

  // 可选的点击事件
  onClick?: () => void;
}

// 尺寸预设
const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function UserAvatar({
  avatarUrl,
  userName,
  size = 'md',
  className,
  alt,
  onClick,
}: UserAvatarProps) {
  // 使用状态来跟踪图片是否加载失败
  const [imageLoadError, setImageLoadError] = useState(false);

  // 处理图片加载失败
  const handleImageError = () => {
    setImageLoadError(true);
  };

  // 重置错误状态当avatarUrl改变时
  React.useEffect(() => {
    setImageLoadError(false);
  }, [avatarUrl]);

  // 确定是否应该显示图片
  const shouldShowImage = avatarUrl && !imageLoadError;

  // 生成alt文本
  const altText = alt || `${userName}的头像`;

  // 基础CSS类
  const baseClasses = cn(
    'rounded-full object-cover transition-all duration-200',
    sizeClasses[size],
    onClick && 'cursor-pointer',
    className
  );

  if (shouldShowImage) {
    return (
      <img
        src={avatarUrl}
        alt={altText}
        className={baseClasses}
        onClick={onClick}
        onError={handleImageError}
      />
    );
  }

  // 显示自动生成的头像
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-white',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: getAvatarBgColor(userName),
      }}
      onClick={onClick}
    >
      {getInitials(userName)}
    </div>
  );
}
