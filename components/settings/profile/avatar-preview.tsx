'use client';

import { UserAvatar } from '@components/ui';
import { cn } from '@lib/utils';
import { Loader2 } from 'lucide-react';

import { useTranslations } from 'next-intl';

// Avatar preview component interface
interface AvatarPreviewProps {
  avatarUrl?: string | null;
  userName: string;
  isUploading?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarPreview({
  avatarUrl,
  userName,
  isUploading = false,
  progress = 0,
  size = 'md',
}: AvatarPreviewProps) {
  const t = useTranslations('pages.settings.avatarModal');

  const sizeClasses = {
    sm: 'h-12 w-12 text-sm',
    md: 'h-20 w-20 text-xl',
    lg: 'h-32 w-32 text-3xl',
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <UserAvatar
          avatarUrl={avatarUrl}
          userName={userName}
          size={size}
          className={cn(
            'ring-2',
            'ring-stone-200 dark:ring-stone-700',
            isUploading && 'opacity-75'
          )}
          alt={t('currentAvatar')}
        />

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <div className="text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-white" />
              <div className="mt-1 text-xs text-white">{progress}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <h3
          className={cn(
            'font-serif text-sm font-medium',
            'text-stone-900 dark:text-stone-100'
          )}
        >
          {userName}
        </h3>
        <p
          className={cn(
            'font-serif text-xs',
            'text-stone-600 dark:text-stone-400'
          )}
        >
          {t('supportedFormats')}
        </p>
      </div>
    </div>
  );
}
