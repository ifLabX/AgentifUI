'use client';

import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { useNotificationStore } from '@lib/stores/ui/notification-store';
import type { NotificationCategory } from '@lib/types/notification-center';
import { cn } from '@lib/utils';
import { ArrowLeft, Eye, Save, Send } from 'lucide-react';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationForm {
  type: 'changelog' | 'message';
  category: NotificationCategory;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_roles: string[];
  target_users: string[];
  scheduled_time?: string;
}

export default function CreateNotificationPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('pages.admin.notifications');
  const { showNotification } = useNotificationStore();

  const [form, setForm] = useState<NotificationForm>({
    type: 'message',
    category: 'admin_announcement',
    title: '',
    content: '',
    priority: 'medium',
    target_roles: ['user'],
    target_users: [],
    scheduled_time: '',
  });

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dynamic options using translations
  const CATEGORY_OPTIONS: Record<
    NotificationCategory,
    { label: string; description: string }
  > = {
    admin_announcement: {
      label: t('categories.admin_announcement.label'),
      description: t('categories.admin_announcement.description'),
    },
    agent_result: {
      label: t('categories.agent_result.label'),
      description: t('categories.agent_result.description'),
    },
    token_usage: {
      label: t('categories.token_usage.label'),
      description: t('categories.token_usage.description'),
    },
    system_maintenance: {
      label: t('categories.system_maintenance.label'),
      description: t('categories.system_maintenance.description'),
    },
    security_alert: {
      label: t('categories.security_alert.label'),
      description: t('categories.security_alert.description'),
    },
    feature_tip: {
      label: t('categories.feature_tip.label'),
      description: t('categories.feature_tip.description'),
    },
    feature: {
      label: t('categories.feature.label'),
      description: t('categories.feature.description'),
    },
    improvement: {
      label: t('categories.improvement.label'),
      description: t('categories.improvement.description'),
    },
    bugfix: {
      label: t('categories.bugfix.label'),
      description: t('categories.bugfix.description'),
    },
    security: {
      label: t('categories.security.label'),
      description: t('categories.security.description'),
    },
    api_change: {
      label: t('categories.api_change.label'),
      description: t('categories.api_change.description'),
    },
  };

  const PRIORITY_OPTIONS = {
    low: {
      label: t('priorities.low.label'),
      description: t('priorities.low.description'),
    },
    medium: {
      label: t('priorities.medium.label'),
      description: t('priorities.medium.description'),
    },
    high: {
      label: t('priorities.high.label'),
      description: t('priorities.high.description'),
    },
    critical: {
      label: t('priorities.critical.label'),
      description: t('priorities.critical.description'),
    },
  };

  const ROLE_OPTIONS = [
    { value: 'user', label: t('create.targeting.roles.user') },
    { value: 'admin', label: t('create.targeting.roles.admin') },
    { value: 'developer', label: t('create.targeting.roles.developer') },
    { value: 'tester', label: t('create.targeting.roles.tester') },
  ];

  // Dynamic notification templates using translations
  const NOTIFICATION_TEMPLATES = {
    token_warning: {
      title: t('create.templates.tokenWarning.title'),
      content: t('create.templates.tokenWarning.content'),
      category: 'token_usage' as NotificationCategory,
      priority: 'medium' as const,
    },
    agent_completed: {
      title: t('create.templates.agentResult.title'),
      content: t('create.templates.agentResult.content'),
      category: 'agent_result' as NotificationCategory,
      priority: 'low' as const,
    },
    maintenance_notice: {
      title: t('create.templates.maintenance.title'),
      content: t('create.templates.maintenance.content'),
      category: 'system_maintenance' as NotificationCategory,
      priority: 'high' as const,
    },
    security_alert: {
      title: t('create.templates.securityAlert.title'),
      content: t('create.templates.securityAlert.content'),
      category: 'security_alert' as NotificationCategory,
      priority: 'critical' as const,
    },
    feature_announcement: {
      title: t('create.templates.newFeature.title'),
      content: t('create.templates.newFeature.content'),
      category: 'feature' as NotificationCategory,
      priority: 'medium' as const,
    },
  };

  const handleFieldChange = (
    field: keyof NotificationForm,
    value: string | string[]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (
    templateKey: keyof typeof NOTIFICATION_TEMPLATES
  ) => {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    setForm(prev => ({
      ...prev,
      title: template.title,
      content: template.content,
      category: template.category,
      priority: template.priority,
    }));
  };

  const handleRoleToggle = (role: string) => {
    setForm(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  const insertVariable = (variable: string) => {
    if (contentRef.current) {
      const start = contentRef.current.selectionStart;
      const end = contentRef.current.selectionEnd;
      const newContent =
        form.content.substring(0, start) +
        `{${variable}}` +
        form.content.substring(end);

      setForm(prev => ({ ...prev, content: newContent }));

      // Restore cursor position
      setTimeout(() => {
        if (contentRef.current) {
          const newPosition = start + variable.length + 2;
          contentRef.current.setSelectionRange(newPosition, newPosition);
          contentRef.current.focus();
        }
      }, 0);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!isFormValid) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          published: publish,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save notification');
      }

      // Show success notification and redirect
      showNotification(t('create.messages.saveSuccess'), 'success', 3000);
      router.push('/admin/notifications');
    } catch (error) {
      console.error('Failed to save notification:', error);
      showNotification(
        `${t('create.messages.saveFailed')}: ${error instanceof Error ? error.message : t('common.ui.error')}`,
        'error',
        5000
      );
    } finally {
      setSaving(false);
    }
  };

  const isFormValid =
    form.title.trim() && form.content.trim() && form.target_roles.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/notifications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('create.backButton')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-gray-100">
              {t('create.title')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('create.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            <Eye className="mr-2 h-4 w-4" />
            {preview ? t('create.editButton') : t('create.previewButton')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={!isFormValid || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('create.savingButton') : t('create.saveDraftButton')}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={!isFormValid || saving}
          >
            <Send className="mr-2 h-4 w-4" />
            {saving ? t('create.publishingButton') : t('create.publishButton')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {!preview ? (
            <>
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('create.basicInfo.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t('create.basicInfo.type.label')} *
                      </label>
                      <select
                        value={form.type}
                        onChange={e =>
                          handleFieldChange('type', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                      >
                        <option value="message">
                          {t('create.basicInfo.type.message')}
                        </option>
                        <option value="changelog">
                          {t('create.basicInfo.type.changelog')}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t('create.basicInfo.category.label')} *
                      </label>
                      <select
                        value={form.category}
                        onChange={e =>
                          handleFieldChange('category', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                      >
                        {Object.entries(CATEGORY_OPTIONS).map(
                          ([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                      <p className="mt-1 text-xs text-stone-500">
                        {CATEGORY_OPTIONS[form.category].description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('create.basicInfo.title.label')} *
                    </label>
                    <Input
                      value={form.title}
                      onChange={e => handleFieldChange('title', e.target.value)}
                      placeholder={t('create.basicInfo.title.placeholder')}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('create.basicInfo.priority.label')} *
                    </label>
                    <select
                      value={form.priority}
                      onChange={e =>
                        handleFieldChange('priority', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
                    >
                      {Object.entries(PRIORITY_OPTIONS).map(
                        ([value, { label }]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                    <p className="mt-1 text-xs text-stone-500">
                      {PRIORITY_OPTIONS[form.priority].description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('create.content.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('create.content.label')} *
                    </label>
                    <Textarea
                      ref={contentRef}
                      value={form.content}
                      onChange={e =>
                        handleFieldChange('content', e.target.value)
                      }
                      placeholder={t('create.content.placeholder')}
                      rows={8}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      {t('create.content.variableHint')}
                    </p>
                  </div>

                  {/* Variable Insertion */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('create.content.variableInsert.title')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'username',
                        'time',
                        'date',
                        'agentName',
                        'duration',
                        'result',
                        'percentage',
                        'currentUsage',
                        'limit',
                        'details',
                        'ip',
                        'featureName',
                        'features',
                      ].map(variable => (
                        <Button
                          key={variable}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable)}
                          type="button"
                        >
                          {'{' + variable + '}'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('create.targeting.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('create.targeting.roles.label')} *
                    </label>
                    <div className="mt-2 space-y-2">
                      {ROLE_OPTIONS.map(role => (
                        <label key={role.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={form.target_roles.includes(role.value)}
                            onChange={() => handleRoleToggle(role.value)}
                            className="mr-2 rounded"
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('create.targeting.scheduling.label')}
                    </label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_time}
                      onChange={e =>
                        handleFieldChange('scheduled_time', e.target.value)
                      }
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      {t('create.targeting.scheduling.placeholder')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Preview */
            <Card>
              <CardHeader>
                <CardTitle>{t('create.preview.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      )}
                    >
                      {CATEGORY_OPTIONS[form.category].label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        form.priority === 'critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : form.priority === 'high'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                            : form.priority === 'medium'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      )}
                    >
                      {PRIORITY_OPTIONS[form.priority].label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        form.type === 'changelog'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      )}
                    >
                      {form.type === 'changelog'
                        ? t('create.basicInfo.type.changelog')
                        : t('create.basicInfo.type.message')}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-medium text-stone-900 dark:text-gray-100">
                    {form.title || t('create.basicInfo.title.placeholder')}
                  </h3>

                  <div className="text-sm whitespace-pre-wrap text-stone-600 dark:text-stone-400">
                    {form.content || t('create.content.placeholder')}
                  </div>

                  <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <div className="text-xs text-stone-500">
                      {t('create.preview.targetRoles')}:{' '}
                      {form.target_roles.join(', ')}
                    </div>
                    {form.scheduled_time && (
                      <div className="mt-1 text-xs text-stone-500">
                        {t('create.preview.scheduledTime')}:{' '}
                        {new Date(form.scheduled_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('create.templates.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(NOTIFICATION_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto w-full justify-start p-3"
                  onClick={() =>
                    handleTemplateSelect(
                      key as keyof typeof NOTIFICATION_TEMPLATES
                    )
                  }
                >
                  <div className="text-left">
                    <div className="font-medium">{template.title}</div>
                    <div className="mt-1 text-xs text-stone-500">
                      {CATEGORY_OPTIONS[template.category].label} ·{' '}
                      {PRIORITY_OPTIONS[template.priority].label}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>{t('create.tips.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <div>
                <strong>{t('create.tips.priorityAdvice')}</strong>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {(t('create.tips.priorityItems') as unknown as string[]).map(
                    (item: string, index: number) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <strong>{t('create.tips.contentAdvice')}</strong>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {(t('create.tips.contentItems') as unknown as string[]).map(
                    (item: string, index: number) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
