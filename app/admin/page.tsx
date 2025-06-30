'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ArrowRight, Bell, Building2, Key, Users } from 'lucide-react';

import React from 'react';

import Link from 'next/link';

interface AdminCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function AdminCard({ title, description, icon: Icon, href }: AdminCardProps) {
  const { isDark } = useTheme();

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xl border p-6 transition-all duration-200 hover:shadow-lg',
        isDark
          ? 'hover:bg-stone-750 border-stone-700 bg-stone-800 hover:border-stone-600'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-stone-200/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                isDark ? 'bg-stone-700' : 'bg-stone-100'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isDark ? 'text-stone-300' : 'text-stone-600'
                )}
              />
            </div>
            <h3
              className={cn(
                'text-lg font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              {title}
            </h3>
          </div>

          <p
            className={cn(
              'text-sm leading-relaxed',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {description}
          </p>
        </div>

        <ArrowRight
          className={cn(
            'h-5 w-5 transition-transform group-hover:translate-x-1',
            isDark ? 'text-stone-400' : 'text-stone-400'
          )}
        />
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const { isDark } = useTheme();

  // --- BEGIN COMMENT ---
  // 管理功能卡片配置
  // --- END COMMENT ---
  const adminCards: AdminCardProps[] = [
    {
      title: 'API 配置',
      description: '管理应用实例、配置参数和API密钥，确保系统正常运行',
      icon: Key,
      href: '/admin/api-config',
    },
    {
      title: '关于与通知',
      description: '管理About页面内容和系统通知推送，提升用户体验',
      icon: Bell,
      href: '/admin/content',
    },
    {
      title: '用户管理',
      description: '管理用户账户、权限和访问控制，维护系统安全',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: '群组管理',
      description: '管理用户和群组，配置群组应用权限',
      icon: Building2,
      href: '/admin/groups',
    },
  ];

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl p-6">
        {/* --- BEGIN COMMENT ---
        页面标题和描述 - 左对齐布局，符合项目风格
        --- END COMMENT --- */}
        <div className="mb-8">
          <h1
            className={cn(
              'mb-3 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent',
              isDark
                ? 'from-stone-100 to-stone-300'
                : 'from-stone-800 to-stone-600'
            )}
          >
            管理后台概览
          </h1>
          <p
            className={cn(
              'text-base',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            欢迎使用 AgentifUI 管理后台，在这里您可以管理系统的各项配置和设置
          </p>
        </div>

        {/* --- BEGIN COMMENT ---
        管理功能卡片网格 - 优化布局和间距
        --- END COMMENT --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {adminCards.map(card => (
            <AdminCard
              key={card.href}
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={card.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
