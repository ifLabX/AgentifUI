'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  ArrowRight,
  CheckCircle,
  Settings,
  Shield,
  TestTube,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

// --- BEGIN COMMENT ---
// SSO管理页面卡片组件
// --- END COMMENT ---
interface SSOCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'test';
}

function SSOCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  variant = 'default',
}: SSOCardProps) {
  const { isDark } = useTheme();

  const content = (
    <div
      className={cn(
        'group block cursor-pointer rounded-xl border p-6 transition-all duration-200 hover:shadow-lg',
        variant === 'test'
          ? isDark
            ? 'border-blue-700 bg-blue-900/20 hover:border-blue-600 hover:bg-blue-800/30'
            : 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-blue-200/50'
          : isDark
            ? 'hover:bg-stone-750 border-stone-700 bg-stone-800 hover:border-stone-600'
            : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-stone-200/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                variant === 'test'
                  ? isDark
                    ? 'bg-blue-800'
                    : 'bg-blue-100'
                  : isDark
                    ? 'bg-stone-700'
                    : 'bg-stone-100'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  variant === 'test'
                    ? isDark
                      ? 'text-blue-300'
                      : 'text-blue-600'
                    : isDark
                      ? 'text-stone-300'
                      : 'text-stone-600'
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
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// --- BEGIN COMMENT ---
// 测试结果显示组件
// --- END COMMENT ---
interface TestResult {
  timestamp: string;
  tests: {
    [key: string]: {
      status: 'success' | 'error';
      data?: any;
      error?: string;
    };
  };
  overall: {
    status: 'success' | 'partial';
    totalTests: number;
    failedTests: number;
    summary: string;
  };
}

// --- BEGIN COMMENT ---
// 基础统计数据接口
// --- END COMMENT ---
interface BasicStats {
  totalProviders: number;
  activeProviders: number;
  supportedProtocols: number;
}

function TestResults({ result }: { result: TestResult }) {
  const { isDark } = useTheme();

  return (
    <div
      className={cn(
        'mt-6 rounded-xl border p-6',
        isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-white'
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        {result.overall.status === 'success' ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <XCircle className="h-6 w-6 text-orange-500" />
        )}
        <div>
          <h3
            className={cn(
              'text-lg font-semibold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            测试结果
          </h3>
          <p
            className={cn(
              'text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {result.overall.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(result.tests).map(([testName, testResult]) => (
          <div
            key={testName}
            className={cn(
              'rounded-lg border p-4',
              testResult.status === 'success'
                ? isDark
                  ? 'border-green-700 bg-green-900/20'
                  : 'border-green-200 bg-green-50'
                : isDark
                  ? 'border-red-700 bg-red-900/20'
                  : 'border-red-200 bg-red-50'
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              {testResult.status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <h4
                className={cn(
                  'font-medium',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                {testName}
              </h4>
            </div>
            {testResult.error && (
              <p className="text-sm text-red-600">{testResult.error}</p>
            )}
            {testResult.data && (
              <pre
                className={cn(
                  'mt-2 overflow-auto rounded p-2 text-xs',
                  isDark
                    ? 'bg-stone-700 text-stone-300'
                    : 'bg-stone-100 text-stone-700'
                )}
              >
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-stone-500">
        测试时间: {new Date(result.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

// --- BEGIN COMMENT ---
// SSO管理主页组件
// --- END COMMENT ---
export default function SSOManagementPage() {
  const { isDark } = useTheme();
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // --- BEGIN COMMENT ---
  // 获取基础统计数据
  // --- END COMMENT ---
  const loadBasicStats = async () => {
    try {
      setStatsLoading(true);

      // 获取提供商列表
      const providersResponse = await fetch('/api/admin/sso/providers');
      const providersData = await providersResponse.json();

      if (providersData.success) {
        const providers = providersData.data || [];
        const stats: BasicStats = {
          totalProviders: providers.length,
          activeProviders: providers.filter((p: any) => p.enabled).length,
          supportedProtocols: 4, // CAS, OIDC, SAML, OAuth2
        };
        setBasicStats(stats);
      } else {
        // 如果获取失败，设置默认值
        setBasicStats({
          totalProviders: 0,
          activeProviders: 0,
          supportedProtocols: 4,
        });
      }
    } catch (error) {
      console.error('加载基础统计失败:', error);
      // 设置默认值
      setBasicStats({
        totalProviders: 0,
        activeProviders: 0,
        supportedProtocols: 4,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 运行SSO系统测试
  // --- END COMMENT ---
  const runSystemTest = async () => {
    setIsTestRunning(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/sso/test');
      const data = await response.json();

      if (data.success) {
        setTestResult(data.data);
        toast.success('SSO系统测试完成');

        // 测试完成后更新基础统计数据
        if (data.data.tests.database?.data) {
          setBasicStats({
            totalProviders: data.data.tests.database.data.totalProviders || 0,
            activeProviders: data.data.tests.database.data.activeProviders || 0,
            supportedProtocols:
              data.data.tests.protocolTemplates?.data?.supportedProtocols
                ?.length || 4,
          });
        }
      } else {
        toast.error(data.error || 'SSO系统测试失败');
      }
    } catch (error) {
      console.error('SSO测试错误:', error);
      toast.error('无法连接到SSO测试接口');
    } finally {
      setIsTestRunning(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 页面加载时获取基础统计数据
  // --- END COMMENT ---
  useEffect(() => {
    loadBasicStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1
            className={cn(
              'text-3xl font-bold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            SSO 后台配置管理
          </h1>
          <p
            className={cn(
              'mt-2 text-lg',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            统一身份认证系统配置与管理
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SSOCard
            title="提供商管理"
            description="添加、编辑和管理SSO身份认证提供商配置"
            icon={Users}
            href="/admin/sso/providers"
          />

          <SSOCard
            title="协议配置"
            description="查看和管理支持的SSO协议模板配置"
            icon={Settings}
            href="/admin/sso/templates"
          />

          <SSOCard
            title="安全设置"
            description="配置SSO安全策略和权限控制设置"
            icon={Shield}
            href="/admin/sso/security"
          />

          <SSOCard
            title="系统测试"
            description="运行完整的SSO系统测试，检查各组件状态"
            icon={TestTube}
            onClick={runSystemTest}
            variant="test"
          />
        </div>

        {/* 测试运行状态 */}
        {isTestRunning && (
          <div
            className={cn(
              'mb-8 rounded-xl border p-6',
              isDark
                ? 'border-blue-700 bg-blue-900/20'
                : 'border-blue-200 bg-blue-50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <p
                className={cn(
                  'text-lg font-medium',
                  isDark ? 'text-blue-300' : 'text-blue-700'
                )}
              >
                正在运行SSO系统测试...
              </p>
            </div>
          </div>
        )}

        {/* 测试结果 */}
        {testResult && <TestResults result={testResult} />}

        {/* 快速统计 */}
        <div
          className={cn(
            'rounded-xl border p-6',
            isDark
              ? 'border-stone-700 bg-stone-800'
              : 'border-stone-200 bg-white'
          )}
        >
          <h2
            className={cn(
              'mb-4 text-xl font-semibold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            系统状态
          </h2>

          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <p
                className={cn(
                  'ml-3',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                正在加载统计数据...
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDark ? 'text-green-400' : 'text-green-600'
                  )}
                >
                  {basicStats?.totalProviders ?? '-'}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  配置的提供商总数
                </div>
              </div>

              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )}
                >
                  {basicStats?.activeProviders ?? '-'}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  启用的提供商数量
                </div>
              </div>

              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  )}
                >
                  {basicStats?.supportedProtocols ?? 4}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  支持的协议类型
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
