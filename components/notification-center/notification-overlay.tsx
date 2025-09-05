'use client';

import { cn } from '@lib/utils';
import { X } from 'lucide-react';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import { useMobile } from '../../lib/hooks';
import { useSidebarStore } from '../../lib/stores/sidebar-store';
import { Button } from '../ui/button';
import { NotificationPage } from './notification-page';

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function NotificationOverlay({
  isOpen,
  onClose,
  className,
}: NotificationOverlayProps) {
  const t = useTranslations('components.notificationCenter');
  const { isExpanded } = useSidebarStore();
  const isMobile = useMobile();

  // Handle ESC key to close overlay
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent background scrolling when overlay is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate left margin to avoid covering sidebar
  const getLeftMargin = () => {
    if (isMobile) return 'left-0';
    return isExpanded ? 'md:left-64' : 'md:left-16';
  };

  return (
    <>
      {/* Fixed close button - always visible in top right */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="fixed top-4 right-4 z-60 h-10 w-10 rounded-full p-0"
        aria-label={t('close')}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Main overlay content - no background blur for full overlay */}
      <div
        className={cn(
          'bg-background fixed inset-0 z-50',
          getLeftMargin(),
          'transition-[left] duration-150 ease-in-out',
          'animate-in slide-in-from-right-4 duration-300',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-overlay-title"
        onClick={e => {
          // Only close if clicking directly on the overlay background, not on content
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Notification content - no header needed */}
        <div className="h-full overflow-hidden pt-12">
          <NotificationPage />
        </div>
      </div>
    </>
  );
}

export type { NotificationOverlayProps };
