'use client';

import { Profile as ExtendedProfile, useProfile } from '@lib/hooks/use-profile';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { Profile as DatabaseProfile } from '@lib/types/database';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';

import { useTranslations } from 'next-intl';

import { ProfileForm } from './profile-form';

// Profile settings component
// Contains all data loading, state management, and UI logic
export function ProfileSettings() {
  const { colors } = useSettingsColors();
  const t = useTranslations('pages.settings.profileSettings');
  const tCommon = useTranslations('common.ui');

  // Use useProfile hook to get the complete user profile containing organization information
  const { profile, isLoading, error } = useProfile();

  // Handle profile update success
  const handleProfileUpdateSuccess = () => {
    // Refresh page data
    window.location.reload();
  };

  // Handle error cases
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

        <div
          className={cn(
            'mb-6 rounded-lg p-6',
            'border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
          )}
        >
          <h2
            className={cn(
              'mb-4 font-serif text-lg font-medium',
              'text-red-800 dark:text-red-200'
            )}
          >
            {t('loadProfileError')}
          </h2>
          <p className="mb-4 font-serif">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              'rounded-md px-4 py-2 font-serif transition-colors',
              'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800/50 dark:text-red-200 dark:hover:bg-red-700/50'
            )}
          >
            {tCommon('retry')}
          </button>
        </div>
      </motion.div>
    );
  }

  // Loading state - use skeleton screen
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

        <div className="space-y-6">
          {/* User avatar and basic information skeleton screen - compact layout */}
          <div
            className={cn(
              'rounded-lg border p-4',
              colors.borderColor.tailwind,
              colors.cardBackground.tailwind
            )}
          >
            <div className="flex items-center space-x-4">
              {/* Avatar skeleton screen - shrink to 16x16 */}
              <div
                className={cn(
                  'h-16 w-16 rounded-full',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse'
                )}
              ></div>
              {/* Basic information skeleton screen */}
              <div className="flex-1 space-y-2">
                <div
                  className={cn(
                    'h-5 w-32',
                    colors.skeletonBackground.tailwind,
                    'animate-pulse rounded-md'
                  )}
                ></div>
                <div
                  className={cn(
                    'h-4 w-48',
                    colors.skeletonBackground.tailwind,
                    'animate-pulse rounded-md'
                  )}
                ></div>
              </div>
            </div>
          </div>

          {/* Account information skeleton screen - compact grid layout */}
          <div
            className={cn(
              'rounded-lg border p-4',
              colors.borderColor.tailwind,
              colors.cardBackground.tailwind
            )}
          >
            <div
              className={cn(
                'mb-3 h-4 w-20',
                colors.skeletonBackground.tailwind,
                'animate-pulse rounded-md'
              )}
            ></div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded',
                      colors.skeletonBackground.tailwind,
                      'animate-pulse'
                    )}
                  ></div>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        'h-3 w-16',
                        colors.skeletonBackground.tailwind,
                        'animate-pulse rounded-md'
                      )}
                    ></div>
                    <div
                      className={cn(
                        'h-4 w-24',
                        colors.skeletonBackground.tailwind,
                        'animate-pulse rounded-md'
                      )}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit form skeleton screen - simplified layout */}
          <div
            className={cn(
              'rounded-lg border p-4',
              colors.borderColor.tailwind,
              colors.cardBackground.tailwind
            )}
          >
            <div className="mb-4 flex items-center">
              <div
                className={cn(
                  'mr-2 h-4 w-4',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse rounded'
                )}
              ></div>
              <div
                className={cn(
                  'h-4 w-20',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse rounded-md'
                )}
              ></div>
            </div>

            <div className="space-y-4">
              {/* Form field skeleton screen */}
              {[1, 2].map(item => (
                <div key={item} className="space-y-1">
                  <div
                    className={cn(
                      'h-4 w-16',
                      colors.skeletonBackground.tailwind,
                      'animate-pulse rounded-md'
                    )}
                  ></div>
                  <div
                    className={cn(
                      'h-12 w-full rounded-lg border',
                      colors.borderColor.tailwind,
                      colors.skeletonBackground.tailwind,
                      'animate-pulse'
                    )}
                  ></div>
                </div>
              ))}

              {/* Submit button skeleton screen */}
              <div
                className={cn(
                  'h-10 w-full rounded-lg',
                  colors.skeletonBackground.tailwind,
                  'animate-pulse'
                )}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

      {profile && (
        <ProfileForm
          profile={
            profile as DatabaseProfile &
              ExtendedProfile & { auth_last_sign_in_at?: string }
          }
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
    </motion.div>
  );
}
