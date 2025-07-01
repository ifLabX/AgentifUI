'use client';

import { ThemeCard } from '@components/settings';
import { TimezoneSelector } from '@components/settings/appearance/timezone-selector';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { useTheme } from '@lib/hooks/use-theme';
import { useUserTimezone } from '@lib/hooks/use-user-timezone';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

// --- BEGIN COMMENT ---
// 外观设置页面
// 允许用户选择主题（亮色/暗色/系统）
// --- END COMMENT ---
export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { timezone, updateTimezone } = useUserTimezone();
  const { colors } = useSettingsColors();
  const t = useTranslations('pages.settings.appearanceSettings');
  const [isSaving, setIsSaving] = useState(false);
  const [isTimezoneUpdating, setIsTimezoneUpdating] = useState(false);

  // --- BEGIN COMMENT ---
  // 处理主题变更
  // 目前只是更新前端状态，未来可以扩展为保存到用户偏好设置
  // --- END COMMENT ---
  const handleThemeChange = (newTheme: string) => {
    setIsSaving(true);

    // 设置主题
    setTheme(newTheme);

    // 模拟保存延迟
    setTimeout(() => {
      setIsSaving(false);
    }, 300);
  };

  // --- BEGIN COMMENT ---
  // 处理时区变更
  // 使用localStorage存储用户时区偏好
  // --- END COMMENT ---
  const handleTimezoneChange = (newTimezone: string) => {
    setIsTimezoneUpdating(true);

    // 更新时区设置
    const success = updateTimezone(newTimezone);

    if (success) {
      console.log(`[AppearanceSettings] 时区已更新为: ${newTimezone}`);
    }

    // 模拟保存延迟
    setTimeout(() => {
      setIsTimezoneUpdating(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="mb-6 font-serif text-2xl font-bold">{t('title')}</h1>

      <div
        className={`w-full space-y-10 ${colors.cardBackground.tailwind} rounded-lg border ${colors.borderColor.tailwind} p-6`}
      >
        {/* 主题选择 */}
        <section>
          <h2 className="mb-4 font-serif text-lg font-medium">{t('theme')}</h2>
          <p
            className={`${colors.secondaryTextColor.tailwind} mb-6 font-serif`}
          >
            {t('themeDescription')}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* 浅色主题 - 放在最前面 */}
            <ThemeCard
              title={t('themes.light')}
              theme="light"
              currentTheme={theme || 'system'}
              onClick={() => handleThemeChange('light')}
            />

            {/* 系统主题 */}
            <ThemeCard
              title={t('themes.system')}
              theme="system"
              currentTheme={theme || 'system'}
              onClick={() => handleThemeChange('system')}
            />

            {/* 深色主题 */}
            <ThemeCard
              title={t('themes.dark')}
              theme="dark"
              currentTheme={theme || 'system'}
              onClick={() => handleThemeChange('dark')}
            />
          </div>
        </section>

        {/* 时区设置 */}
        <section>
          <h2 className="mb-4 font-serif text-lg font-medium">
            {t('timezone')}
          </h2>
          <p
            className={`${colors.secondaryTextColor.tailwind} mb-6 font-serif`}
          >
            {t('timezoneDescription')}
          </p>

          <TimezoneSelector
            value={timezone}
            onChange={handleTimezoneChange}
            className="max-w-md"
          />
        </section>
      </div>
    </motion.div>
  );
}
