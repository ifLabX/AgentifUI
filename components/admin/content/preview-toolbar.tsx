'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Fullscreen, Monitor, Smartphone, Tablet, X } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface PreviewToolbarProps {
  activeTab: 'about' | 'home';
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
  showPreview: boolean;
  onPreviewToggle: () => void;
  onFullscreenPreview: () => void;
}

export function PreviewToolbar({
  activeTab,
  previewDevice,
  onDeviceChange,
  showPreview,
  onPreviewToggle,
  onFullscreenPreview,
}: PreviewToolbarProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.content.previewToolbar');

  const deviceIcons = [
    { name: 'desktop' as const, icon: Monitor },
    { name: 'tablet' as const, icon: Tablet },
    { name: 'mobile' as const, icon: Smartphone },
  ];

  return (
    <div
      className={cn(
        'flex h-14 flex-shrink-0 items-center justify-between border-b px-4',
        isDark ? 'border-stone-600 bg-stone-800' : 'border-stone-200 bg-white'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {activeTab === 'about' ? t('aboutPreview') : t('homePreview')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {deviceIcons.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onDeviceChange(name)}
            className={cn(
              'rounded-md p-2 transition-colors',
              previewDevice === name
                ? isDark
                  ? 'bg-stone-600 text-stone-100'
                  : 'bg-stone-200 text-stone-900'
                : isDark
                  ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onFullscreenPreview}
          className={cn(
            'rounded-md p-2 transition-colors',
            isDark
              ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
              : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
          )}
        >
          <Fullscreen className="h-5 w-5" />
        </button>

        <button
          onClick={onPreviewToggle}
          className={cn(
            'rounded-md p-2 transition-colors',
            isDark
              ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
              : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
