'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

import React from 'react';

// 移除对 about-editor 的依赖，因为类型现在在 page.tsx 中管理
// 重新定义类型，因为它们将从 about-config.ts 中删除
export interface ValueCard {
  id: string;
  title: string;
  description: string;
}

export interface AboutPageConfig {
  title: string;
  subtitle: string;
  mission: string;
  valueCards: ValueCard[];
  buttonText: string;
  copyrightText: string;
}

interface AboutPreviewProps {
  config: AboutPageConfig;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
}

export function AboutPreview({ config, previewDevice }: AboutPreviewProps) {
  const { isDark } = useTheme();

  // 与About页面完全一致的颜色系统
  const getColors = () => {
    if (isDark) {
      return {
        titleGradient: 'from-stone-300 to-stone-500',
        textColor: 'text-gray-300',
        headingColor: 'text-gray-100',
        paragraphColor: 'text-gray-400',
        cardBg: 'bg-stone-700',
        cardBorder: 'border-stone-600',
        cardShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        cardHeadingColor: 'text-stone-300',
        cardTextColor: 'text-gray-400',
        buttonClass:
          'bg-stone-600 hover:bg-stone-500 text-gray-100 cursor-pointer hover:scale-105',
      };
    } else {
      return {
        titleGradient: 'from-stone-700 to-stone-900',
        textColor: 'text-stone-700',
        headingColor: 'text-stone-800',
        paragraphColor: 'text-stone-600',
        cardBg: 'bg-stone-100',
        cardBorder: 'border-stone-200',
        cardShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        cardHeadingColor: 'text-stone-700',
        cardTextColor: 'text-stone-600',
        buttonClass:
          'bg-stone-800 hover:bg-stone-700 text-gray-100 cursor-pointer hover:scale-105',
      };
    }
  };

  const colors = getColors();

  // 根据预览设备类型设置容器样式和尺寸
  const getDeviceStyles = () => {
    switch (previewDevice) {
      case 'mobile':
        return {
          container: 'mx-auto bg-black rounded-[2rem] p-2 shadow-2xl',
          screen:
            'w-[375px] h-[667px] bg-white rounded-[1.75rem] overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'min-h-full w-full py-4 px-4',
          innerContainer: 'w-full',
        };
      case 'tablet':
        return {
          container: 'mx-auto bg-black rounded-xl p-3 shadow-2xl mt-50',
          screen:
            'w-[768px] h-[1024px] bg-white rounded-lg overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass: 'min-h-full w-full py-6 px-6',
          innerContainer: 'max-w-2xl mx-auto',
        };
      case 'desktop':
      default:
        return {
          container: 'w-full h-full',
          screen: 'w-full h-full overflow-hidden relative',
          content: 'h-full overflow-y-auto',
          mainClass:
            'min-h-screen w-full py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden',
          innerContainer: 'max-w-5xl mx-auto',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  // 根据设备调整字体大小和间距，与About页面保持一致
  const getResponsiveClasses = () => {
    switch (previewDevice) {
      case 'mobile':
        return {
          title: 'text-3xl font-bold mb-4 leading-tight py-1',
          subtitle: 'text-base font-light',
          missionTitle: 'text-xl font-bold mb-4',
          missionContent: 'text-sm',
          valuesTitle: 'text-xl font-bold mb-4',
          cardTitle: 'text-base font-semibold mb-2',
          cardContent: 'text-sm',
          button: 'px-6 py-2 text-sm font-medium rounded-lg',
          copyright: 'text-xs',
          spacing: {
            section: 'mb-6',
            missionPadding: 'p-4',
            cardPadding: 'p-4',
            cardGap: 'gap-4',
          },
        };
      case 'tablet':
        return {
          title: 'text-4xl md:text-4xl font-bold mb-4 leading-tight py-1',
          subtitle: 'text-lg font-light',
          missionTitle: 'text-2xl font-bold mb-4',
          missionContent: 'text-base',
          valuesTitle: 'text-2xl font-bold mb-4',
          cardTitle: 'text-lg font-semibold mb-2',
          cardContent: 'text-sm',
          button: 'px-6 py-2.5 text-base font-medium rounded-lg',
          copyright: 'text-sm',
          spacing: {
            section: 'mb-8',
            missionPadding: 'p-6',
            cardPadding: 'p-5',
            cardGap: 'gap-5',
          },
        };
      case 'desktop':
      default:
        return {
          title: 'text-4xl md:text-5xl font-bold mb-6 leading-tight py-2',
          subtitle: 'text-xl font-light',
          missionTitle: 'text-2xl font-bold mb-6',
          missionContent: 'text-lg',
          valuesTitle: 'text-2xl font-bold mb-6',
          cardTitle: 'text-lg font-semibold mb-2',
          cardContent: '',
          button: 'px-8 py-3 text-base font-medium rounded-lg',
          copyright: 'text-sm',
          spacing: {
            section: 'mb-10',
            missionPadding: '',
            cardPadding: 'p-6',
            cardGap: 'gap-6',
          },
        };
    }
  };

  const responsive = getResponsiveClasses();

  return (
    <div
      className={cn(
        'flex h-full items-center justify-center',
        previewDevice !== 'desktop' && 'p-4'
      )}
    >
      <div className={deviceStyles.container}>
        <div
          className={cn(
            deviceStyles.screen,
            previewDevice === 'desktop'
              ? isDark
                ? 'bg-stone-900'
                : 'bg-stone-50'
              : isDark
                ? 'bg-stone-800'
                : 'bg-white'
          )}
        >
          <div className={deviceStyles.content}>
            <main className={deviceStyles.mainClass}>
              <div className={deviceStyles.innerContainer}>
                {/* Title section - fully consistent with About page */}
                <section
                  className={cn('text-center', responsive.spacing.section)}
                >
                  <h1
                    className={cn(
                      responsive.title,
                      `bg-gradient-to-r ${colors.titleGradient} bg-clip-text text-transparent`
                    )}
                  >
                    {config.title}
                  </h1>
                  <p
                    className={cn(
                      responsive.subtitle,
                      colors.textColor,
                      'mx-auto max-w-3xl'
                    )}
                  >
                    {config.subtitle}
                  </p>
                </section>

                {/* Mission section - fully consistent with About page */}
                <section className={responsive.spacing.section}>
                  <p
                    className={cn(
                      responsive.missionContent,
                      colors.paragraphColor
                    )}
                  >
                    {config.mission}
                  </p>
                </section>

                {/* Values section - fully consistent with About page, uses correct grid layout based on device type */}
                <section className={responsive.spacing.section}>
                  <div
                    className={cn(
                      'grid',
                      previewDevice === 'mobile'
                        ? 'grid-cols-1'
                        : previewDevice === 'tablet'
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-1 md:grid-cols-2',
                      responsive.spacing.cardGap
                    )}
                  >
                    {config.valueCards.map((value, index) => (
                      <div
                        key={value.id}
                        className={cn(
                          colors.cardBg,
                          colors.cardShadow,
                          'border',
                          colors.cardBorder,
                          'rounded-xl',
                          responsive.spacing.cardPadding
                        )}
                      >
                        <h3
                          className={cn(
                            responsive.cardTitle,
                            colors.cardHeadingColor
                          )}
                        >
                          {value.title}
                        </h3>
                        <p
                          className={cn(
                            responsive.cardContent,
                            colors.cardTextColor
                          )}
                        >
                          {value.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Call-to-action button - fully consistent with About page */}
                <section
                  className={cn('text-center', responsive.spacing.section)}
                >
                  <button
                    className={cn(
                      responsive.button,
                      colors.buttonClass,
                      'h-auto transition-all duration-200'
                    )}
                  >
                    {config.buttonText}
                  </button>
                </section>

                {/* Footer information - fully consistent with About page */}
                <div
                  className={cn(
                    'text-center',
                    colors.textColor,
                    responsive.copyright
                  )}
                >
                  <p>{config.copyrightText}</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
