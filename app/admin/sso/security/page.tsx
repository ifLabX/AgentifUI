'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Key,
  Lock,
  Settings,
  Shield,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

// --- BEGIN COMMENT ---
// 安全配置数据类型定义
// --- END COMMENT ---
interface SecurityConfig {
  session: {
    timeout: number;
    maxConcurrent: number;
    refreshThreshold: number;
  };
  encryption: {
    algorithm: string;
    keyRotation: boolean;
    lastRotation: string;
  };
  audit: {
    enabled: boolean;
    retention: number;
    events: string[];
  };
  protection: {
    bruteForce: boolean;
    rateLimiting: boolean;
    ipWhitelist: string[];
  };
}

// --- BEGIN COMMENT ---
// SSO安全设置页面主组件
// --- END COMMENT ---
export default function SSOSecurityPage() {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- BEGIN COMMENT ---
  // 加载安全配置
  // --- END COMMENT ---
  const loadSecurityConfig = async () => {
    try {
      setLoading(true);
      // 模拟API调用，实际应调用真实接口
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 示例配置数据
      const mockConfig: SecurityConfig = {
        session: {
          timeout: 3600,
          maxConcurrent: 5,
          refreshThreshold: 300,
        },
        encryption: {
          algorithm: 'AES-256-GCM',
          keyRotation: true,
          lastRotation: '2025-01-01T00:00:00Z',
        },
        audit: {
          enabled: true,
          retention: 90,
          events: ['login', 'logout', 'config_change', 'error'],
        },
        protection: {
          bruteForce: true,
          rateLimiting: true,
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
        },
      };

      setConfig(mockConfig);
    } catch (error) {
      console.error('加载安全配置错误:', error);
      toast.error('无法加载安全配置');
    } finally {
      setLoading(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 保存安全配置
  // --- END COMMENT ---
  const saveSecurityConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('安全配置已保存');
    } catch (error) {
      console.error('保存安全配置错误:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadSecurityConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div
            className={cn(
              'rounded-xl border p-12 text-center',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p
              className={cn(
                'text-lg',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              正在加载安全配置...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题和导航 */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Link
              href="/admin/sso"
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                isDark
                  ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-300'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              返回 SSO 管理
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1
                className={cn(
                  'text-3xl font-bold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                安全设置
              </h1>
              <p
                className={cn(
                  'mt-2 text-lg',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                配置SSO安全策略和权限控制设置
              </p>
            </div>

            <button
              onClick={saveSecurityConfig}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              )}
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                <Settings className="h-4 w-4" />
              )}
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>

        {/* 开发中提示 */}
        <div
          className={cn(
            'mb-8 rounded-xl border p-12 text-center',
            isDark
              ? 'border-yellow-700 bg-yellow-900/20'
              : 'border-yellow-200 bg-yellow-50'
          )}
        >
          <AlertTriangle
            className={cn('mx-auto mb-4 h-16 w-16', 'text-yellow-500')}
          />
          <h3
            className={cn(
              'mb-2 text-lg font-semibold',
              isDark ? 'text-yellow-300' : 'text-yellow-700'
            )}
          >
            功能开发中
          </h3>
          <p
            className={cn(
              'mb-6',
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            )}
          >
            SSO安全设置功能正在开发中，敬请期待！
          </p>
          <div className="mx-auto max-w-2xl text-left">
            <h4
              className={cn(
                'mb-3 font-medium',
                isDark ? 'text-yellow-300' : 'text-yellow-700'
              )}
            >
              计划功能：
            </h4>
            <ul
              className={cn(
                'space-y-2 text-sm',
                isDark ? 'text-yellow-400' : 'text-yellow-600'
              )}
            >
              <li>• 会话安全策略配置（超时时间、并发会话控制）</li>
              <li>• 数据加密设置（加密算法、密钥轮换）</li>
              <li>• 审计日志配置（事件记录、日志保留策略）</li>
              <li>• 安全防护设置（暴力破解防护、IP白名单）</li>
              <li>• 权限策略管理（角色权限、资源访问控制）</li>
              <li>• 安全监控和告警（异常检测、实时告警）</li>
            </ul>
          </div>
        </div>

        {/* 安全状态概览 */}
        <div
          className={cn(
            'rounded-xl border p-6',
            isDark
              ? 'border-stone-700 bg-stone-800'
              : 'border-stone-200 bg-white'
          )}
        >
          <h3
            className={cn(
              'mb-4 text-lg font-semibold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            当前安全状态
          </h3>

          <div className="grid gap-4 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div
                  className={cn(
                    'text-lg font-bold',
                    isDark ? 'text-green-400' : 'text-green-600'
                  )}
                >
                  正常
                </div>
              </div>
              <div
                className={cn(
                  'text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                系统安全状态
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div
                  className={cn(
                    'text-lg font-bold',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )}
                >
                  已启用
                </div>
              </div>
              <div
                className={cn(
                  'text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                基础安全防护
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Key className="h-5 w-5 text-purple-500" />
                <div
                  className={cn(
                    'text-lg font-bold',
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  )}
                >
                  AES-256
                </div>
              </div>
              <div
                className={cn(
                  'text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                数据加密算法
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div
                  className={cn(
                    'text-lg font-bold',
                    isDark ? 'text-orange-400' : 'text-orange-600'
                  )}
                >
                  60分钟
                </div>
              </div>
              <div
                className={cn(
                  'text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                默认会话超时
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
