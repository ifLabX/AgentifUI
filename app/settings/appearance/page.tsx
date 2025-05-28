'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@lib/hooks/use-theme';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { ThemeCard } from '@components/settings/theme-card';
import { useState } from 'react';

// --- BEGIN COMMENT ---
// 外观设置页面
// 允许用户选择主题（亮色/暗色/系统）
// --- END COMMENT ---
export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { colors } = useSettingsColors();
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6 font-serif">外观设置</h1>
      
      <div className={`space-y-10 w-full ${colors.cardBackground.tailwind} rounded-lg border ${colors.borderColor.tailwind} p-6`}>
        {/* 主题选择 */}
        <section>
          <h2 className="text-lg font-medium mb-4 font-serif">主题</h2>
          <p className={`${colors.secondaryTextColor.tailwind} mb-6 font-serif`}>
            选择您偏好的显示模式
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 浅色主题 */}
            <ThemeCard 
              title="浅色模式" 
              theme="light"
              currentTheme={theme || ''}
              onClick={() => handleThemeChange('light')}
            />
            
            {/* 深色主题 */}
            <ThemeCard 
              title="深色模式" 
              theme="dark"
              currentTheme={theme || ''}
              onClick={() => handleThemeChange('dark')}
            />
            
            {/* 系统主题 */}
            <ThemeCard 
              title="跟随系统" 
              theme="system"
              currentTheme={theme || ''}
              onClick={() => handleThemeChange('system')}
            />
          </div>
        </section>
      </div>
    </motion.div>
  );
}
