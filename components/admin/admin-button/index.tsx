'use client';

import { useAdminAuth } from '@lib/hooks/use-admin-auth';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

/**
 * Admin Button
 * Features:
 * - Only show to admin users
 * - Use the same style as the language switcher
 */
export function AdminButton() {
  const { isAdmin } = useAdminAuth(false);
  const t = useTranslations('pages.admin');

  if (!isAdmin) {
    return null;
  }

  const buttonColors = 'bg-stone-200/50 hover:bg-stone-300/80 text-stone-600 border-stone-400/30 dark:bg-stone-800/50 dark:hover:bg-stone-600/60 dark:text-gray-200 dark:border-stone-600/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Link
        href="/admin"
        className={cn(
          'flex items-center gap-2 rounded-lg border px-4 py-2 backdrop-blur-sm',
          'h-10 cursor-pointer font-serif transition-colors duration-200',
          'no-underline shadow-sm hover:shadow-md',
          buttonColors
        )}
      >
        <Wrench className="h-4 w-4" />
        <span className="hidden text-sm font-medium sm:inline">
          {t('title')}
        </span>
      </Link>
    </motion.div>
  );
}
