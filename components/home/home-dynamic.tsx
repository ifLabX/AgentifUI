'use client';

import { AdminButton } from '@components/admin/admin-button';
import ComponentRenderer from '@components/admin/content/component-renderer';
import { LanguageSwitcher } from '@components/ui/language-switcher';
import { PageLoader } from '@components/ui/page-loader';
import { useDynamicTranslations } from '@lib/hooks/use-dynamic-translations';
import type { PageContent } from '@lib/types/about-page-components';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

import { useEffect, useState } from 'react';

/**
 * Dynamic Home Page Component
 *
 * Uses the dynamic component system to render the home page
 * Supports both legacy static format and new dynamic sections format
 */
export function HomeDynamic() {
  const [mounted, setMounted] = useState(false);
  const { t: dynamicT, isLoading } = useDynamicTranslations({
    sections: ['pages.home'],
  });

  // Ensure client-side rendering consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get homepage data and convert to dynamic format if needed
  const [pageContent, setPageContent] = useState<PageContent | null>(null);

  useEffect(() => {
    // Convert translation data to PageContent
    const createPageContent = () => {
      try {
        // Directly get sections array from the translation data
        const sections = dynamicT('sections', 'pages.home');

        if (sections && Array.isArray(sections) && sections.length > 0) {
          // Direct dynamic format
          const content: PageContent = {
            sections: sections,
            metadata: {
              version: '1.0.0',
              lastModified: new Date().toISOString(),
              author: 'system',
            },
          };
          setPageContent(content);
          console.log(
            'HomeDynamic: Page content created with',
            sections.length,
            'sections'
          );
        } else {
          console.error('HomeDynamic: No valid dynamic home sections found');
        }
      } catch (error) {
        console.error('HomeDynamic: Failed to create page content:', error);
      }
    };

    if (mounted && !isLoading) {
      createPageContent();
    }
  }, [mounted, isLoading, dynamicT]);

  // Homepage-style colors using Tailwind classes
  const colors = {
    bgClass: 'bg-stone-100 dark:bg-stone-900',
    textColor: 'text-stone-700 dark:text-gray-300',
  };

  // Show loading state while mounting or dynamic translations load
  if (!mounted || isLoading || !pageContent) {
    return <PageLoader />;
  }

  /**
   * Render page sections using ComponentRenderer
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
          <p>No content to display</p>
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
    <AnimatePresence>
      <div
        className={`relative w-full px-4 py-12 sm:px-6 lg:px-8 ${colors.bgClass}`}
      >
        {/* Top-right toolbar: Admin button (left) + Language switcher (right) */}
        {/* Uses absolute positioning with responsive design, hidden on mobile to avoid layout issues */}
        <div className="fixed top-4 right-4 z-50 hidden flex-col items-end gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3 lg:top-6 lg:right-6">
          <AdminButton />
          <LanguageSwitcher variant="floating" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl"
        >
          {renderSections()}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
