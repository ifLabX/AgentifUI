'use client';

import { DynamicAboutRenderer } from '@components/about/dynamic-about-renderer';
import { AdminButton } from '@components/admin/admin-button';
import { LanguageSwitcher } from '@components/ui/language-switcher';
import { PageLoader } from '@components/ui/page-loader';
import { useDynamicTranslations } from '@lib/hooks/use-dynamic-translations';
import { createClient } from '@lib/supabase/client';
import type { AboutTranslationData } from '@lib/types/about-page-components';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DynamicPage() {
  const params = useParams();
  const router = useRouter();

  // Handle array slug from catch-all route
  const slugArray = Array.isArray(params.slug) ? params.slug : [params.slug];
  const slug = `/${slugArray.join('/')}`;

  const [pageExists, setPageExists] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

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
    <div className="relative min-h-screen w-full bg-stone-100 px-4 py-12 dark:bg-stone-900 sm:px-6 lg:px-8">
      {/* Top-right toolbar */}
      <div className="fixed top-4 right-4 z-50 hidden flex-col items-end gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3 lg:top-6 lg:right-6">
        <AdminButton />
        <LanguageSwitcher variant="floating" />
      </div>

      <main className="mx-auto max-w-5xl">
        <DynamicAboutRenderer
          translationData={translationData}
          onButtonClick={handleExploreClick}
        />
      </main>
    </div>
  );
}
