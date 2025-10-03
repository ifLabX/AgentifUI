'use client';

import { DynamicAboutRenderer } from '@components/about/dynamic-about-renderer';
import { PageLoader } from '@components/ui/page-loader';
import { useDynamicTranslations } from '@lib/hooks/use-dynamic-translations';
import { useMobile } from '@lib/hooks';
import { createClient } from '@lib/supabase/client';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import type { AboutTranslationData } from '@lib/types/about-page-components';
import { cn } from '@lib/utils';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DynamicPage() {
  const params = useParams();
  const router = useRouter();
  const { isExpanded } = useSidebarStore();
  const isMobile = useMobile();

  // Handle array slug from catch-all route
  const slugArray = Array.isArray(params.slug) ? params.slug : [params.slug];
  const slug = `/${slugArray.join('/')}`;

  const [pageExists, setPageExists] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Calculate left margin based on sidebar state
  const getLeftMargin = () => {
    if (isMobile) return 'ml-0';
    return isExpanded ? 'ml-64' : 'ml-16';
  };

  // Dynamic translation section key
  const sectionKey = `pages.dynamic.${slug.replace(/\//g, '_')}`;

  const { t: dynamicT, isLoading } = useDynamicTranslations({
    sections: [sectionKey],
  });

  // Check if page exists in database
  useEffect(() => {
    const checkPage = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('dynamic_pages')
          .select('slug, is_published')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          setPageExists(false);
          return;
        }

        // Check if published
        if (!data.is_published) {
          // Check if user is admin
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (profile?.role !== 'admin') {
              setPageExists(false);
              return;
            }
          } else {
            setPageExists(false);
            return;
          }
        }

        setPageExists(true);
      } catch (error) {
        console.error('Failed to check page:', error);
        setPageExists(false);
      }
    };

    checkPage();
  }, [slug]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show 404 if page doesn't exist
  if (pageExists === false) {
    notFound();
  }

  // Show loading state
  if (!mounted || isLoading || pageExists === null) {
    return <PageLoader />;
  }

  // Get translation data
  const translationData: AboutTranslationData = {
    sections: dynamicT('sections', sectionKey) || [],
    metadata: dynamicT('metadata', sectionKey) || {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      author: 'admin',
    },
  };

  // Handle button clicks
  const handleExploreClick = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Check login status failed:', error);
      router.push('/login');
    }
  };

  return (
    <div
      className={cn(
        'relative min-h-screen w-full bg-stone-100 px-4 py-12 dark:bg-stone-900 sm:px-6 lg:px-8',
        getLeftMargin(),
        'transition-[margin-left] duration-150 ease-in-out'
      )}
    >
      <main className="mx-auto max-w-5xl">
        <DynamicAboutRenderer
          translationData={translationData}
          onButtonClick={handleExploreClick}
        />
      </main>
    </div>
  );
}
