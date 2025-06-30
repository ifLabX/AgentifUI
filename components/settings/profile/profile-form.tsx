'use client';

import { updateUserProfile } from '@lib/db/profiles';
import { Profile as ExtendedProfile } from '@lib/hooks/use-profile';
import { updateProfileCache } from '@lib/hooks/use-profile';
import { useProfile } from '@lib/hooks/use-profile';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { Profile as DatabaseProfile } from '@lib/types/database';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AtSign,
  Building2,
  Calendar,
  Camera,
  Check,
  Edit3,
  User,
  UserCircle,
} from 'lucide-react';

import { useCallback, useState } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import { AvatarModal } from './avatar-modal';

// --- BEGIN COMMENT ---
// 个人资料表单组件
// 采用紧凑现代化设计，优化UI布局和视觉效果
// 支持SSO模式下的字段限制
// --- END COMMENT ---
interface ProfileFormProps {
  profile: DatabaseProfile &
    ExtendedProfile & {
      auth_last_sign_in_at?: string;
    };
  onSuccess?: () => void;
}

// --- BEGIN COMMENT ---
// 生成用户头像的首字母
// --- END COMMENT ---
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// --- BEGIN COMMENT ---
// 根据用户名生成一致的石色系背景颜色
// --- END COMMENT ---
const getAvatarBgColor = (name: string) => {
  const colors = [
    '#78716c', // stone-500
    '#57534e', // stone-600
    '#44403c', // stone-700
    '#64748b', // slate-500
    '#475569', // slate-600
    '#6b7280', // gray-500
    '#4b5563', // gray-600
    '#737373', // neutral-500
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const { colors, isDark } = useSettingsColors();
  const t = useTranslations('pages.settings.profileSettings');
  const format = useFormatter();
  const { mutate: refreshProfile } = useProfile(); // 添加刷新profile的功能

  // --- BEGIN COMMENT ---
  // 检查是否为SSO单点登录模式
  // 在SSO模式下，限制某些字段的编辑
  // --- END COMMENT ---
  const isSSOOnlyMode = process.env.NEXT_PUBLIC_SSO_ONLY_MODE === 'true';

  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // --- BEGIN COMMENT ---
  // 处理头像更新
  // --- END COMMENT ---
  const handleAvatarUpdate = useCallback(
    async (avatarUrl: string | null) => {
      setMessage({
        type: 'success',
        text: avatarUrl ? t('avatar.uploadSuccess') : t('avatar.deleteSuccess'),
      });

      // 刷新profile数据，让所有使用useProfile的组件都能看到最新的头像
      try {
        await refreshProfile();
      } catch (error) {
        console.error('Profile refresh failed:', error);
      }

      // 调用成功回调，通知父组件
      if (onSuccess) {
        onSuccess();
      }
    },
    [t, refreshProfile, onSuccess]
  );

  // --- BEGIN COMMENT ---
  // 处理表单字段变更
  // 在SSO模式下阻止full_name字段的修改
  // --- END COMMENT ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // SSO模式下不允许修改姓名字段
    if (isSSOOnlyMode && name === 'full_name') {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- BEGIN COMMENT ---
  // 处理表单提交
  // 根据SSO模式调整提交的数据
  // --- END COMMENT ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage(null);

      // --- BEGIN COMMENT ---
      // 根据SSO模式构建更新数据
      // SSO模式下不更新姓名和头像URL
      // --- END COMMENT ---
      const updateData: any = {
        username: formData.username,
      };

      if (!isSSOOnlyMode) {
        updateData.full_name = formData.full_name;
      }

      // 更新用户资料
      const result = await updateUserProfile(profile.id, updateData);

      if (result.success && result.data) {
        // --- BEGIN COMMENT ---
        // 更新localStorage缓存，确保在其他页面能立即看到最新数据
        // 需要类型转换以匹配ExtendedProfile接口
        // --- END COMMENT ---
        const extendedProfile: ExtendedProfile = {
          ...result.data,
          full_name: result.data.full_name || null,
          username: result.data.username || null,
          avatar_url: result.data.avatar_url || null,
          // 移除组织相关字段
          auth_last_sign_in_at: profile.auth_last_sign_in_at,
        };
        updateProfileCache(extendedProfile, profile.id);

        setMessage({
          type: 'success',
          text: t('profileUpdated'),
        });

        // 调用成功回调
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.error?.message || t('updateFailed'));
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || t('updateFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 格式化日期显示
  // 使用next-intl的useFormatter钩子，实现真正的国际化日期格式化
  // 自动根据当前语言环境选择合适的格式，无需硬编码
  // --- END COMMENT ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('status.notRecorded');

    try {
      const date = new Date(dateString);
      // 使用next-intl的dateTime格式化，会根据当前locale自动选择合适的格式
      return format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return t('status.notRecorded');
    }
  };

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center rounded-lg p-3',
            message.type === 'success'
              ? isDark
                ? 'border border-green-800 bg-green-900/20 text-green-300'
                : 'border border-green-200 bg-green-50 text-green-700'
              : isDark
                ? 'border border-red-800 bg-red-900/20 text-red-300'
                : 'border border-red-200 bg-red-50 text-red-700'
          )}
        >
          {message.type === 'success' ? (
            <Check className="mr-2 h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
          )}
          <span className="font-serif text-sm">{message.text}</span>
        </motion.div>
      )}

      {/* 用户头像和基本信息 - 紧凑布局 */}
      <div
        className={cn(
          'rounded-lg border p-4',
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind
        )}
      >
        <div className="flex items-center space-x-4">
          {/* 用户头像 - 缩小尺寸 */}
          <div className="relative">
            {profile.avatar_url ? (
              <div
                className="group relative cursor-pointer"
                onClick={() => setShowAvatarModal(true)}
              >
                <img
                  src={profile.avatar_url}
                  alt={t('avatar.userAvatar', {
                    userName:
                      profile.full_name ||
                      profile.username ||
                      t('avatar.defaultUser'),
                  })}
                  className="h-16 w-16 rounded-full object-cover transition-all duration-300 group-hover:opacity-80"
                  onError={e => {
                    // 头像加载失败时隐藏图片
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* 悬停时显示编辑提示文字 */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">
                    {t('avatar.editHover')}
                  </span>
                </div>
                {/* 右下角编辑指示器 */}
                <div
                  className={cn(
                    'absolute right-0 bottom-0 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm transition-all duration-300 group-hover:scale-105',
                    isDark
                      ? 'border-stone-700 bg-stone-600 text-stone-200 group-hover:bg-stone-500'
                      : 'border-white bg-stone-200 text-stone-600 group-hover:bg-stone-300'
                  )}
                >
                  <Camera className="h-2.5 w-2.5" />
                </div>
              </div>
            ) : (
              <div
                className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full text-lg font-medium text-white transition-all duration-300"
                style={{
                  backgroundColor: getAvatarBgColor(
                    profile.full_name ||
                      profile.username ||
                      t('avatar.defaultUser')
                  ),
                }}
                onClick={() => setShowAvatarModal(true)}
              >
                {getInitials(
                  profile.full_name ||
                    profile.username ||
                    t('avatar.defaultUser')
                )}
                {/* 悬停时显示编辑提示文字 */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">
                    {t('avatar.editHover')}
                  </span>
                </div>
                {/* 右下角编辑指示器 */}
                <div
                  className={cn(
                    'absolute right-0 bottom-0 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm transition-all duration-300 group-hover:scale-105',
                    isDark
                      ? 'border-stone-700 bg-stone-600 text-stone-200 group-hover:bg-stone-500'
                      : 'border-white bg-stone-200 text-stone-600 group-hover:bg-stone-300'
                  )}
                >
                  <Camera className="h-2.5 w-2.5" />
                </div>
              </div>
            )}
          </div>

          {/* 用户基本信息 - 简化布局 */}
          <div className="flex-1">
            <h3
              className={cn(
                'mb-1 font-serif text-lg font-medium',
                colors.textColor.tailwind
              )}
            >
              {profile.full_name || profile.username || t('status.notSet')}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span
                className={cn('font-serif', colors.secondaryTextColor.tailwind)}
              >
                {profile.role === 'admin'
                  ? t('roles.admin')
                  : profile.role === 'manager'
                    ? t('roles.manager')
                    : t('roles.user')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 账户信息 - 紧凑网格布局 */}
      <div
        className={cn(
          'rounded-lg border p-4',
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind
        )}
      >
        <h3
          className={cn(
            'mb-3 font-serif text-base font-medium',
            colors.textColor.tailwind
          )}
        >
          {t('accountInfo')}
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center space-x-2">
            <Calendar
              className={cn('h-4 w-4', colors.secondaryTextColor.tailwind)}
            />
            <div>
              <p
                className={cn(
                  'font-serif text-xs',
                  colors.secondaryTextColor.tailwind
                )}
              >
                {t('registrationTime')}
              </p>
              <p
                className={cn('font-serif text-sm', colors.textColor.tailwind)}
              >
                {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar
              className={cn('h-4 w-4', colors.secondaryTextColor.tailwind)}
            />
            <div>
              <p
                className={cn(
                  'font-serif text-xs',
                  colors.secondaryTextColor.tailwind
                )}
              >
                {t('lastLogin')}
              </p>
              <p
                className={cn('font-serif text-sm', colors.textColor.tailwind)}
              >
                {profile.auth_last_sign_in_at
                  ? formatDate(profile.auth_last_sign_in_at)
                  : t('status.notRecorded')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑个人资料 - 简化表单 */}
      <div
        className={cn(
          'rounded-lg border p-4',
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind
        )}
      >
        <div className="mb-4 flex items-center">
          <Edit3
            className={cn('mr-2 h-4 w-4', colors.secondaryTextColor.tailwind)}
          />
          <h3
            className={cn(
              'font-serif text-base font-medium',
              colors.textColor.tailwind
            )}
          >
            {isSSOOnlyMode ? t('title') : t('editProfile')}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 姓名字段 */}
          <div className="space-y-1">
            <label
              htmlFor="full_name"
              className={cn(
                'block font-serif text-sm font-medium',
                colors.textColor.tailwind
              )}
            >
              {t('name')}
            </label>
            {isSSOOnlyMode ? (
              <div
                className={cn(
                  'flex items-center space-x-2 rounded-lg border p-3',
                  colors.borderColor.tailwind,
                  isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'
                )}
              >
                <User
                  className={cn('h-4 w-4', colors.secondaryTextColor.tailwind)}
                />
                <span
                  className={cn(
                    'font-serif text-sm',
                    colors.textColor.tailwind
                  )}
                >
                  {profile.full_name || t('status.notSet')}
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  'flex items-center space-x-2 rounded-lg border p-3 transition-all duration-200',
                  colors.buttonBackground.tailwind,
                  colors.buttonBorder.tailwind,
                  'focus-within:ring-1 focus-within:ring-stone-500/30'
                )}
              >
                <User
                  className={cn('h-4 w-4', colors.secondaryTextColor.tailwind)}
                />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={cn(
                    'w-full bg-transparent font-serif text-sm outline-none',
                    colors.textColor.tailwind
                  )}
                  placeholder={t('namePlaceholder')}
                />
              </div>
            )}
          </div>

          {/* 用户名字段 */}
          <div className="space-y-1">
            <label
              htmlFor="username"
              className={cn(
                'block font-serif text-sm font-medium',
                colors.textColor.tailwind
              )}
            >
              {t('nickname')}
            </label>
            <div
              className={cn(
                'flex items-center space-x-2 rounded-lg border p-3 transition-all duration-200',
                colors.buttonBackground.tailwind,
                colors.buttonBorder.tailwind,
                'focus-within:ring-1 focus-within:ring-stone-500/30'
              )}
            >
              <AtSign
                className={cn('h-4 w-4', colors.secondaryTextColor.tailwind)}
              />
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={cn(
                  'w-full bg-transparent font-serif text-sm outline-none',
                  colors.textColor.tailwind
                )}
                placeholder={t('usernamePlaceholder')}
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-lg px-4 py-2.5 font-serif text-sm transition-all duration-200',
              colors.primaryButtonBackground.tailwind,
              colors.primaryButtonText.tailwind,
              colors.primaryButtonHover.tailwind,
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isSubmitting ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </div>

      {/* 头像模态框 */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatarUrl={profile.avatar_url}
        userName={
          profile.full_name || profile.username || t('avatar.defaultUser')
        }
        onAvatarUpdate={handleAvatarUpdate}
      />
    </div>
  );
}
