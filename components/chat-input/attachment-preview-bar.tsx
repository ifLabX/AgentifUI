'use client';

import { useFileTypes } from '@lib/hooks/use-file-types';
import { useAttachmentStore } from '@lib/stores/attachment-store';
import { cn } from '@lib/utils';

import React, { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import { AttachmentPreviewItem } from './attachment-preview-item';

/**
 * Attachment preview bar component properties
 */
interface AttachmentPreviewBarProps {
  /** Dark mode flag */
  isDark?: boolean;
  /** Callback function to notify parent component of height changes */
  onHeightChange: (height: number) => void;
  /** Retry upload callback */
  onRetryUpload: (id: string) => void;
}

/**
 * Attachment preview bar component
 * @description Displays uploaded files with preview and manages height animations
 *
 * @features
 * - Dynamic height calculation and animation
 * - File count limit warnings
 * - Responsive file preview grid
 * - Upload retry functionality
 */
export const AttachmentPreviewBar: React.FC<AttachmentPreviewBarProps> = ({
  isDark = false,
  onHeightChange,
  onRetryUpload,
}) => {
  const files = useAttachmentStore(state => state.files);
  const { uploadConfig } = useFileTypes();
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('components.chatInput.attachmentPreview');

  // Monitor file list changes or window size changes, dynamically calculate and notify height with animation styles
  useEffect(() => {
    let calculatedHeight = 0;
    const container = containerRef.current;

    const calculateAndApplyHeight = () => {
      if (container) {
        // First remove temporary height, calculate actual content height
        container.style.height = ''; // Clear old height
        calculatedHeight = files.length > 0 ? container.scrollHeight : 0;

        // Apply calculated height to style, trigger CSS transition
        container.style.height = `${calculatedHeight}px`;

        // Notify parent component of height change
        onHeightChange(calculatedHeight);
      }
    };

    // Use requestAnimationFrame to ensure height calculation after DOM update
    const rafId = requestAnimationFrame(calculateAndApplyHeight);

    // Use ResizeObserver to monitor container content size changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateAndApplyHeight);
    });
    if (container) {
      // Monitor inner flex container, not outer container with overflow
      const innerFlexContainer = container.querySelector(':scope > div');
      if (innerFlexContainer) {
        resizeObserver.observe(innerFlexContainer);
      }
    }

    // Cleanup function
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      // Clear height style for correct calculation next time
      if (container) {
        container.style.height = '';
      }
    };
  }, [files.length, onHeightChange]); // Depends on file count changes

  // If no files, return empty container
  if (files.length === 0) {
    return (
      <div
        ref={containerRef}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: 0 }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        isDark ? 'border-gray-700' : 'border-gray-200', // This class no longer has effect but kept for potential future use
        'overflow-hidden',
        'transition-[height] duration-300 ease-in-out'
      )}
      style={{ height: 0 }}
    >
      {/* Inner container for padding and flex layout, ResizeObserver monitors this element */}
      <div className="px-3 pt-3 pb-2">
        {/* If file count exceeds limit, show warning message */}
        {uploadConfig.enabled &&
          uploadConfig.maxFiles > 0 &&
          files.length > uploadConfig.maxFiles && (
            <div
              className={cn(
                'mb-2 rounded-lg px-3 py-2 font-serif text-sm',
                isDark
                  ? 'border border-orange-500/30 bg-orange-900/30 text-orange-300'
                  : 'border border-orange-300 bg-orange-100 text-orange-700'
              )}
            >
              {t('fileLimitExceeded', {
                current: files.length,
                max: uploadConfig.maxFiles,
              })}
            </div>
          )}

        {/* File list container */}
        <div className="flex flex-wrap gap-2">
          {files.map(file => (
            <AttachmentPreviewItem
              key={file.id}
              attachment={file}
              isDark={isDark}
              onRetry={onRetryUpload}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
