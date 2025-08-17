'use client';

import { Button } from '@components/ui/button';
import { PageLoader } from '@components/ui/page-loader';
import { useDynamicTranslations } from '@lib/hooks/use-dynamic-translations';
import { createClient } from '@lib/supabase/client';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  const staticT = useTranslations('pages.about');
  const { t: dynamicT, isLoading } = useDynamicTranslations({
    sections: ['pages.about'],
  });
  const [mounted, setMounted] = useState(false);

  // enhanced translation function that tries dynamic first, then static fallback
  const t = (key: string, params?: Record<string, string | number>) => {
    const dynamicValue = dynamicT(key, 'pages.about', params);
    return dynamicValue || staticT(key, params);
  };

  // ensure client-side rendering consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  // handle "start exploring" button click
  const handleExploreClick = async () => {
    try {
      // check if user is logged in
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // user is logged in, redirect to chat page
        router.push('/chat');
      } else {
        // user is not logged in, redirect to login page
        router.push('/login');
      }
    } catch (error) {
      console.error('check login status failed:', error);
      // if error, redirect to login page
      router.push('/login');
    }
  };

  // Show loading state while mounting or dynamic translations load
  if (!mounted || isLoading) {
    return <PageLoader />;
  }

  // Extract value cards data from translations (using static raw method for array data)
  const valueCards = staticT.raw('values.items') as Array<{
    title: string;
    description: string;
  }>;

  return (
    <main className="min-h-screen w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* title */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center sm:mb-8 lg:mb-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              'bg-gradient-to-r bg-clip-text py-2 leading-tight font-bold text-transparent',
              'mb-4 text-3xl sm:mb-6 sm:text-4xl md:text-5xl',
              'from-stone-700 to-stone-900 dark:from-stone-300 dark:to-stone-500'
            )}
          >
            {t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={cn(
              'mx-auto max-w-3xl font-light',
              'text-base sm:text-lg lg:text-xl',
              'text-stone-700 dark:text-gray-300'
            )}
          >
            {t('subtitle')}
          </motion.p>
        </motion.section>

        {/* mission */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 sm:mb-8 lg:mb-10"
        >
          <h2
            className={cn(
              'mb-4 font-bold sm:mb-6',
              'text-xl sm:text-2xl',
              'text-stone-800 dark:text-gray-100'
            )}
          >
            {t('mission.title')}
          </h2>
          <p
            className={cn(
              'text-sm leading-relaxed sm:text-base lg:text-lg',
              'text-stone-600 dark:text-gray-400'
            )}
          >
            {t('mission.description')}
          </p>
        </motion.section>

        {/* values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6 sm:mb-8 lg:mb-10"
        >
          <h2
            className={cn(
              'mb-4 font-bold sm:mb-6',
              'text-xl sm:text-2xl',
              'text-stone-800 dark:text-gray-100'
            )}
          >
            {t('values.title')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {valueCards.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={cn(
                  'rounded-xl border',
                  'p-4 sm:p-6',
                  'bg-stone-100 dark:bg-stone-700',
                  'shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
                  'border-stone-200 dark:border-stone-600'
                )}
              >
                <h3
                  className={cn(
                    'mb-2 font-semibold',
                    'text-base sm:text-lg',
                    'text-stone-700 dark:text-stone-300'
                  )}
                >
                  {value.title}
                </h3>
                <p
                  className={cn(
                    'text-sm leading-relaxed sm:text-base',
                    'text-stone-600 dark:text-gray-400'
                  )}
                >
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* join us */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-6 text-center sm:mb-8 lg:mb-10"
        >
          <Button
            size="lg"
            className={cn(
              'h-auto rounded-lg font-medium transition-all duration-200',
              'px-6 py-2 text-sm sm:px-8 sm:py-3 sm:text-base',
              'bg-stone-800 hover:bg-stone-700 text-gray-100 cursor-pointer hover:scale-105',
              'dark:bg-stone-600 dark:hover:bg-stone-500'
            )}
            onClick={handleExploreClick}
          >
            {t('buttonText')}
          </Button>
        </motion.section>

        {/* bottom info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={cn('text-center', 'text-xs sm:text-sm', 'text-stone-700 dark:text-gray-300')}
        >
          <p>
            {t('copyright.prefix', { year: new Date().getFullYear() })}
            <a
              href="https://github.com/ifLabX/AgentifUI"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:underline hover:opacity-80"
            >
              {t('copyright.linkText')}
            </a>
            {t('copyright.suffix')}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
