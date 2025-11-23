'use client';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import type {
  Notification,
  NotificationPriority,
  NotificationType,
} from '@lib/types/notification-center';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface NotificationFormProps {
  mode: 'create' | 'edit';
  id?: string;
}

const PRIORITIES: NotificationPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
];

const TYPES: NotificationType[] = ['changelog', 'message'];

const INITIAL_FORM_STATE = {
  type: 'message' as NotificationType,
  category: '',
  title: '',
  content: '',
  priority: 'medium' as NotificationPriority,
  published: false,
};

export function NotificationForm({ mode, id }: NotificationFormProps) {
  const t = useTranslations('pages.admin.notifications.form');
  const tActions = useTranslations('pages.admin.notifications.actions');
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      const fetchDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/notifications/${id}`);
          if (!res.ok) throw new Error('Failed to load notification');
          const data: Notification = await res.json();
          setForm({
            type: data.type,
            category: data.category || '',
            title: data.title,
            content: data.content,
            priority: data.priority,
            published: data.published,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
          setIsLoading(false);
        }
      };
      void fetchDetail();
    }
  }, [mode, id]);

  const handleChange = (
    key: keyof typeof form,
    value: string | boolean | NotificationType | NotificationPriority
  ) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to create notification');
        }
        setSuccess('Created successfully');
        setForm(INITIAL_FORM_STATE);
      } else if (mode === 'edit' && id) {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to update notification');
        }
        setSuccess('Updated successfully');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {mode === 'create' ? t('title.new') : t('title.edit')}
          </h1>
          <p className="text-sm text-stone-500">
            {mode === 'create' ? t('subtitle.new') : t('subtitle.edit')}
          </p>
        </div>
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('type.label')}</label>
            <Select
              value={form.type}
              onValueChange={value =>
                handleChange('type', value as NotificationType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('type.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('category.label')}</label>
            <Input
              placeholder={t('category.placeholder')}
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('priority.label')}</label>
            <Select
              value={form.priority}
              onValueChange={value =>
                handleChange('priority', value as NotificationPriority)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('priority.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('published.label')}
            </label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-stone-200 px-3 dark:border-stone-700">
              <Switch
                checked={form.published}
                onCheckedChange={checked => handleChange('published', checked)}
              />
              <span className="text-sm text-stone-600 dark:text-stone-300">
                {form.published ? t('published.on') : t('published.off')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('titleField.label')}</label>
          <Input
            placeholder={t('titleField.placeholder')}
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('content.label')}</label>
          <Textarea
            placeholder={t('content.placeholder')}
            value={form.content}
            onChange={e => handleChange('content', e.target.value)}
            required
            className="min-h-[160px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => history.back()}
            disabled={isLoading}
          >
            {tActions('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {mode === 'create' ? tActions('create') : tActions('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
