'use client';

import { cn } from '@lib/utils';
import { getAvatarBgColor, getInitials } from '@lib/utils/avatar';

import React, { useState } from 'react';

// Unified user avatar component interface
// Supports image avatar and automatically generated avatar, automatically handling loading failure
interface UserAvatarProps {
  // User information
  avatarUrl?: string | null;
  userName: string;

  // Style options
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;

  // Other attributes
  alt?: string;

  // Optional click event
  onClick?: () => void;
}

// Size preset
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
  // Use state to track whether the image fails to load
  const [imageLoadError, setImageLoadError] = useState(false);

  // Handle image loading failure
  const handleImageError = () => {
    setImageLoadError(true);
  };

  // Reset error status when avatarUrl changes
  React.useEffect(() => {
    setImageLoadError(false);
  }, [avatarUrl]);

  // Determine whether the image should be displayed
  const shouldShowImage = avatarUrl && !imageLoadError;

  // Generate alt text
  const altText = alt || `${userName}的头像`;

  // Base CSS class
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

  // Display automatically generated avatar
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
