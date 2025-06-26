"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@lib/utils";
import { useSettingsColors } from "@lib/hooks/use-settings-colors";
import { Profile as DatabaseProfile } from "@lib/types/database";
import { Profile as ExtendedProfile } from "@lib/hooks/use-profile";
import { updateUserProfile } from "@lib/db/profiles";
import { updateProfileCache } from "@lib/hooks/use-profile";
import { User, Mail, AtSign, Calendar, Check, AlertCircle, Building2 } from "lucide-react";
import { useTranslations } from 'next-intl';

// --- BEGIN COMMENT ---
// 个人资料表单组件
// 用于在设置页面中编辑用户个人资料
// 支持SSO模式下的字段限制
// --- END COMMENT ---
interface ProfileFormProps {
  profile: DatabaseProfile &
  ExtendedProfile & {
    auth_last_sign_in_at?: string;
  };
  onSuccess?: () => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const { colors, isDark } = useSettingsColors();
  const t = useTranslations('pages.settings.profileSettings');
  
  // --- BEGIN COMMENT ---
  // 检查是否为SSO单点登录模式
  // 在SSO模式下，限制某些字段的编辑
  // --- END COMMENT ---
  const isSSOOnlyMode = process.env.NEXT_PUBLIC_SSO_ONLY_MODE === 'true';
  
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    username: profile.username || "",
    avatar_url: profile.avatar_url || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    
    setFormData((prev) => ({
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
        updateData.avatar_url = formData.avatar_url;
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
          organization: profile.organization,
          organization_role: profile.organization_role,
          department: profile.department,
          job_title: profile.job_title,
          auth_last_sign_in_at: profile.auth_last_sign_in_at
        };
        updateProfileCache(extendedProfile, profile.id);

        setMessage({
          type: "success",
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
        type: "error",
        text: error.message || t('updateFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 格式化日期显示
  // 根据当前语言环境动态选择本地化格式
  // --- END COMMENT ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('status.notRecorded');
    const date = new Date(dateString);
    
    // 根据当前语言环境选择合适的本地化格式
    const locale = typeof window !== 'undefined' 
      ? (document.cookie.includes('NEXT_LOCALE=en-US') ? 'en-US' : 'zh-CN')
      : 'zh-CN';
    
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 消息提示 */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-lg mb-6 flex items-center",
            message.type === "success"
              ? isDark
                ? "bg-green-900/20 text-green-300 border border-green-800"
                : "bg-green-50 text-green-700 border border-green-200"
              : isDark
                ? "bg-red-900/20 text-red-300 border border-red-800"
                : "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          <span className="font-serif">{message.text}</span>
        </motion.div>
      )}

      {/* 账户信息卡片 */}
      <div
        className={cn(
          "mb-8 p-4 rounded-lg border",
          colors.borderColor.tailwind,
          colors.buttonBackground.tailwind
        )}
      >
        <h3
          className={cn("text-lg font-medium mb-4 font-serif", colors.textColor.tailwind)}
        >
          {t('accountInfo')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Building2
              className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)}
            />
            <div>
              <p className={cn("text-sm font-serif", colors.secondaryTextColor.tailwind)}>
                {t('organization')}
              </p>
              <p className={cn("font-serif", colors.textColor.tailwind)}>
                {profile.organization?.name || t('status.noOrganization')}
                {/* --- BEGIN COMMENT --- */}
                {/* 显示部门信息，格式B：用户名 (部门) */}
                {/* --- END COMMENT --- */}
                {profile.department && (
                  <span className={cn("text-sm ml-2", colors.secondaryTextColor.tailwind)}>
                    ({profile.department})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar
              className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)}
            />
            <div>
              <p className={cn("text-sm font-serif", colors.secondaryTextColor.tailwind)}>
                {t('registrationTime')}
              </p>
              <p className={cn("font-serif", colors.textColor.tailwind)}>
                {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <User
              className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)}
            />
            <div>
              <p className={cn("text-sm font-serif", colors.secondaryTextColor.tailwind)}>
                {t('accountRole')}
              </p>
              <p className={cn("font-serif", colors.textColor.tailwind)}>
                {profile.role === "admin" ? t('roles.admin') : profile.role === "manager" ? t('roles.manager') : t('roles.user')}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar
              className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)}
            />
            <div>
              <p className={cn("text-sm font-serif", colors.secondaryTextColor.tailwind)}>
                {t('lastLogin')}
              </p>
              <p className={cn("font-serif", colors.textColor.tailwind)}>
                {profile.auth_last_sign_in_at
                  ? formatDate(profile.auth_last_sign_in_at)
                  : t('status.notRecorded')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 个人资料表单 */}
      <div className="space-y-6">
        <h3 className={cn("text-lg font-medium font-serif", colors.textColor.tailwind)}>
          {isSSOOnlyMode ? t('title') : t('editProfile')}
        </h3>

        {/* 姓名字段 */}
        <div className="space-y-2">
          <label
            htmlFor="full_name"
            className={cn(
              "block text-sm font-medium font-serif",
              colors.textColor.tailwind
            )}
          >
            {t('name')}
          </label>
          {isSSOOnlyMode ? (
            // --- BEGIN COMMENT ---
            // SSO模式下：展示模式，不可编辑
            // 使用优雅的展示样式
            // --- END COMMENT ---
            <div
              className={cn(
                "flex items-center",
                "w-full px-4 py-3 rounded-lg",
                "border",
                colors.borderColor.tailwind,
                isDark ? "bg-gray-800/50" : "bg-gray-50/50"
              )}
            >
              <User
                className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)}
              />
              <span className={cn("font-serif", colors.textColor.tailwind)}>
                {profile.full_name || t('status.notSet')}
              </span>
            </div>
          ) : (
            // --- BEGIN COMMENT ---
            // 普通模式下：可编辑输入框
            // --- END COMMENT ---
            <div
              className={cn(
                "flex items-center",
                "w-full px-4 py-2 rounded-lg",
                "transition-all duration-200",
                "border",
                colors.buttonBackground.tailwind,
                colors.buttonBorder.tailwind
              )}
            >
              <User
                className={cn("w-5 h-5 mr-2", colors.secondaryTextColor.tailwind)}
              />
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className={cn(
                  "w-full bg-transparent",
                  "outline-none",
                  colors.textColor.tailwind
                )}
                placeholder={t('namePlaceholder')}
              />
            </div>
          )}
        </div>

        {/* 用户名字段 */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className={cn(
              "block text-sm font-medium font-serif",
              colors.textColor.tailwind
            )}
          >
            {t('nickname')}
          </label>
          <div
            className={cn(
              "flex items-center",
              "w-full px-4 py-2 rounded-lg",
              "transition-all duration-200",
              "border",
              colors.buttonBackground.tailwind,
              colors.buttonBorder.tailwind
            )}
          >
            <AtSign
              className={cn("w-5 h-5 mr-2", colors.secondaryTextColor.tailwind)}
            />
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={cn(
                "w-full bg-transparent",
                "outline-none",
                colors.textColor.tailwind
              )}
              placeholder={t('usernamePlaceholder')}
            />
          </div>
        </div>

        {/* 头像URL字段 - 仅在非SSO模式下显示 */}
        {!isSSOOnlyMode && (
          <div className="space-y-2">
            <label
              htmlFor="avatar_url"
              className={cn(
                "block text-sm font-medium font-serif",
                colors.textColor.tailwind
              )}
            >
              {t('avatarUrl')}
            </label>
            <div
              className={cn(
                "flex items-center",
                "w-full px-4 py-2 rounded-lg",
                "transition-all duration-200",
                "border",
                colors.buttonBackground.tailwind,
                colors.buttonBorder.tailwind
              )}
            >
              <input
                id="avatar_url"
                name="avatar_url"
                type="text"
                value={formData.avatar_url}
                onChange={handleChange}
                className={cn(
                  "w-full bg-transparent",
                  "outline-none",
                  colors.textColor.tailwind
                )}
                placeholder={t('avatarPlaceholder')}
              />
            </div>
            <p className={cn("text-xs font-serif", colors.secondaryTextColor.tailwind)}>
              {t('avatarHint')}
            </p>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full px-4 py-3 rounded-lg",
            "transition-all duration-200",
            "mt-8",
            "cursor-pointer",
            colors.primaryButtonBackground.tailwind,
            colors.primaryButtonText.tailwind,
            colors.primaryButtonHover.tailwind,
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? t('saving') : t('saveChanges')}
        </button>
      </div>
    </form>
  );
}
