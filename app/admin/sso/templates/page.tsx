'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  ArrowLeft,
  Code,
  ExternalLink,
  FileText,
  Globe,
  Key,
  Settings,
  Shield,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

// --- BEGIN COMMENT ---
// 协议模板数据类型定义
// --- END COMMENT ---
interface ProtocolTemplate {
  protocol: string;
  name: string;
  description: string;
  version: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: string;
    validation?: string;
  }[];
  examples: {
    name: string;
    description: string;
    config: Record<string, any>;
  }[];
  documentation: string;
}

// --- BEGIN COMMENT ---
// 协议模板卡片组件
// --- END COMMENT ---
interface TemplateCardProps {
  template: ProtocolTemplate;
}

function TemplateCard({ template }: TemplateCardProps) {
  const { isDark } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  // --- BEGIN COMMENT ---
  // 获取协议类型对应的图标和颜色样式
  // --- END COMMENT ---
  const getProtocolStyle = (protocol: string) => {
    const styles = {
      CAS: {
        icon: Shield,
        colors: isDark
          ? 'bg-blue-900/20 text-blue-300 border-blue-700'
          : 'bg-blue-50 text-blue-700 border-blue-200',
      },
      OIDC: {
        icon: Key,
        colors: isDark
          ? 'bg-green-900/20 text-green-300 border-green-700'
          : 'bg-green-50 text-green-700 border-green-200',
      },
      SAML: {
        icon: FileText,
        colors: isDark
          ? 'bg-purple-900/20 text-purple-300 border-purple-700'
          : 'bg-purple-50 text-purple-700 border-purple-200',
      },
      OAuth2: {
        icon: Globe,
        colors: isDark
          ? 'bg-orange-900/20 text-orange-300 border-orange-700'
          : 'bg-orange-50 text-orange-700 border-orange-200',
      },
    };
    return styles[protocol as keyof typeof styles] || styles.CAS;
  };

  const protocolStyle = getProtocolStyle(template.protocol);
  const IconComponent = protocolStyle.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-6 transition-all duration-200',
        isDark
          ? 'border-stone-700 bg-stone-800 hover:border-stone-600'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-lg'
      )}
    >
      {/* 协议标题 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg border p-2', protocolStyle.colors)}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <h3
              className={cn(
                'text-lg font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              {template.name}
            </h3>
            <p
              className={cn(
                'text-sm',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              版本 {template.version}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            'rounded-md px-3 py-1 text-xs transition-colors',
            showDetails
              ? 'bg-blue-600 text-white'
              : isDark
                ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
          )}
        >
          {showDetails ? '收起' : '详情'}
        </button>
      </div>

      {/* 协议描述 */}
      <p
        className={cn(
          'mb-4 text-sm',
          isDark ? 'text-stone-300' : 'text-stone-700'
        )}
      >
        {template.description}
      </p>

      {/* 字段概览 */}
      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className={cn(isDark ? 'text-stone-400' : 'text-stone-600')}>
            配置字段:
          </span>
          <span
            className={cn(
              'font-medium',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )}
          >
            {template.fields.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className={cn(isDark ? 'text-stone-400' : 'text-stone-600')}>
            必填:
          </span>
          <span
            className={cn(
              'font-medium',
              isDark ? 'text-red-400' : 'text-red-600'
            )}
          >
            {template.fields.filter(f => f.required).length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className={cn(isDark ? 'text-stone-400' : 'text-stone-600')}>
            示例:
          </span>
          <span
            className={cn(
              'font-medium',
              isDark ? 'text-green-400' : 'text-green-600'
            )}
          >
            {template.examples.length}
          </span>
        </div>
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div
          className={cn(
            'mt-6 space-y-6 border-t pt-6',
            isDark ? 'border-stone-700' : 'border-stone-200'
          )}
        >
          {/* 配置字段 */}
          <div>
            <h4
              className={cn(
                'text-md mb-3 font-semibold',
                isDark ? 'text-stone-200' : 'text-stone-800'
              )}
            >
              配置字段
            </h4>
            <div className="space-y-3">
              {template.fields.map((field, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-lg border p-3',
                    isDark
                      ? 'bg-stone-750 border-stone-700'
                      : 'border-stone-200 bg-stone-50'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code
                        className={cn(
                          'rounded px-2 py-1 font-mono text-sm',
                          isDark
                            ? 'bg-stone-800 text-blue-300'
                            : 'bg-white text-blue-600'
                        )}
                      >
                        {field.name}
                      </code>
                      {field.required && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                          必填
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        isDark
                          ? 'bg-stone-700 text-stone-300'
                          : 'bg-stone-200 text-stone-600'
                      )}
                    >
                      {field.type}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    {field.description}
                  </p>
                  {field.example && (
                    <div className="mt-2">
                      <span
                        className={cn(
                          'text-xs',
                          isDark ? 'text-stone-500' : 'text-stone-500'
                        )}
                      >
                        示例:
                      </span>
                      <code
                        className={cn(
                          'ml-1 text-xs',
                          isDark ? 'text-green-400' : 'text-green-600'
                        )}
                      >
                        {field.example}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 配置示例 */}
          {template.examples.length > 0 && (
            <div>
              <h4
                className={cn(
                  'text-md mb-3 font-semibold',
                  isDark ? 'text-stone-200' : 'text-stone-800'
                )}
              >
                配置示例
              </h4>
              <div className="space-y-3">
                {template.examples.map((example, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-4',
                      isDark
                        ? 'bg-stone-750 border-stone-700'
                        : 'border-stone-200 bg-stone-50'
                    )}
                  >
                    <h5
                      className={cn(
                        'mb-2 font-medium',
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      )}
                    >
                      {example.name}
                    </h5>
                    <p
                      className={cn(
                        'mb-3 text-sm',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    >
                      {example.description}
                    </p>
                    <pre
                      className={cn(
                        'overflow-auto rounded p-3 text-xs',
                        isDark
                          ? 'bg-stone-800 text-stone-300'
                          : 'bg-white text-stone-700'
                      )}
                    >
                      {JSON.stringify(example.config, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 文档链接 */}
          {template.documentation && (
            <div>
              <a
                href={template.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                <FileText className="h-4 w-4" />
                查看完整文档
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- BEGIN COMMENT ---
// SSO协议模板页面主组件
// --- END COMMENT ---
export default function SSOTemplatesPage() {
  const { isDark } = useTheme();
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // --- BEGIN COMMENT ---
  // 加载协议模板列表
  // --- END COMMENT ---
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sso/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        toast.error(data.error || '加载协议模板失败');
      }
    } catch (error) {
      console.error('加载协议模板错误:', error);
      toast.error('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadTemplates();
  }, []);

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

          <div>
            <h1
              className={cn(
                'text-3xl font-bold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              协议配置模板
            </h1>
            <p
              className={cn(
                'mt-2 text-lg',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              查看和管理支持的SSO协议模板配置
            </p>
          </div>
        </div>

        {/* 协议模板列表 */}
        {loading ? (
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
              正在加载协议模板...
            </p>
          </div>
        ) : templates.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border p-12 text-center',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <Code
              className={cn(
                'mx-auto mb-4 h-16 w-16',
                isDark ? 'text-stone-600' : 'text-stone-400'
              )}
            />
            <h3
              className={cn(
                'mb-2 text-lg font-semibold',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              暂无协议模板
            </h3>
            <p
              className={cn(
                'mb-6',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              系统中还没有配置任何协议模板
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {templates.map((template, index) => (
              <TemplateCard key={index} template={template} />
            ))}
          </div>
        )}

        {/* 说明信息 */}
        <div
          className={cn(
            'mt-8 rounded-xl border p-6',
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
            关于协议模板
          </h3>
          <div className="space-y-3 text-sm">
            <p className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              协议模板定义了每种SSO协议的配置字段和验证规则，帮助管理员正确配置提供商。
            </p>
            <p className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              每个模板包含字段定义、类型验证、示例配置和完整文档，确保配置的准确性和一致性。
            </p>
            <p className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              模板由系统自动管理，无需手动修改。如需支持新的协议类型，请联系系统管理员。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
