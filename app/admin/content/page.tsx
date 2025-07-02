'use client';

import { AboutEditor } from '@components/admin/content/about-editor';
import { AboutPreview } from '@components/admin/content/about-preview';
// --- BEGIN COMMENT ---
// 导入所有原子化组件
// --- END COMMENT ---
import { ContentTabs } from '@components/admin/content/content-tabs';
import {
  NotificationConfig,
  NotificationEditor,
} from '@components/admin/content/notification-editor';
import NotificationPreview from '@components/admin/content/notification-preview';
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
// 临时类型定义，因为about-config.ts将被删除
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

export default function ContentManagementPage() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- BEGIN COMMENT ---
  // 页面状态管理
  // --- END COMMENT ---
  const [activeTab, setActiveTab] = useState<'about' | 'notifications'>(
    'about'
  );
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // --- BEGIN COMMENT ---
  // About页面翻译状态
  // --- END COMMENT ---
  const [aboutTranslations, setAboutTranslations] = useState<Record<
    SupportedLocale,
    any
  > | null>(null);
  const [originalAboutTranslations, setOriginalAboutTranslations] =
    useState<Record<SupportedLocale, any> | null>(null);
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('zh-CN');
  const [supportedLocales, setSupportedLocales] = useState<SupportedLocale[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // --- BEGIN COMMENT ---
  // 加载About页面翻译
  // --- END COMMENT ---
  useEffect(() => {
    const loadAboutTranslations = async () => {
      setIsLoading(true);
      try {
        const translations =
          await TranslationService.getAboutPageTranslations();
        const locales = await TranslationService.getSupportedLanguages();
        setAboutTranslations(translations);
        setOriginalAboutTranslations(translations);
        setSupportedLocales(locales);
      } catch (error) {
        console.error('Failed to load about translations:', error);
        toast.error('加载翻译数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'about') {
      loadAboutTranslations();
    }
  }, [activeTab]);

  // --- BEGIN COMMENT ---
  // 通知初始配置
  // --- END COMMENT ---
  const initialNotifications: NotificationConfig[] = [
    {
      id: '1',
      title: '欢迎使用 AgentifUI',
      content: '感谢您选择 AgentifUI！我们为您准备了丰富的功能，快来探索吧。',
      type: 'announcement',
      position: 'center',
      isActive: false,
      startDate: '2024-01-01',
      endDate: null,
    },
    {
      id: '2',
      title: '系统更新通知',
      content:
        '我们即将在今晚进行系统维护，预计停机时间为2小时，感谢您的耐心等待。',
      type: 'maintenance',
      position: 'top-center',
      isActive: false,
      startDate: '2024-01-15',
      endDate: '2024-01-16',
    },
  ];

  // --- BEGIN COMMENT ---
  // 通知配置状态
  // --- END COMMENT ---
  const [notifications, setNotifications] =
    useState<NotificationConfig[]>(initialNotifications);
  const [originalNotifications, setOriginalNotifications] =
    useState<NotificationConfig[]>(initialNotifications);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationConfig | null>(initialNotifications[0] || null);

  // --- BEGIN COMMENT ---
  // URL参数同步 - 根据查询参数设置活动标签
  // --- END COMMENT ---
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'about' || tab === 'notifications') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // --- BEGIN COMMENT ---
  // 变更检测 - 监听配置变化，更新hasChanges状态
  // --- END COMMENT ---
  useEffect(() => {
    const aboutChanged =
      JSON.stringify(aboutTranslations) !==
      JSON.stringify(originalAboutTranslations);
    const notificationsChanged =
      JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
    setHasChanges(aboutChanged || notificationsChanged);
  }, [
    aboutTranslations,
    notifications,
    originalAboutTranslations,
    originalNotifications,
  ]);

  // --- BEGIN COMMENT ---
  // 标签切换处理函数
  // --- END COMMENT ---
  const handleTabChange = (tab: 'about' | 'notifications') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // --- BEGIN COMMENT ---
  // 保存配置
  // --- END COMMENT ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'about' && aboutTranslations) {
        await TranslationService.updateAboutPageTranslations(aboutTranslations);
        setOriginalAboutTranslations({ ...aboutTranslations });
      } else {
        // ... 通知保存逻辑
        setOriginalNotifications([...notifications]);
      }

      toast.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存配置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 重置所有更改到原始状态
  // --- END COMMENT ---
  const handleReset = () => {
    if (activeTab === 'about' && originalAboutTranslations) {
      setAboutTranslations({ ...originalAboutTranslations });
    } else {
      setNotifications([...originalNotifications]);
      setSelectedNotification(originalNotifications[0] || null);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理About翻译变更
  // --- END COMMENT ---
  const handleAboutTranslationsChange = (
    newTranslations: Record<SupportedLocale, any>
  ) => {
    setAboutTranslations(newTranslations);
  };

  // --- BEGIN COMMENT ---
  // 处理通知列表变更
  // --- END COMMENT ---
  const handleNotificationsChange = (
    newNotifications: NotificationConfig[]
  ) => {
    setNotifications(newNotifications);

    // --- BEGIN COMMENT ---
    // 如果当前选中的通知被删除，清空选择
    // --- END COMMENT ---
    if (
      selectedNotification &&
      !newNotifications.find(n => n.id === selectedNotification.id)
    ) {
      setSelectedNotification(newNotifications[0] || null);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理通知选择变更
  // --- END COMMENT ---
  const handleSelectedNotificationChange = (
    notification: NotificationConfig | null
  ) => {
    setSelectedNotification(notification);
  };

  // --- BEGIN COMMENT ---
  // 全屏预览处理函数
  // --- END COMMENT ---
  const handleFullscreenPreview = () => {
    setShowFullscreenPreview(true);
  };

  const handleCloseFullscreenPreview = () => {
    setShowFullscreenPreview(false);
  };

  // --- BEGIN COMMENT ---
  // 将翻译数据转换为预览组件可用的格式
  // --- END COMMENT ---
  const transformTranslationToPreviewConfig = (
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

  const aboutPreviewConfig = transformTranslationToPreviewConfig(
    aboutTranslations,
    currentLocale
  );

  return (
    <div
      className={cn(
        'flex h-screen flex-col overflow-hidden',
        isDark ? 'bg-stone-900' : 'bg-stone-50'
      )}
    >
      {/* --- BEGIN COMMENT ---
      页面头部区域 - 标题和描述 (压缩高度)
      --- END COMMENT --- */}
      <div
        className={cn(
          'flex-shrink-0 border-b',
          isDark ? 'border-stone-600 bg-stone-800' : 'border-stone-200 bg-white'
        )}
      >
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={cn(
                  'text-2xl font-bold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                关于与通知管理
              </h1>
              <p
                className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                管理About页面内容和系统通知推送设置
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!showPreview && (
                <button
                  onClick={() => setShowPreview(true)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors',
                    isDark
                      ? 'border border-stone-600 bg-stone-700 text-stone-300 hover:bg-stone-600'
                      : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  )}
                >
                  <Eye className="h-4 w-4" />
                  显示预览
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
                  isDark ? 'bg-stone-800' : 'bg-white'
                )}
              >
                <div className="flex-1 overflow-auto p-6">
                  {activeTab === 'about' ? (
                    isLoading || !aboutTranslations ? (
                      <div>加载中...</div>
                    ) : (
                      <AboutEditor
                        translations={aboutTranslations}
                        currentLocale={currentLocale}
                        supportedLocales={supportedLocales}
                        onTranslationsChange={handleAboutTranslationsChange}
                        onLocaleChange={setCurrentLocale}
                      />
                    )
                  ) : (
                    <NotificationEditor
                      notifications={notifications}
                      selectedNotification={selectedNotification}
                      onNotificationsChange={handleNotificationsChange}
                      onSelectedChange={handleSelectedNotificationChange}
                    />
                  )}
                </div>
                {/* --- 保存操作区域 --- */}
                <div
                  className={cn(
                    'flex-shrink-0 border-t p-4',
                    isDark ? 'border-stone-600' : 'border-stone-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasChanges && (
                        <div
                          className={cn(
                            'flex items-center gap-2 text-sm',
                            isDark ? 'text-stone-400' : 'text-stone-600'
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
                              ? 'text-stone-300 hover:bg-stone-700'
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
                          'rounded-lg px-6 py-2 text-sm font-medium transition-colors',
                          hasChanges && !isSaving
                            ? isDark
                              ? 'bg-stone-100 text-stone-900 hover:bg-white'
                              : 'bg-stone-900 text-white hover:bg-stone-800'
                            : 'cursor-not-allowed bg-stone-300 text-stone-500'
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
                  {activeTab === 'about' ? (
                    aboutPreviewConfig ? (
                      <AboutPreview
                        config={aboutPreviewConfig}
                        previewDevice={previewDevice}
                      />
                    ) : (
                      <div>加载预览...</div>
                    )
                  ) : (
                    <NotificationPreview notification={selectedNotification} />
                  )}
                </div>
              </div>
            }
          />
        ) : (
          <div
            className={cn(
              'relative flex-1 border-r',
              isDark
                ? 'border-stone-600 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <div className="h-full overflow-auto p-6">
              {activeTab === 'about' ? (
                isLoading || !aboutTranslations ? (
                  <div>加载中...</div>
                ) : (
                  <AboutEditor
                    translations={aboutTranslations}
                    currentLocale={currentLocale}
                    supportedLocales={supportedLocales}
                    onTranslationsChange={handleAboutTranslationsChange}
                    onLocaleChange={setCurrentLocale}
                  />
                )
              ) : (
                <NotificationEditor
                  notifications={notifications}
                  selectedNotification={selectedNotification}
                  onNotificationsChange={handleNotificationsChange}
                  onSelectedChange={handleSelectedNotificationChange}
                />
              )}
            </div>
            {/* --- 保存操作区域 (无预览时) --- */}
            <div
              className={cn(
                'bg-opacity-80 absolute right-0 bottom-0 left-0 border-t p-4 backdrop-blur-sm',
                isDark
                  ? 'border-stone-600 bg-stone-800'
                  : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  {hasChanges && (
                    <div
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        isDark ? 'text-stone-400' : 'text-stone-600'
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
                          ? 'text-stone-300 hover:bg-stone-700'
                          : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    重置
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                      'rounded-lg px-6 py-2 text-sm font-medium transition-colors',
                      !hasChanges || isSaving
                        ? 'cursor-not-allowed bg-stone-300 text-stone-500'
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

      {showFullscreenPreview && activeTab === 'about' && aboutPreviewConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div
              className={cn(
                'flex items-center justify-between border-b px-6 py-4',
                isDark
                  ? 'border-stone-600 bg-stone-800'
                  : 'border-stone-200 bg-white'
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
                  全屏预览 - {aboutPreviewConfig.title}
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
            <div className="flex-1 overflow-auto">
              <AboutPreview
                config={aboutPreviewConfig}
                previewDevice="desktop"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
