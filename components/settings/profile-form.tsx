'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@lib/utils';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { Profile } from '@lib/types/database';
import { updateUserProfile } from '@lib/db/profiles';
import { User, Mail, AtSign, Calendar, Check, AlertCircle } from 'lucide-react';

// --- BEGIN COMMENT ---
// 个人资料表单组件
// 用于在设置页面中编辑用户个人资料
// --- END COMMENT ---
interface ProfileFormProps {
  profile: Profile;
  onSuccess?: () => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const { colors } = useSettingsColors();
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
    avatar_url: profile.avatar_url || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- BEGIN COMMENT ---
  // 处理表单字段变更
  // --- END COMMENT ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- BEGIN COMMENT ---
  // 处理表单提交
  // --- END COMMENT ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setMessage(null);
      
      // 更新用户资料
      const updatedProfile = await updateUserProfile(profile.id, {
        full_name: formData.full_name,
        username: formData.username,
        avatar_url: formData.avatar_url,
      });
      
      if (!updatedProfile) {
        throw new Error('更新资料失败');
      }
      
      setMessage({
        type: 'success',
        text: '个人资料已更新'
      });
      
      // 调用成功回调
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || '更新资料失败'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 格式化日期显示
  // --- END COMMENT ---
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
            message.type === 'success' 
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          )}
        >
          {message.type === 'success' ? 
            <Check className="w-5 h-5 mr-2 flex-shrink-0" /> : 
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          }
          <span>{message.text}</span>
        </motion.div>
      )}
      
      {/* 账户信息卡片 */}
      <div className={cn(
        "mb-8 p-4 rounded-lg border",
        colors.borderColor.tailwind,
        colors.buttonBackground.tailwind
      )}>
        <h3 className={cn(
          "text-lg font-medium mb-4",
          colors.textColor.tailwind
        )}>账户信息</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Mail className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)} />
            <div>
              <p className={cn("text-sm", colors.secondaryTextColor.tailwind)}>账户ID</p>
              <p className={colors.textColor.tailwind}>{profile.id.substring(0, 8)}...</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)} />
            <div>
              <p className={cn("text-sm", colors.secondaryTextColor.tailwind)}>注册时间</p>
              <p className={colors.textColor.tailwind}>{formatDate(profile.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <User className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)} />
            <div>
              <p className={cn("text-sm", colors.secondaryTextColor.tailwind)}>账户角色</p>
              <p className={colors.textColor.tailwind}>{profile.role === 'admin' ? '管理员' : '普通用户'}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className={cn("w-5 h-5 mr-3", colors.secondaryTextColor.tailwind)} />
            <div>
              <p className={cn("text-sm", colors.secondaryTextColor.tailwind)}>上次登录</p>
              <p className={colors.textColor.tailwind}>{profile.last_login ? formatDate(profile.last_login) : '未记录'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 个人资料表单 */}
      <div className="space-y-6">
        <h3 className={cn(
          "text-lg font-medium",
          colors.textColor.tailwind
        )}>编辑个人资料</h3>
        
        {/* 姓名字段 */}
        <div className="space-y-2">
          <label 
            htmlFor="full_name" 
            className={cn(
              "block text-sm font-medium",
              colors.textColor.tailwind
            )}
          >
            姓名
          </label>
          <div className={cn(
            "flex items-center",
            "w-full px-4 py-2 rounded-lg",
            "transition-all duration-200",
            "border",
            colors.buttonBackground.tailwind,
            colors.buttonBorder.tailwind,
          )}>
            <User className={cn("w-5 h-5 mr-2", colors.secondaryTextColor.tailwind)} />
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              className={cn(
                "w-full bg-transparent",
                "outline-none",
                colors.textColor.tailwind,
              )}
              placeholder="请输入您的姓名"
            />
          </div>
        </div>
        
        {/* 用户名字段 */}
        <div className="space-y-2">
          <label 
            htmlFor="username" 
            className={cn(
              "block text-sm font-medium",
              colors.textColor.tailwind
            )}
          >
            用户名
          </label>
          <div className={cn(
            "flex items-center",
            "w-full px-4 py-2 rounded-lg",
            "transition-all duration-200",
            "border",
            colors.buttonBackground.tailwind,
            colors.buttonBorder.tailwind,
          )}>
            <AtSign className={cn("w-5 h-5 mr-2", colors.secondaryTextColor.tailwind)} />
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={cn(
                "w-full bg-transparent",
                "outline-none",
                colors.textColor.tailwind,
              )}
              placeholder="请输入您的用户名"
            />
          </div>
        </div>
        
        {/* 头像URL字段 */}
        <div className="space-y-2">
          <label 
            htmlFor="avatar_url" 
            className={cn(
              "block text-sm font-medium",
              colors.textColor.tailwind
            )}
          >
            头像URL
          </label>
          <div className={cn(
            "flex items-center",
            "w-full px-4 py-2 rounded-lg",
            "transition-all duration-200",
            "border",
            colors.buttonBackground.tailwind,
            colors.buttonBorder.tailwind,
          )}>
            <input
              id="avatar_url"
              name="avatar_url"
              type="text"
              value={formData.avatar_url}
              onChange={handleChange}
              className={cn(
                "w-full bg-transparent",
                "outline-none",
                colors.textColor.tailwind,
              )}
              placeholder="请输入头像图片URL"
            />
          </div>
          <p className={cn("text-xs", colors.secondaryTextColor.tailwind)}>输入有效的图片URL，建议使用正方形图片</p>
        </div>
        
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
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isSubmitting ? '保存中...' : '保存修改'}
        </button>
      </div>
    </form>
  );
}
