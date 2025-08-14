'use client';

import { ResetPasswordForm } from '@components/auth/reset-password-form';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';

import { Suspense } from 'react';

import { useTranslations } from 'next-intl';

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  const t = useTranslations('loading');

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-stone-100 px-4 py-12 font-serif sm:px-6 lg:px-8 dark:bg-stone-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Suspense
          fallback={
            <div
              className={cn(
                'w-full max-w-md space-y-6 rounded-xl border p-6 font-serif shadow-lg transition-all sm:space-y-8 sm:p-8',
                'border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900'
              )}
            >
              <div className="text-center">
                <div
                  className={cn(
                    'mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full',
                    'bg-stone-100 dark:bg-stone-800'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full',
                      'bg-stone-300 dark:bg-stone-600'
                    )}
                  ></div>
                </div>
                <h2 className="bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text font-serif text-3xl font-bold text-transparent">
                  {t('default')}
                </h2>
              </div>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </motion.div>
    </main>
  );
}
