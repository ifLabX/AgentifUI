'use client';

import { PageContent } from '@lib/types/about-page-components';
import { cn } from '@lib/utils';
import type { HomeTranslationData } from '@lib/utils/data-migration';
import {
  isHomeDynamicFormat,
  migrateHomeTranslationData,
} from '@lib/utils/data-migration';
import { AnimatePresence, motion } from 'framer-motion';

import React from 'react';

import ComponentRenderer from './component-renderer';

interface HomePreviewDynamicProps {
  /**
   * Translation data for the home page
   * Can be either legacy or dynamic format
   */
  translation: HomeTranslationData;
  /**
   * Preview device type for responsive preview
   */
  previewDevice: 'desktop' | 'tablet' | 'mobile';
}

/**
 * Home Page Preview Component (Dynamic)
 *
 * Displays a preview of the home page using the dynamic component system
 * Reuses the same ComponentRenderer as AboutPreview for consistency
 */
export function HomePreviewDynamic({
  translation,
  previewDevice,
}: HomePreviewDynamicProps) {
  // Ensure translation is in dynamic format
  const dynamicTranslation = React.useMemo(() => {
    if (!isHomeDynamicFormat(translation)) {
      return migrateHomeTranslationData(translation);
    }
    return translation;
  }, [translation]);

  // Create page content from translation
  const pageContent: PageContent = React.useMemo(() => {
    return {
      sections: dynamicTranslation.sections || [],
      metadata: dynamicTranslation.metadata || {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        author: 'preview',
      },
    };
  }, [dynamicTranslation]);

  // Homepage-style colors using Tailwind classes that respond to dark mode
  const colors = {
    bgClass: 'bg-stone-100 dark:bg-stone-900',
    textColor: 'text-stone-700 dark:text-gray-300',
  };

  /**
   * Get device-specific container styles with homepage styling
   */
  const getDeviceStyles = () => {
    switch (previewDevice) {
      case 'mobile':
        return {
          container: 'mx-auto bg-black rounded-[2rem] p-2 shadow-2xl',
          screen:
            'w-[375px] h-[667px] bg-white rounded-[1.75rem] overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'relative w-full px-4 py-12 sm:px-6 lg:px-8',
        };
      case 'tablet':
        return {
          container: 'mx-auto bg-black rounded-xl p-3 shadow-2xl mt-50',
          screen:
            'w-[768px] h-[1024px] bg-white rounded-lg overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'relative w-full px-4 py-12 sm:px-6 lg:px-8',
        };
      case 'desktop':
      default:
        return {
          container: 'w-full h-full',
          screen: 'w-full h-full overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'relative w-full px-4 py-12 sm:px-6 lg:px-8',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  /**
   * Render page sections with homepage-style animations and layout
   */
  const renderSections = () => {
    if (!pageContent.sections || pageContent.sections.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            'flex h-64 items-center justify-center',
            colors.textColor
          )}
        >
          <p>No content to preview</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-5xl space-y-16"
      >
        {pageContent.sections.map((section, sectionIndex) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1 + sectionIndex * 0.1,
            }}
            className="w-full"
          >
            <div
              className={cn(
                'gap-8',
                section.layout === 'single-column' && 'space-y-8',
                section.layout === 'two-column' &&
                  'grid grid-cols-1 md:grid-cols-2',
                section.layout === 'three-column' &&
                  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {section.columns.map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-8">
                  {column.map((component, componentIndex) => (
                    <motion.div
                      key={component.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.2 + sectionIndex * 0.1 + componentIndex * 0.05,
                      }}
                    >
                      <ComponentRenderer
                        component={component}
                        sectionCommonProps={section.commonProps}
                        previewDevice={previewDevice}
                      />
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </motion.div>
    );
  };

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        previewDevice !== 'desktop' && 'p-4'
      )}
    >
      <div className={deviceStyles.container}>
        <div className={cn(deviceStyles.screen, colors.bgClass)}>
          <div className={deviceStyles.content}>
            <AnimatePresence>
              <main className={deviceStyles.mainClass}>{renderSections()}</main>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
