'use client';

import { Button } from '@components/ui/button';
import { PageLoader } from '@components/ui/page-loader';
import { useDynamicTranslations } from '@lib/hooks/use-dynamic-translations';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { HomeDynamic } from './home-dynamic';

export function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [useDynamicRender, setUseDynamicRender] = useState(false);
  const { t: dynamicT, isLoading } = useDynamicTranslations({
    sections: ['pages.home'],
  });

  // Ensure client-side rendering consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we should use dynamic rendering (if dynamic sections data is available)
  useEffect(() => {
    const checkForDynamicData = async () => {
      try {
        // Directly check for sections array in the translation data
        const sections = dynamicT('sections', 'pages.home');
        if (sections && Array.isArray(sections) && sections.length > 0) {
          console.log(
            'Dynamic home sections found:',
            sections.length,
            'sections'
          );
          setUseDynamicRender(true);
        } else {
          console.error(
            'No dynamic home sections found - please configure home page in admin/content'
          );
          setUseDynamicRender(false);
        }
      } catch (error) {
        console.error('Failed to load dynamic home sections:', error);
        setUseDynamicRender(false);
      }
    };

    if (mounted && !isLoading) {
      checkForDynamicData();
    }
  }, [mounted, isLoading, dynamicT]);

  // Show loading state while mounting or dynamic translations load
  if (!mounted || isLoading) {
    return <PageLoader />;
  }

  // If dynamic rendering is available and enabled, use it
  if (useDynamicRender) {
    return <HomeDynamic />;
  }

  // If no dynamic data is available, show error message
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-stone-900 dark:text-stone-100">
          Home Page Not Configured
        </h1>
        <p className="mb-6 text-stone-600 dark:text-stone-400">
          The home page content is not configured. Please configure it in the
          admin panel.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={() => router.push('/admin/content?tab=home')}
            className="bg-stone-800 text-gray-100 hover:bg-stone-700 dark:bg-stone-600 dark:hover:bg-stone-500"
          >
            Configure Home Page
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/about')}
            className="border-stone-400 text-stone-800 hover:bg-stone-200 dark:border-stone-500 dark:text-gray-200 dark:hover:bg-stone-600"
          >
            Go to About Page
          </Button>
        </div>
      </div>
    </div>
  );
}
