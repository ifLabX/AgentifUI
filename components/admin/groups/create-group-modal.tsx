'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useGroupManagementStore } from '@lib/stores/group-management-store';
import { cn } from '@lib/utils';
import { Building2, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useState } from 'react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { isDark } = useTheme();
  const { createGroup, loading } = useGroupManagementStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '群组名称不能为空';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '群组名称至少需要2个字符';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '群组名称不能超过50个字符';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = '描述不能超过200个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await createGroup({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });

    if (success) {
      toast.success(`群组"${formData.name}"创建成功`);
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    if (!loading.creating) {
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className={cn(
          'absolute inset-0',
          isDark ? 'bg-black/50' : 'bg-black/30'
        )}
        onClick={handleClose}
      />

      {/* 模态框内容 */}
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl border shadow-xl',
          isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-white'
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              )}
            >
              <Building2
                className={cn(
                  'h-5 w-5',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )}
              />
            </div>
            <h2
              className={cn(
                'font-serif text-xl font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              创建群组
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading.creating}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isDark
                ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
              loading.creating && 'cursor-not-allowed opacity-50'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-4">
            {/* 群组名称 */}
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-sm font-medium',
                  isDark ? 'text-stone-200' : 'text-stone-700'
                )}
              >
                群组名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="请输入群组名称"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 font-serif text-sm transition-all duration-200',
                  'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                  errors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800'
                      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-400 focus:ring-offset-white'
                )}
              />
              {errors.name && (
                <p className="mt-1 font-serif text-xs text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            {/* 群组描述 */}
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-sm font-medium',
                  isDark ? 'text-stone-200' : 'text-stone-700'
                )}
              >
                群组描述
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="请输入群组描述（可选）"
                rows={3}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 font-serif text-sm transition-all duration-200',
                  'resize-none focus:ring-2 focus:ring-offset-2 focus:outline-none',
                  errors.description
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800'
                      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-400 focus:ring-offset-white'
                )}
              />
              {errors.description && (
                <p className="mt-1 font-serif text-xs text-red-500">
                  {errors.description}
                </p>
              )}
              <p
                className={cn(
                  'mt-1 font-serif text-xs',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              >
                {formData.description.length}/200
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading.creating}
              className={cn(
                'flex-1 rounded-lg border px-4 py-2 font-serif text-sm transition-all duration-200',
                isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50',
                loading.creating && 'cursor-not-allowed opacity-50'
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading.creating}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-serif text-sm transition-all duration-200',
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
                loading.creating && 'cursor-not-allowed opacity-50'
              )}
            >
              {loading.creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建群组'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
