'use client';

import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, MapPin, Timer, X } from 'lucide-react';
import { toast } from 'sonner';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

// --- BEGIN COMMENT ---
// 时区选择器组件 - 现代玻璃态设计
// 采用现代粘性头部最佳实践，玻璃态效果、优雅渐变
// 符合stone风格的现代化UI设计
// --- END COMMENT ---

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

// --- BEGIN COMMENT ---
// 所有时区选项 - 完整列表
// --- END COMMENT ---
const ALL_TIMEZONES: TimezoneOption[] = [
  // UTC
  { value: 'UTC', cityKey: 'utc', region: 'utc', offset: '+00:00' },

  // 亚洲时区
  {
    value: 'Asia/Shanghai',
    cityKey: 'shanghai',
    region: 'asia',
    offset: '+08:00',
  },
  {
    value: 'Asia/Beijing',
    cityKey: 'beijing',
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

  // 欧洲时区
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

  // 美洲时区
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

  // 大洋洲时区
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

  // 非洲时区
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
  const { isDark } = useTheme();
  const t = useTranslations('pages.settings.appearanceSettings');
  const { formatDate } = useDateFormatter();

  // --- BEGIN COMMENT ---
  // 获取当前时间预览
  // --- END COMMENT ---
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

  // --- BEGIN COMMENT ---
  // 获取当前选中时区信息
  // --- END COMMENT ---
  const selectedTimezone = ALL_TIMEZONES.find(tz => tz.value === value);

  // --- BEGIN COMMENT ---
  // 按地区分组时区
  // --- END COMMENT ---
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

    // 排序地区
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

  // --- BEGIN COMMENT ---
  // 处理时区选择
  // --- END COMMENT ---
  const handleTimezoneSelect = (timezone: string) => {
    onChange(timezone);
    setIsModalOpen(false);

    // 显示成功提示
    const selectedTz = ALL_TIMEZONES.find(tz => tz.value === timezone);
    if (selectedTz) {
      toast.success(t('timezoneUpdated'));
    }
  };

  return (
    <div className={cn(className)}>
      {/* 时区状态条 - 点击触发模态框 */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200',
          'group hover:-translate-y-0.5 hover:shadow-lg',
          isDark
            ? 'border-stone-700 bg-stone-800/60 hover:border-stone-600'
            : 'border-stone-200 bg-white hover:border-stone-300'
        )}
      >
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200',
              isDark
                ? 'bg-stone-700 text-stone-400'
                : 'bg-stone-100 text-stone-600'
            )}
          >
            <Timer className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'font-serif text-sm font-semibold',
                isDark ? 'text-stone-200' : 'text-stone-800'
              )}
            >
              {selectedTimezone
                ? t(`timezoneCities.${selectedTimezone.cityKey}`)
                : value}
            </p>
            <p
              className={cn(
                'font-serif text-xs',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            >
              {currentTime}
            </p>
          </div>
        </div>
        <ChevronRight
          className={cn(
            'h-5 w-5 transition-transform duration-200 group-hover:translate-x-1',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        />
      </button>

      {/* 时区选择模态框 */}
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
                isDark
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-200 bg-white'
              )}
            >
              {/* 模态框头部 - 简化设计 */}
              <div
                className={cn(
                  'flex items-center justify-between border-b px-6 py-4',
                  isDark ? 'border-stone-700' : 'border-stone-200'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                      isDark
                        ? 'bg-stone-700 text-stone-300'
                        : 'bg-stone-100 text-stone-700'
                    )}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      className={cn(
                        'font-serif text-lg font-bold',
                        isDark ? 'text-stone-100' : 'text-stone-900'
                      )}
                    >
                      {t('timezone')}
                    </h2>
                    <p
                      className={cn(
                        'font-serif text-sm',
                        isDark ? 'text-stone-400' : 'text-stone-600'
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
                    isDark
                      ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 时区列表 - 现代玻璃态粘性设计 */}
              <div className="max-h-96 overflow-y-auto">
                {Object.entries(groupedTimezones).map(([region, timezones]) => (
                  <div key={region}>
                    {/* 地区标题 - 玻璃态粘性头部 */}
                    <div
                      className={cn(
                        'sticky top-0 z-20',
                        // 玻璃态效果
                        'backdrop-blur-xl backdrop-saturate-150',
                        // 渐变背景 - 深色模式
                        isDark
                          ? [
                              'via-stone-750/95 bg-gradient-to-r from-stone-800/90 to-stone-800/90',
                              'border-b border-stone-700/60',
                              'shadow-lg shadow-stone-900/40',
                            ]
                          : [
                              // 浅色模式
                              'bg-gradient-to-r from-stone-50/90 via-white/95 to-stone-50/90',
                              'border-b border-stone-200/60',
                              'shadow-lg shadow-stone-300/20',
                            ]
                      )}
                    >
                      {/* 装饰性顶部边框 */}
                      <div
                        className={cn(
                          'absolute inset-x-0 top-0 h-px',
                          isDark
                            ? 'bg-gradient-to-r from-transparent via-stone-500/50 to-transparent'
                            : 'bg-gradient-to-r from-transparent via-stone-400/40 to-transparent'
                        )}
                      />

                      <div className="relative px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {/* 发光指示器 */}
                          <div className="relative">
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                isDark ? 'bg-stone-400' : 'bg-stone-600'
                              )}
                            />
                            <div
                              className={cn(
                                'absolute inset-0 h-2 w-2 animate-pulse rounded-full',
                                isDark ? 'bg-stone-400/30' : 'bg-stone-600/30'
                              )}
                            />
                          </div>

                          <h3
                            className={cn(
                              'font-serif text-sm font-bold tracking-wider uppercase',
                              'bg-gradient-to-r bg-clip-text text-transparent',
                              isDark
                                ? 'from-stone-100 to-stone-300'
                                : 'from-stone-700 to-stone-900'
                            )}
                          >
                            {t(`timezoneRegions.${region}`)}
                          </h3>

                          {/* 装饰性分割线 */}
                          <div className="h-px flex-1 bg-gradient-to-r from-current/20 to-transparent opacity-30" />
                        </div>
                      </div>

                      {/* 装饰性底部边框 */}
                      <div
                        className={cn(
                          'absolute inset-x-0 bottom-0 h-px',
                          isDark
                            ? 'bg-gradient-to-r from-transparent via-stone-600/30 to-transparent'
                            : 'bg-gradient-to-r from-transparent via-stone-300/40 to-transparent'
                        )}
                      />
                    </div>

                    {/* 时区列表项 - 改善间距和视觉层次 */}
                    <div
                      className={cn(
                        'relative space-y-2 p-4',
                        // 微妙的背景渐变
                        isDark
                          ? 'bg-gradient-to-b from-transparent to-stone-800/20'
                          : 'bg-gradient-to-b from-transparent to-stone-50/30'
                      )}
                    >
                      {timezones.map((timezone, index) => {
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
                                ? isDark
                                  ? 'border-stone-500 bg-stone-600/60 shadow-md ring-1 ring-stone-500/30'
                                  : 'border-stone-400 bg-stone-100/80 shadow-md ring-1 ring-stone-400/30'
                                : isDark
                                  ? 'hover:bg-stone-750/30 border-stone-700 hover:border-stone-600'
                                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                            )}
                          >
                            {/* 微妙的悬停渐变效果 */}
                            <div
                              className={cn(
                                'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                                isDark
                                  ? 'bg-gradient-to-r from-stone-700/20 to-stone-600/10'
                                  : 'bg-gradient-to-r from-stone-100/40 to-stone-200/20'
                              )}
                            />

                            <div className="relative flex w-full items-center justify-between">
                              <div className="text-left">
                                <p
                                  className={cn(
                                    'font-serif text-sm font-semibold',
                                    isSelected
                                      ? isDark
                                        ? 'text-stone-100'
                                        : 'text-stone-900'
                                      : isDark
                                        ? 'text-stone-200'
                                        : 'text-stone-800'
                                  )}
                                >
                                  {cityName}
                                </p>
                                <p
                                  className={cn(
                                    'mt-0.5 flex items-center space-x-1 font-serif text-xs',
                                    isSelected
                                      ? isDark
                                        ? 'text-stone-300'
                                        : 'text-stone-600'
                                      : isDark
                                        ? 'text-stone-400'
                                        : 'text-stone-500'
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
                                    isDark
                                      ? 'from-stone-500 to-stone-600 text-white shadow-stone-900/50'
                                      : 'from-stone-600 to-stone-700 text-white shadow-stone-300/30'
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
