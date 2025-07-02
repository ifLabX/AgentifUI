'use client';

import { ProviderFormModal } from '@components/admin/sso/provider-form-modal';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  ArrowLeft,
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

// --- BEGIN COMMENT ---
// SSO提供商数据类型定义
// --- END COMMENT ---
interface SSOProvider {
  id: string;
  name: string;
  protocol: 'CAS' | 'OIDC' | 'SAML' | 'OAuth2';
  enabled: boolean;
  settings: Record<string, any>;
  client_id?: string;
  metadata_url?: string;
  display_order?: number;
  button_text?: string;
  created_at: string;
  updated_at: string;
}

// --- BEGIN COMMENT ---
// 提供商卡片组件
// --- END COMMENT ---
interface ProviderCardProps {
  provider: SSOProvider;
  onEdit: (provider: SSOProvider) => void;
  onDelete: (provider: SSOProvider) => void;
  onToggleStatus: (provider: SSOProvider) => void;
}

function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProviderCardProps) {
  const { isDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  // --- BEGIN COMMENT ---
  // 获取协议类型对应的颜色样式
  // --- END COMMENT ---
  const getProtocolBadgeStyle = (protocol: string) => {
    const styles = {
      CAS: isDark
        ? 'bg-blue-900/20 text-blue-300 border-blue-700'
        : 'bg-blue-50 text-blue-700 border-blue-200',
      OIDC: isDark
        ? 'bg-green-900/20 text-green-300 border-green-700'
        : 'bg-green-50 text-green-700 border-green-200',
      SAML: isDark
        ? 'bg-purple-900/20 text-purple-300 border-purple-700'
        : 'bg-purple-50 text-purple-700 border-purple-200',
      OAuth2: isDark
        ? 'bg-orange-900/20 text-orange-300 border-orange-700'
        : 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return styles[protocol as keyof typeof styles] || styles.CAS;
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border p-6 transition-all duration-200',
        isDark
          ? 'border-stone-700 bg-stone-800 hover:border-stone-600'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-lg'
      )}
    >
      {/* 提供商标题和状态 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h3
              className={cn(
                'text-lg font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              {provider.name}
            </h3>

            {/* 启用状态指示器 */}
            <div className="flex items-center gap-1">
              {provider.enabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          {/* 协议类型标签 */}
          <div
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
              getProtocolBadgeStyle(provider.protocol)
            )}
          >
            {provider.protocol}
          </div>
        </div>

        {/* 操作下拉菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isDark
                ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showDropdown && (
            <div
              className={cn(
                'absolute top-full right-0 z-10 mt-2 w-48 rounded-lg border shadow-lg',
                isDark
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-200 bg-white'
              )}
            >
              <div className="p-1">
                <button
                  onClick={() => {
                    onEdit(provider);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    isDark
                      ? 'text-stone-300 hover:bg-stone-700'
                      : 'text-stone-700 hover:bg-stone-100'
                  )}
                >
                  <Edit className="h-4 w-4" />
                  编辑配置
                </button>

                <button
                  onClick={() => {
                    onToggleStatus(provider);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    isDark
                      ? 'text-stone-300 hover:bg-stone-700'
                      : 'text-stone-700 hover:bg-stone-100'
                  )}
                >
                  {provider.enabled ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {provider.enabled ? '禁用' : '启用'}
                </button>

                <hr
                  className={cn(
                    'my-1',
                    isDark ? 'border-stone-700' : 'border-stone-200'
                  )}
                />

                <button
                  onClick={() => {
                    onDelete(provider);
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 提供商详情 */}
      <div className="space-y-2">
        {provider.button_text && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'text-stone-500',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              按钮文本:
            </span>
            <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              {provider.button_text}
            </span>
          </div>
        )}

        {provider.metadata_url && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'text-stone-500',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              元数据URL:
            </span>
            <span
              className={cn(
                'truncate',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              {provider.metadata_url}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              'text-stone-500',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            创建时间:
          </span>
          <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
            {new Date(provider.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- BEGIN COMMENT ---
// SSO提供商管理页面主组件
// --- END COMMENT ---
export default function SSOProvidersPage() {
  const { isDark } = useTheme();
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  // --- BEGIN COMMENT ---
  // 表单模态相关状态
  // --- END COMMENT ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(
    null
  );
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // --- BEGIN COMMENT ---
  // 加载提供商列表
  // --- END COMMENT ---
  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sso/providers');
      const data = await response.json();

      if (data.success) {
        setProviders(data.data);
      } else {
        toast.error(data.error || '加载提供商列表失败');
      }
    } catch (error) {
      console.error('加载提供商列表错误:', error);
      toast.error('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 切换提供商启用状态
  // --- END COMMENT ---
  const handleToggleStatus = async (provider: SSOProvider) => {
    try {
      const response = await fetch(`/api/admin/sso/providers/${provider.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !provider.enabled,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `${provider.name} ${!provider.enabled ? '已启用' : '已禁用'}`
        );
        loadProviders();
      } else {
        toast.error(data.error || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新错误:', error);
      toast.error('状态更新失败');
    }
  };

  // --- BEGIN COMMENT ---
  // 删除提供商
  // --- END COMMENT ---
  const handleDelete = async (provider: SSOProvider) => {
    if (!confirm(`确定要删除提供商 "${provider.name}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sso/providers/${provider.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`提供商 "${provider.name}" 已删除`);
        loadProviders();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      toast.error('删除失败');
    }
  };

  // --- BEGIN COMMENT ---
  // 编辑提供商
  // --- END COMMENT ---
  const handleEdit = (provider: SSOProvider) => {
    setEditingProvider(provider);
    setFormMode('edit');
    setShowFormModal(true);
  };

  // --- BEGIN COMMENT ---
  // 创建提供商
  // --- END COMMENT ---
  const handleCreate = () => {
    setEditingProvider(null);
    setFormMode('create');
    setShowFormModal(true);
  };

  // --- BEGIN COMMENT ---
  // 保存提供商（创建或更新）
  // --- END COMMENT ---
  const handleSaveProvider = async (data: any) => {
    try {
      if (formMode === 'create') {
        // 创建新提供商
        const response = await fetch('/api/admin/sso/providers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '创建失败');
        }
      } else if (formMode === 'edit' && editingProvider) {
        // 更新现有提供商
        const response = await fetch(
          `/api/admin/sso/providers/${editingProvider.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '更新失败');
        }
      }

      // 重新加载提供商列表
      await loadProviders();

      // 关闭模态
      setShowFormModal(false);
      setEditingProvider(null);
    } catch (error: any) {
      console.error('保存提供商失败:', error);
      throw error; // 让模态组件处理错误显示
    }
  };

  // --- BEGIN COMMENT ---
  // 过滤提供商列表
  // --- END COMMENT ---
  const filteredProviders = providers.filter(provider => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.protocol.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && provider.enabled) ||
      (statusFilter === 'inactive' && !provider.enabled);

    return matchesSearch && matchesStatus;
  });

  // 组件挂载时加载数据
  useEffect(() => {
    loadProviders();
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

          <div className="flex items-center justify-between">
            <div>
              <h1
                className={cn(
                  'text-3xl font-bold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                提供商管理
              </h1>
              <p
                className={cn(
                  'mt-2 text-lg',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                添加、编辑和管理SSO身份认证提供商配置
              </p>
            </div>

            <button
              onClick={handleCreate}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Plus className="h-4 w-4" />
              添加提供商
            </button>
          </div>
        </div>

        {/* 搜索和过滤栏 */}
        <div
          className={cn(
            'mb-8 rounded-xl border p-6',
            isDark
              ? 'border-stone-700 bg-stone-800'
              : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search
                className={cn(
                  'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              />
              <input
                type="text"
                placeholder="搜索提供商名称或协议..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full rounded-lg border py-2 pr-4 pl-10 transition-colors',
                  isDark
                    ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400 focus:border-blue-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500 focus:border-blue-500'
                )}
              />
            </div>

            {/* 状态过滤 */}
            <div className="flex items-center gap-2">
              <Filter
                className={cn(
                  'h-4 w-4',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className={cn(
                  'rounded-lg border px-3 py-2 transition-colors',
                  isDark
                    ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                    : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                )}
              >
                <option value="all">全部状态</option>
                <option value="active">已启用</option>
                <option value="inactive">已禁用</option>
              </select>
            </div>
          </div>
        </div>

        {/* 提供商列表 */}
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
              正在加载提供商列表...
            </p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border p-12 text-center',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <Settings
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
              {providers.length === 0 ? '暂无提供商' : '没有匹配的提供商'}
            </h3>
            <p
              className={cn(
                'mb-6',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {providers.length === 0
                ? '还没有配置任何SSO提供商，点击添加按钮开始配置'
                : '尝试调整搜索条件或过滤器'}
            </p>
            {providers.length === 0 && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                添加第一个提供商
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* 统计信息 */}
        {!loading && providers.length > 0 && (
          <div
            className={cn(
              'mt-8 rounded-xl border p-6',
              isDark
                ? 'border-stone-700 bg-stone-800'
                : 'border-stone-200 bg-white'
            )}
          >
            <div className="grid gap-4 text-center md:grid-cols-3">
              <div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )}
                >
                  {providers.length}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  总提供商数
                </div>
              </div>

              <div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDark ? 'text-green-400' : 'text-green-600'
                  )}
                >
                  {providers.filter(p => p.enabled).length}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  已启用
                </div>
              </div>

              <div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDark ? 'text-orange-400' : 'text-orange-600'
                  )}
                >
                  {new Set(providers.map(p => p.protocol)).size}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  协议类型
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 表单模态 */}
        <ProviderFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingProvider(null);
          }}
          onSave={handleSaveProvider}
          provider={editingProvider}
          mode={formMode}
        />
      </div>
    </div>
  );
}
