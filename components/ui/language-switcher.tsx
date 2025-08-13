'use client';

import {
  SUPPORTED_LANGUAGES,
  SupportedLocale,
  getLanguageInfo,
  setLanguageCookie,
} from '@lib/config/language-config';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';

// Modern language switcher component
// Supports three variants: floating (homepage), navbar (navigation bar), settings (settings page)
// Uses a real dropdown, reference the hover effect of the sidebar button
// All hard-coded text is internationalized
interface LanguageSwitcherProps {
  variant?: 'floating' | 'navbar' | 'settings';
}

export function LanguageSwitcher({
  variant = 'floating',
}: LanguageSwitcherProps) {
  const currentLocale = useLocale() as SupportedLocale;
  const t = useTranslations('pages.settings.languageSettings');
  const [isOpen, setIsOpen] = useState(false);

  // Actual language switching logic: set Cookie and refresh page
  const handleLanguageChange = async (locale: SupportedLocale) => {
    // Set Cookie
    setLanguageCookie(locale);

    // Close dropdown menu
    setIsOpen(false);

    // Refresh page to apply new language
    window.location.reload();
  };

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-language-switcher]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Button styles: reference the hover effect of the sidebar button
  const buttonColors = 'bg-stone-200/50 hover:bg-stone-300/80 text-stone-600 border-stone-400/30 dark:bg-stone-800/50 dark:hover:bg-stone-600/60 dark:text-gray-200 dark:border-stone-600/30';

  // Dropdown menu styles
  const dropdownColors = 'bg-white/95 border-stone-400/30 text-stone-600 dark:bg-stone-900/95 dark:border-stone-600/30 dark:text-gray-200';

  // Selected indicator colors - use the primary color of the stone style
  const indicatorColors = 'bg-stone-700 dark:bg-stone-300';

  // Get current language information
  const currentLanguageInfo = getLanguageInfo(currentLocale);

  // settings variant: used for settings page, similar to theme-card style
  if (variant === 'settings') {
    return (
      <div className="relative" data-language-switcher>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md',
            isOpen
              ? 'border-primary ring-primary/20 ring-2'
              : 'border-stone-200 dark:border-stone-700'
          )}
        >
          {/* Language preview area */}
          <div
            className={cn(
              'mb-4 flex h-24 items-center justify-center rounded-md bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'font-serif text-lg font-medium text-gray-900 dark:text-gray-100'
                )}
              >
                {currentLanguageInfo.nativeName}
              </span>
            </div>
          </div>

          {/* Language name */}
          <p
            className={cn(
              'text-center font-serif text-sm font-medium',
              isOpen
                ? 'text-primary'
                : 'text-stone-900 dark:text-stone-200'
            )}
          >
            {t('currentLanguage')}
          </p>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute top-full right-0 left-0 z-50 mt-2 rounded-lg border backdrop-blur-sm',
                'shadow-lg',
                dropdownColors
              )}
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([locale, info]) => (
                <button
                  key={locale}
                  onClick={() =>
                    handleLanguageChange(locale as SupportedLocale)
                  }
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left',
                    'hover:bg-stone-100/50 dark:hover:bg-stone-700/50',
                    'font-serif transition-colors duration-150',
                    'first:rounded-t-lg last:rounded-b-lg',
                    currentLocale === locale &&
                      'bg-stone-100/70 dark:bg-stone-700/70'
                  )}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{info.nativeName}</div>
                    <div
                      className={cn(
                        'text-xs text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {info.name}
                    </div>
                  </div>
                  {currentLocale === locale && (
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        indicatorColors
                      )}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // floating variant: used for homepage, with animation effect
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="relative"
        data-language-switcher
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 backdrop-blur-sm',
            'h-10 cursor-pointer font-serif transition-colors duration-200',
            'shadow-sm hover:shadow-md',
            buttonColors
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">
            {currentLanguageInfo.nativeName}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute top-full right-0 z-50 mt-2 w-36 rounded-lg border backdrop-blur-sm',
                'shadow-lg',
                dropdownColors
              )}
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([locale, info]) => (
                <button
                  key={locale}
                  onClick={() =>
                    handleLanguageChange(locale as SupportedLocale)
                  }
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left',
                    'hover:bg-stone-100/50 dark:hover:bg-stone-700/50',
                    'font-serif transition-colors duration-150',
                    'first:rounded-t-lg last:rounded-b-lg',
                    currentLocale === locale &&
                      'bg-stone-100/70 dark:bg-stone-700/70'
                  )}
                >
                  <span className="text-sm font-medium">{info.nativeName}</span>
                  {currentLocale === locale && (
                    <div
                      className={cn(
                        'ml-auto h-2 w-2 rounded-full',
                        indicatorColors
                      )}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // navbar variant: used for navigation bar, more compact design
  return (
    <div className="relative" data-language-switcher>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-1.5',
          'h-10 cursor-pointer font-serif transition-colors duration-200',
          'shadow-sm hover:shadow-md',
          buttonColors
        )}
      >
        <span className="hidden text-sm font-medium md:inline">
          {currentLanguageInfo.nativeName}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-full right-0 z-50 mt-2 w-32 rounded-lg border backdrop-blur-sm',
              'shadow-lg',
              dropdownColors
            )}
          >
            {Object.entries(SUPPORTED_LANGUAGES).map(([locale, info]) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale as SupportedLocale)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left',
                  'hover:bg-stone-100/50 dark:hover:bg-stone-700/50',
                  'font-serif transition-colors duration-150',
                  'first:rounded-t-lg last:rounded-b-lg',
                  currentLocale === locale &&
                    'bg-stone-100/70 dark:bg-stone-700/70'
                )}
              >
                <span className="text-sm font-medium">{info.nativeName}</span>
                {currentLocale === locale && (
                  <div
                    className={cn(
                      'ml-auto h-1.5 w-1.5 rounded-full',
                      indicatorColors
                    )}
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
