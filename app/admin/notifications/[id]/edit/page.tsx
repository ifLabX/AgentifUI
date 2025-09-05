'use client';

import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { useNotificationStore } from '@lib/stores/ui/notification-store';
import type { NotificationCategory } from '@lib/types/notification-center';
import { cn } from '@lib/utils';
import { ArrowLeft, Eye, Save, Send, Trash } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface NotificationForm {
  id: string;
  type: 'changelog' | 'message';
  category: NotificationCategory;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_roles: string[];
  target_users: string[];
  scheduled_time?: string;
  published: boolean;
  published_at: string | null;
}

// These constants will be replaced with translation functions in the component

export default function EditNotificationPage() {
  const params = useParams();
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('pages.admin.notifications');
  const { showNotification } = useNotificationStore();

  const [form, setForm] = useState<NotificationForm | null>(null);
  const [originalForm, setOriginalForm] = useState<NotificationForm | null>(
    null
  );
  const [loading, setLoading] = useState(true);
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
    { value: 'user', label: t('edit.targeting.roles.user') },
    { value: 'admin', label: t('edit.targeting.roles.admin') },
    { value: 'developer', label: t('edit.targeting.roles.developer') },
    { value: 'tester', label: t('edit.targeting.roles.tester') },
  ];

  // Load notification data
  useEffect(() => {
    const loadNotification = async () => {
      try {
        const response = await fetch(`/api/admin/notifications/${params.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch notification');
        }

        const notification = await response.json();

        const formData: NotificationForm = {
          id: notification.id,
          type: notification.type,
          category: notification.category,
          title: notification.title,
          content: notification.content,
          priority: notification.priority,
          target_roles: notification.target_roles || [],
          target_users: notification.target_users || [],
          scheduled_time: '', // Scheduled time is not currently supported
          published: notification.published,
          published_at: notification.published_at,
        };

        setForm(formData);
        setOriginalForm(formData);
      } catch (error) {
        console.error('Failed to load notification:', error);
        router.push('/admin/notifications');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadNotification();
    }
  }, [params.id, router]);

  const handleFieldChange = (
    field: keyof NotificationForm,
    value: string | string[] | boolean
  ) => {
    if (!form) return;
    setForm(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleRoleToggle = (role: string) => {
    if (!form) return;
    setForm(prev =>
      prev
        ? {
            ...prev,
            target_roles: prev.target_roles.includes(role)
              ? prev.target_roles.filter(r => r !== role)
              : [...prev.target_roles, role],
          }
        : null
    );
  };

  const insertVariable = (variable: string) => {
    if (!form || !contentRef.current) return;

    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const newContent =
      form.content.substring(0, start) +
      `{${variable}}` +
      form.content.substring(end);

    setForm(prev => (prev ? { ...prev, content: newContent } : null));

    // Restore cursor position
    setTimeout(() => {
      if (contentRef.current) {
        const newPosition = start + variable.length + 2;
        contentRef.current.setSelectionRange(newPosition, newPosition);
        contentRef.current.focus();
      }
    }, 0);
  };

  const handleSave = async (publish?: boolean) => {
    if (!form || !isFormValid) return;

    setSaving(true);
    try {
      const updateData = {
        type: form.type,
        category: form.category,
        title: form.title,
        content: form.content,
        priority: form.priority,
        target_roles: form.target_roles,
        target_users: form.target_users,
        published: publish !== undefined ? publish : form.published,
      };

      const response = await fetch(`/api/admin/notifications/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save notification');
      }

      const updatedNotification = await response.json();

      // Update form state with server response
      const updatedForm: NotificationForm = {
        ...form,
        ...updatedNotification,
      };

      setOriginalForm(updatedForm);
      setForm(updatedForm);

      // Show success notification and redirect
      showNotification(t('edit.messages.saveSuccess'), 'success', 3000);
      router.push('/admin/notifications');
    } catch (error) {
      console.error('Failed to save notification:', error);
      showNotification(
        `${t('edit.messages.saveFailed')}: ${error instanceof Error ? error.message : t('common.ui.error')}`,
        'error',
        5000
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form) return;

    if (window.confirm(t('edit.messages.deleteConfirm'))) {
      try {
        const response = await fetch(`/api/admin/notifications/${form.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete notification');
        }

        showNotification(t('edit.messages.deleteSuccess'), 'success', 3000);
        router.push('/admin/notifications');
      } catch (error) {
        console.error('Failed to delete notification:', error);
        showNotification(
          `${t('edit.messages.deleteFailed')}: ${error instanceof Error ? error.message : t('common.ui.error')}`,
          'error',
          5000
        );
      }
    }
  };

  const hasChanges =
    form &&
    originalForm &&
    JSON.stringify(form) !== JSON.stringify(originalForm);
  const isFormValid =
    form &&
    form.title.trim() &&
    form.content.trim() &&
    form.target_roles.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-stone-600"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-stone-900 dark:text-gray-100">
            {t('edit.notFound.title')}
          </h2>
          <p className="mb-4 text-stone-600 dark:text-stone-400">
            {t('edit.notFound.description')}
          </p>
          <Link href="/admin/notifications">
            <Button>{t('edit.notFound.backButton')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/notifications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('edit.backButton')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-gray-100">
              {t('edit.title')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('edit.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            <Eye className="mr-2 h-4 w-4" />
            {preview ? t('edit.editButton') : t('edit.previewButton')}
          </Button>

          {form.published ? (
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {t('edit.unpublishButton')}
            </Button>
          ) : (
            <Button
              onClick={() => handleSave(true)}
              disabled={!isFormValid || saving}
            >
              <Send className="mr-2 h-4 w-4" />
              {t('edit.publishButton')}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => handleSave()}
            disabled={!hasChanges || !isFormValid || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('edit.savingButton') : t('edit.saveButton')}
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash className="mr-2 h-4 w-4" />
            {t('edit.deleteButton')}
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {form.published && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                {t('edit.status.published.title')}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('edit.status.published.description', {
                  time: new Date(form.published_at!).toLocaleString(),
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasChanges && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('edit.status.unsavedChanges.title')}
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {t('edit.status.unsavedChanges.description')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {!preview ? (
            <>
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('edit.basicInfo.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t('edit.basicInfo.type.label')} *
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
                        'location',
                        'device',
                        'ip',
                        'agentName',
                        'duration',
                        'result',
                        'percentage',
                        'currentUsage',
                        'limit',
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
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        form.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      )}
                    >
                      {form.published
                        ? t('edit.statistics.published')
                        : t('edit.statistics.draft')}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-medium text-stone-900 dark:text-gray-100">
                    {form.title}
                  </h3>

                  <div className="text-sm whitespace-pre-wrap text-stone-600 dark:text-stone-400">
                    {form.content}
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
                    {form.published_at && (
                      <div className="mt-1 text-xs text-stone-500">
                        {t('create.preview.publishTime')}:{' '}
                        {new Date(form.published_at).toLocaleString()}
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
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('edit.statistics.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">
                  {t('edit.statistics.status')}:
                </span>
                <span
                  className={cn(
                    'font-medium',
                    form.published
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  )}
                >
                  {form.published
                    ? t('edit.statistics.published')
                    : t('edit.statistics.draft')}
                </span>
              </div>
              {form.published_at && (
                <div className="flex justify-between">
                  <span className="text-stone-600 dark:text-stone-400">
                    {t('edit.statistics.publishTime')}:
                  </span>
                  <span>
                    {new Date(form.published_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">
                  {t('edit.statistics.targetUsers')}:
                </span>
                <span>{form.target_roles.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600 dark:text-stone-400">
                  {t('edit.statistics.priority')}:
                </span>
                <span>{PRIORITY_OPTIONS[form.priority].label}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>{t('edit.tips.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <div>
                <strong>{t('edit.tips.notice')}：</strong>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {(t('edit.tips.items') as unknown as string[]).map(
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
