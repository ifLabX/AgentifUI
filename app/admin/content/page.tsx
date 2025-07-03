'use client';

import { AboutEditor } from '@components/admin/content/about-editor';
import { AboutPreview } from '@components/admin/content/about-preview';
import { ContentTabs } from '@components/admin/content/content-tabs';
import { EditorSkeleton } from '@components/admin/content/editor-skeleton';
import { HomeEditor } from '@components/admin/content/home-editor';
import { HomePreview } from '@components/admin/content/home-preview';
import { PreviewToolbar } from '@components/admin/content/preview-toolbar';
import { ResizableSplitPane } from '@components/ui/resizable-split-pane';
import type { SupportedLocale } from '@lib/config/language-config';
import { useTheme } from '@lib/hooks/use-theme';
import { TranslationService } from '@lib/services/admin/content/translation-service';
import { cn } from '@lib/utils';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

// --- BEGIN COMMENT ---
// 临时类型定义，因为about-config.ts已被删除
// --- END COMMENT ---
interface ValueCard {
  id: string;
  title: string;
  description: string;
}

interface AboutPageConfig {
  title: string;
  subtitle: string;
  mission: string;
  valueCards: ValueCard[];
  buttonText: string;
  copyrightText: string;
}

// --- BEGIN COMMENT ---
// 主页预览配置类型
// --- END COMMENT ---
interface FeatureCard {
  title: string;
  description: string;
}

interface HomePageConfig {
  title: string;
  subtitle: string;
  getStarted: string;
  learnMore: string;
  features: FeatureCard[];
  copyright: {
    prefix: string;
    linkText: string;
    suffix: string;
  };
}

export default function ContentManagementPage() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'about' | 'home'>('about');
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  const [aboutTranslations, setAboutTranslations] = useState<Record<
    SupportedLocale,
    any
  > | null>(null);
  const [originalAboutTranslations, setOriginalAboutTranslations] =
    useState<Record<SupportedLocale, any> | null>(null);

  const [homeTranslations, setHomeTranslations] = useState<Record<
    SupportedLocale,
    any
  > | null>(null);
  const [originalHomeTranslations, setOriginalHomeTranslations] =
    useState<Record<SupportedLocale, any> | null>(null);

  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('zh-CN');
  const [supportedLocales, setSupportedLocales] = useState<SupportedLocale[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'about') {
          const translations =
            await TranslationService.getAboutPageTranslations();
          setAboutTranslations(translations);
          setOriginalAboutTranslations(translations);
        } else if (activeTab === 'home') {
          const translations =
            await TranslationService.getHomePageTranslations();
          setHomeTranslations(translations);
          setOriginalHomeTranslations(translations);
        }

        // 仅在需要时加载语言列表
        if (supportedLocales.length === 0) {
          const locales = await TranslationService.getSupportedLanguages();
          setSupportedLocales(locales);
        }
      } catch (error) {
        console.error(`Failed to load ${activeTab} translations:`, error);
        toast.error('加载翻译数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'about' || tab === 'home') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const aboutChanged =
      JSON.stringify(aboutTranslations) !==
      JSON.stringify(originalAboutTranslations);
    const homeChanged =
      JSON.stringify(homeTranslations) !==
      JSON.stringify(originalHomeTranslations);
    setHasChanges(aboutChanged || homeChanged);
  }, [
    aboutTranslations,
    originalAboutTranslations,
    homeTranslations,
    originalHomeTranslations,
  ]);

  const handleTabChange = (tab: 'about' | 'home') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'about' && aboutTranslations) {
        await TranslationService.updateAboutPageTranslations(aboutTranslations);
        setOriginalAboutTranslations({ ...aboutTranslations });
      } else if (activeTab === 'home' && homeTranslations) {
        await TranslationService.updateHomePageTranslations(homeTranslations);
        setOriginalHomeTranslations({ ...homeTranslations });
      }
      toast.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存配置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (activeTab === 'about' && originalAboutTranslations) {
      setAboutTranslations({ ...originalAboutTranslations });
    } else if (activeTab === 'home' && originalHomeTranslations) {
      setHomeTranslations({ ...originalHomeTranslations });
    }
  };

  const handleAboutTranslationsChange = (
    newTranslations: Record<SupportedLocale, any>
  ) => {
    setAboutTranslations(newTranslations);
  };

  const handleHomeTranslationsChange = (
    newTranslations: Record<SupportedLocale, any>
  ) => {
    setHomeTranslations(newTranslations);
  };

  const handleFullscreenPreview = () => {
    setShowFullscreenPreview(true);
  };

  const handleCloseFullscreenPreview = () => {
    setShowFullscreenPreview(false);
  };

  const transformToAboutPreviewConfig = (
    translations: Record<SupportedLocale, any> | null,
    locale: SupportedLocale
  ): AboutPageConfig | null => {
    const t = translations?.[locale];
    if (!t) return null;

    return {
      title: t.title || '',
      subtitle: t.subtitle || '',
      mission: t.mission?.description || '',
      valueCards: (t.values?.items || []).map((item: any, index: number) => ({
        id: `value-${index}`,
        title: item.title,
        description: item.description,
      })),
      buttonText: t.buttonText || '',
      copyrightText: t.copyright
        ? `${t.copyright.prefix?.replace('{year}', new Date().getFullYear()) || ''}${t.copyright.linkText || ''}${t.copyright.suffix || ''}`
        : '',
    };
  };

  const transformToHomePreviewConfig = (
    translations: Record<SupportedLocale, any> | null,
    locale: SupportedLocale
  ): HomePageConfig | null => {
    const t = translations?.[locale];
    if (!t) return null;

    return {
      title: t.title || '',
      subtitle: t.subtitle || '',
      getStarted: t.getStarted || '',
      learnMore: t.learnMore || '',
      features: t.features || [],
      copyright: t.copyright || { prefix: '', linkText: '', suffix: '' },
    };
  };

  const aboutPreviewConfig = transformToAboutPreviewConfig(
    aboutTranslations,
    currentLocale
  );
  const homePreviewConfig = transformToHomePreviewConfig(
    homeTranslations,
    currentLocale
  );

  const renderEditor = () => {
    if (isLoading) return <EditorSkeleton />;

    if (activeTab === 'about') {
      return aboutTranslations ? (
        <AboutEditor
          translations={aboutTranslations}
          currentLocale={currentLocale}
          supportedLocales={supportedLocales}
          onTranslationsChange={handleAboutTranslationsChange}
          onLocaleChange={setCurrentLocale}
        />
      ) : (
        <div>无法加载关于页面编辑器。</div>
      );
    }

    if (activeTab === 'home') {
      return homeTranslations ? (
        <HomeEditor
          translations={homeTranslations}
          currentLocale={currentLocale}
          supportedLocales={supportedLocales}
          onTranslationsChange={handleHomeTranslationsChange}
          onLocaleChange={setCurrentLocale}
        />
      ) : (
        <div>无法加载主页编辑器。</div>
      );
    }
    return null;
  };

  const renderPreview = () => {
    if (activeTab === 'about') {
      return aboutPreviewConfig ? (
        <AboutPreview
          config={aboutPreviewConfig}
          previewDevice={previewDevice}
        />
      ) : (
        <div>加载预览...</div>
      );
    }
    if (activeTab === 'home') {
      return homePreviewConfig ? (
        <HomePreview config={homePreviewConfig} previewDevice={previewDevice} />
      ) : (
        <div>加载预览...</div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'flex h-screen flex-col overflow-hidden',
        isDark ? 'bg-stone-950' : 'bg-stone-100'
      )}
    >
      <div
        className={cn('flex-shrink-0', isDark ? 'bg-stone-900' : 'bg-stone-50')}
      >
        <div className="w-full px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1
                className={cn(
                  'text-xl font-semibold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                内容管理
              </h1>
              <p
                className={cn(
                  'hidden text-sm md:block',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                管理主页和关于页面的多语言内容
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!showPreview && (
                <button
                  onClick={() => setShowPreview(true)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm transition-colors',
                    isDark
                      ? 'border border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700'
                      : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                  )}
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">显示预览</span>
                </button>
              )}
              <ContentTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {showPreview ? (
          <ResizableSplitPane
            storageKey="content-management-split-pane"
            defaultLeftWidth={50}
            minLeftWidth={30}
            maxLeftWidth={70}
            left={
              <div
                className={cn(
                  'flex h-full flex-col',
                  isDark ? 'bg-stone-900' : 'bg-white'
                )}
              >
                <div className="flex-1 overflow-auto p-6">{renderEditor()}</div>
                <div
                  className={cn(
                    'flex-shrink-0 p-4',
                    isDark ? 'bg-stone-900' : 'bg-white'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasChanges && (
                        <div
                          className={cn(
                            'flex items-center gap-2 text-sm',
                            isDark ? 'text-stone-400' : 'text-stone-500'
                          )}
                        >
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          <span>有未保存的更改</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleReset}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                          hasChanges && !isSaving
                            ? isDark
                              ? 'text-stone-300 hover:bg-stone-800'
                              : 'text-stone-600 hover:bg-stone-100'
                            : 'cursor-not-allowed text-stone-500'
                        )}
                      >
                        重置
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                          'rounded-lg px-6 py-2 text-sm font-medium shadow-sm transition-colors',
                          hasChanges && !isSaving
                            ? isDark
                              ? 'bg-stone-100 text-stone-900 hover:bg-white'
                              : 'bg-stone-900 text-white hover:bg-stone-800'
                            : 'cursor-not-allowed bg-stone-300 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
                        )}
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
            right={
              <div className="flex h-full min-w-0 flex-col">
                <PreviewToolbar
                  activeTab={activeTab}
                  previewDevice={previewDevice}
                  onDeviceChange={setPreviewDevice}
                  showPreview={showPreview}
                  onPreviewToggle={() => setShowPreview(!showPreview)}
                  onFullscreenPreview={handleFullscreenPreview}
                />
                <div className="min-h-0 flex-1 overflow-auto">
                  {renderPreview()}
                </div>
              </div>
            }
          />
        ) : (
          <div
            className={cn(
              'relative flex-1',
              isDark ? 'bg-stone-900' : 'bg-white'
            )}
          >
            <div className="h-full overflow-auto p-6">{renderEditor()}</div>
            <div
              className={cn(
                'absolute right-0 bottom-0 left-0 p-4',
                isDark ? 'bg-stone-900/80' : 'bg-white/80',
                'backdrop-blur-sm'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  {hasChanges && (
                    <div
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>有未保存的更改</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      !hasChanges || isSaving
                        ? 'cursor-not-allowed text-stone-500'
                        : isDark
                          ? 'text-stone-300 hover:bg-stone-800'
                          : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    重置
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                      'rounded-lg px-6 py-2 text-sm font-medium shadow-sm transition-colors',
                      !hasChanges || isSaving
                        ? 'cursor-not-allowed bg-stone-300 text-stone-500 dark:bg-stone-700 dark:text-stone-400'
                        : isDark
                          ? 'bg-stone-100 text-stone-900 hover:bg-white'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                    )}
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div
              className={cn(
                'flex flex-shrink-0 items-center justify-between px-4 py-3',
                isDark ? 'bg-stone-800/50' : 'bg-white/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-3 w-3 rounded-full',
                    isDark ? 'bg-stone-600' : 'bg-stone-400'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  全屏预览 -
                  {activeTab === 'about'
                    ? aboutPreviewConfig?.title
                    : homePreviewConfig?.title}
                </span>
              </div>
              <button
                onClick={handleCloseFullscreenPreview}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isDark
                    ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                关闭预览
              </button>
            </div>
            <div className="flex-1 overflow-auto">{renderPreview()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
