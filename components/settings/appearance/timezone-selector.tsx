'use client';

import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, MapPin, Timer, X } from 'lucide-react';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

// Timezone selector component - modern glass design
// Use modern sticky header best practices, glass effect, elegant gradient
// Modern UI design consistent with stone style
interface TimezoneOption {
  value: string;
  cityKey: string;
  region: string;
  offset: string;
}

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

// All timezone options - complete list
const ALL_TIMEZONES: TimezoneOption[] = [
  // UTC
  { value: 'UTC', cityKey: 'utc', region: 'utc', offset: '+00:00' },

  // Asia timezone
  {
    value: 'Asia/Shanghai',
    cityKey: 'shanghai',
    region: 'asia',
    offset: '+08:00',
  },
  {
    value: 'Asia/Hong_Kong',
    cityKey: 'hongKong',
    region: 'asia',
    offset: '+08:00',
  },
  { value: 'Asia/Taipei', cityKey: 'taipei', region: 'asia', offset: '+08:00' },
  {
    value: 'Asia/Singapore',
    cityKey: 'singapore',
    region: 'asia',
    offset: '+08:00',
  },
  { value: 'Asia/Tokyo', cityKey: 'tokyo', region: 'asia', offset: '+09:00' },
  { value: 'Asia/Seoul', cityKey: 'seoul', region: 'asia', offset: '+09:00' },
  {
    value: 'Asia/Bangkok',
    cityKey: 'bangkok',
    region: 'asia',
    offset: '+07:00',
  },
  { value: 'Asia/Dubai', cityKey: 'dubai', region: 'asia', offset: '+04:00' },
  {
    value: 'Asia/Kolkata',
    cityKey: 'kolkata',
    region: 'asia',
    offset: '+05:30',
  },

  // Europe timezone
  {
    value: 'Europe/London',
    cityKey: 'london',
    region: 'europe',
    offset: '+00:00',
  },
  {
    value: 'Europe/Paris',
    cityKey: 'paris',
    region: 'europe',
    offset: '+01:00',
  },
  {
    value: 'Europe/Berlin',
    cityKey: 'berlin',
    region: 'europe',
    offset: '+01:00',
  },
  { value: 'Europe/Rome', cityKey: 'rome', region: 'europe', offset: '+01:00' },
  {
    value: 'Europe/Madrid',
    cityKey: 'madrid',
    region: 'europe',
    offset: '+01:00',
  },
  {
    value: 'Europe/Amsterdam',
    cityKey: 'amsterdam',
    region: 'europe',
    offset: '+01:00',
  },
  {
    value: 'Europe/Moscow',
    cityKey: 'moscow',
    region: 'europe',
    offset: '+03:00',
  },

  // America timezone
  {
    value: 'America/New_York',
    cityKey: 'newYork',
    region: 'america',
    offset: '-05:00',
  },
  {
    value: 'America/Los_Angeles',
    cityKey: 'losAngeles',
    region: 'america',
    offset: '-08:00',
  },
  {
    value: 'America/Chicago',
    cityKey: 'chicago',
    region: 'america',
    offset: '-06:00',
  },
  {
    value: 'America/Denver',
    cityKey: 'denver',
    region: 'america',
    offset: '-07:00',
  },
  {
    value: 'America/Toronto',
    cityKey: 'toronto',
    region: 'america',
    offset: '-05:00',
  },
  {
    value: 'America/Sao_Paulo',
    cityKey: 'saoPaulo',
    region: 'america',
    offset: '-03:00',
  },
  {
    value: 'America/Mexico_City',
    cityKey: 'mexicoCity',
    region: 'america',
    offset: '-06:00',
  },

  // Oceania timezone
  {
    value: 'Australia/Sydney',
    cityKey: 'sydney',
    region: 'australia',
    offset: '+10:00',
  },
  {
    value: 'Australia/Melbourne',
    cityKey: 'melbourne',
    region: 'australia',
    offset: '+10:00',
  },
  {
    value: 'Australia/Perth',
    cityKey: 'perth',
    region: 'australia',
    offset: '+08:00',
  },
  {
    value: 'Pacific/Auckland',
    cityKey: 'auckland',
    region: 'australia',
    offset: '+12:00',
  },

  // Africa timezone
  {
    value: 'Africa/Cairo',
    cityKey: 'cairo',
    region: 'africa',
    offset: '+02:00',
  },
  {
    value: 'Africa/Johannesburg',
    cityKey: 'johannesburg',
    region: 'africa',
    offset: '+02:00',
  },
  {
    value: 'Africa/Lagos',
    cityKey: 'lagos',
    region: 'africa',
    offset: '+01:00',
  },
];

export function TimezoneSelector({
  value,
  onChange,
  className,
}: TimezoneSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('pages.settings.appearanceSettings');
  const { formatDate } = useDateFormatter();

  // Get current time preview
  const currentTime = useMemo(() => {
    try {
      return formatDate(new Date(), {
        ...DateFormatPresets.dateTime,
        timezone: value,
      });
    } catch (error) {
      console.warn('[TimezoneSelector] Time formatting failed:', error);
      return formatDate(new Date(), DateFormatPresets.dateTime);
    }
  }, [formatDate, value]);

  // Get current selected timezone information
  const selectedTimezone = ALL_TIMEZONES.find(tz => tz.value === value);

  // Group timezones by region
  const groupedTimezones = useMemo(() => {
    const grouped = ALL_TIMEZONES.reduce(
      (acc, timezone) => {
        if (!acc[timezone.region]) {
          acc[timezone.region] = [];
        }
        acc[timezone.region].push(timezone);
        return acc;
      },
      {} as Record<string, TimezoneOption[]>
    );

    // Sort regions
    const orderedRegions = [
      'utc',
      'asia',
      'europe',
      'america',
      'australia',
      'africa',
    ];
    const orderedGrouped: Record<string, TimezoneOption[]> = {};

    orderedRegions.forEach(region => {
      if (grouped[region]) {
        orderedGrouped[region] = grouped[region];
      }
    });

    return orderedGrouped;
  }, []);

  // Handle timezone selection
  const handleTimezoneSelect = (timezone: string) => {
    onChange(timezone);
    setIsModalOpen(false);
  };

  return (
    <div className={cn(className)}>
      {/* Timezone status bar - click to trigger modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200',
          'group hover:-translate-y-0.5 hover:shadow-lg',
          'border-stone-200 bg-white hover:border-stone-300',
          'dark:border-stone-700 dark:bg-stone-800/60 dark:hover:border-stone-600'
        )}
      >
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200',
              'bg-stone-100 text-stone-600',
              'dark:bg-stone-700 dark:text-stone-400'
            )}
          >
            <Timer className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-serif text-sm font-semibold',
                'text-stone-800 dark:text-stone-200'
              )}
            >
              {selectedTimezone
                ? t(`timezoneCities.${selectedTimezone.cityKey}`)
                : value}
            </p>
            <p
              className={cn(
                'font-serif text-xs',
                'text-stone-500 dark:text-stone-400'
              )}
            >
              {currentTime}
            </p>
          </div>
        </div>
        <ChevronRight
          className={cn(
            'h-5 w-5 transition-transform duration-200 group-hover:translate-x-1',
            'text-stone-500 dark:text-stone-400'
          )}
        />
      </button>

      {/* Timezone selection modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className={cn(
                'w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl',
                'border-stone-200 bg-white',
                'dark:border-stone-700 dark:bg-stone-800'
              )}
            >
              {/* Modal header - simplified design */}
              <div
                className={cn(
                  'flex items-center justify-between border-b px-6 py-4',
                  'border-stone-200 dark:border-stone-700'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                      'bg-stone-100 text-stone-700',
                      'dark:bg-stone-700 dark:text-stone-300'
                    )}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      className={cn(
                        'font-serif text-lg font-bold',
                        'text-stone-900 dark:text-stone-100'
                      )}
                    >
                      {t('timezone')}
                    </h2>
                    <p
                      className={cn(
                        'font-serif text-sm',
                        'text-stone-600 dark:text-stone-400'
                      )}
                    >
                      {t('timezoneDescription')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    'rounded-lg p-2 transition-colors duration-200',
                    'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    'dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-300'
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Timezone list - modern glass sticky design */}
              <div className="max-h-96 overflow-y-auto">
                {Object.entries(groupedTimezones).map(([region, timezones]) => (
                  <div key={region}>
                    {/* Region title - glass sticky header */}
                    <div
                      className={cn(
                        'sticky top-0 z-20',
                        // Glass effect
                        'backdrop-blur-xl backdrop-saturate-150',
                        // Light mode gradient
                        'bg-gradient-to-r from-stone-50/90 via-white/95 to-stone-50/90',
                        'border-b border-stone-200/60',
                        'shadow-lg shadow-stone-300/20',
                        // Dark mode gradient
                        'dark:via-stone-750/95 dark:from-stone-800/90 dark:to-stone-800/90',
                        'dark:border-stone-700/60',
                        'dark:shadow-stone-900/40'
                      )}
                    >
                      {/* Decorative top border */}
                      <div
                        className={cn(
                          'absolute inset-x-0 top-0 h-px',
                          'bg-gradient-to-r from-transparent via-stone-400/40 to-transparent',
                          'dark:via-stone-500/50'
                        )}
                      />

                      <div className="relative px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {/* Glow indicator */}
                          <div className="relative">
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                'bg-stone-600 dark:bg-stone-400'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute inset-0 h-2 w-2 animate-pulse rounded-full',
                                'bg-stone-600/30 dark:bg-stone-400/30'
                              )}
                            />
                          </div>

                          <h3
                            className={cn(
                              'font-serif text-sm font-bold tracking-wider uppercase',
                              'bg-gradient-to-r bg-clip-text text-transparent',
                              'from-stone-700 to-stone-900',
                              'dark:from-stone-100 dark:to-stone-300'
                            )}
                          >
                            {t(`timezoneRegions.${region}`)}
                          </h3>

                          {/* Decorative separator */}
                          <div className="h-px flex-1 bg-gradient-to-r from-current/20 to-transparent opacity-30" />
                        </div>
                      </div>

                      {/* Decorative bottom border */}
                      <div
                        className={cn(
                          'absolute inset-x-0 bottom-0 h-px',
                          'bg-gradient-to-r from-transparent via-stone-300/40 to-transparent',
                          'dark:via-stone-600/30'
                        )}
                      />
                    </div>

                    {/* Timezone list item - improve spacing and visual hierarchy */}
                    <div
                      className={cn(
                        'relative space-y-2 p-4',
                        // Subtle background gradient
                        'bg-gradient-to-b from-transparent to-stone-50/30',
                        'dark:to-stone-800/20'
                      )}
                    >
                      {timezones.map(timezone => {
                        const isSelected = value === timezone.value;
                        const cityName = t(
                          `timezoneCities.${timezone.cityKey}`
                        );

                        return (
                          <button
                            key={timezone.value}
                            onClick={() => handleTimezoneSelect(timezone.value)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg p-3 transition-all duration-200',
                              'group relative overflow-hidden border hover:shadow-lg',
                              isSelected
                                ? 'border-stone-400 bg-stone-100/80 shadow-md ring-1 ring-stone-400/30 dark:border-stone-500 dark:bg-stone-600/60 dark:ring-stone-500/30'
                                : 'dark:hover:bg-stone-750/30 border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 dark:border-stone-700 dark:hover:border-stone-600'
                            )}
                          >
                            {/* Subtle hover gradient effect */}
                            <div
                              className={cn(
                                'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                                'bg-gradient-to-r from-stone-100/40 to-stone-200/20',
                                'dark:from-stone-700/20 dark:to-stone-600/10'
                              )}
                            />

                            <div className="relative flex w-full items-center justify-between">
                              <div className="text-left">
                                <p
                                  className={cn(
                                    'font-serif text-sm font-semibold',
                                    isSelected
                                      ? 'text-stone-900 dark:text-stone-100'
                                      : 'text-stone-800 dark:text-stone-200'
                                  )}
                                >
                                  {cityName}
                                </p>
                                <p
                                  className={cn(
                                    'mt-0.5 flex items-center space-x-1 font-serif text-xs',
                                    isSelected
                                      ? 'text-stone-600 dark:text-stone-300'
                                      : 'text-stone-500 dark:text-stone-400'
                                  )}
                                >
                                  <span className="font-medium">
                                    {timezone.offset}
                                  </span>
                                  <span className="opacity-60">•</span>
                                  <span className="text-xs opacity-75">
                                    {timezone.value}
                                  </span>
                                </p>
                              </div>

                              {isSelected && (
                                <div
                                  className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded-full',
                                    'bg-gradient-to-r shadow-sm',
                                    'from-stone-600 to-stone-700 text-white shadow-stone-300/30',
                                    'dark:from-stone-500 dark:to-stone-600 dark:shadow-stone-900/50'
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
