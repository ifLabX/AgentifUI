'use client';

import { PROTOCOL_TEMPLATES } from '@lib/config/sso-protocol-definitions';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

// --- BEGIN COMMENT ---
// SSO提供商表单数据类型
// --- END COMMENT ---
interface ProviderFormData {
  name: string;
  protocol: 'CAS' | 'OIDC' | 'SAML' | 'OAuth2';
  enabled: boolean;
  button_text: string;
  display_order: number;

  // 基础配置
  base_url: string;
  client_id?: string;
  client_secret?: string;
  metadata_url?: string;

  // 高级配置
  timeout?: number;
  scope?: string;
  response_type?: string;
  issuer?: string;
  version?: string;

  // 属性映射
  employee_id_attr?: string;
  username_attr?: string;
  full_name_attr?: string;
  email_attr?: string;

  // 安全设置
  require_https: boolean;
  validate_certificates: boolean;
  pkce_enabled?: boolean;
  state_parameter?: boolean;
}

// --- BEGIN COMMENT ---
// 表单模态组件属性
// --- END COMMENT ---
interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  provider?: any; // 编辑时传入现有提供商数据
  mode: 'create' | 'edit';
}

export function ProviderFormModal({
  isOpen,
  onClose,
  onSave,
  provider,
  mode,
}: ProviderFormModalProps) {
  const { isDark } = useTheme();
  const [loading, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- BEGIN COMMENT ---
  // 表单数据状态
  // --- END COMMENT ---
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    protocol: 'CAS',
    enabled: true,
    button_text: '',
    display_order: 0,
    base_url: '',
    timeout: 10000,
    require_https: true,
    validate_certificates: true,
    employee_id_attr: '',
    username_attr: '',
    full_name_attr: '',
    email_attr: '',
    version: '2.0', // 默认CAS 2.0版本
  });

  // --- BEGIN COMMENT ---
  // 初始化表单数据
  // --- END COMMENT ---
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && provider) {
        // 编辑模式：填充现有数据
        const settings = provider.settings || {};
        const protocolConfig = settings.protocol_config || {};
        const attributesMapping = protocolConfig.attributes_mapping || {};
        const security = settings.security || {};

        setFormData({
          name: provider.name || '',
          protocol: provider.protocol || 'CAS',
          enabled: provider.enabled !== false,
          button_text: provider.button_text || '',
          display_order: provider.display_order || 0,
          base_url: protocolConfig.base_url || '',
          client_id: provider.client_id || '',
          client_secret: provider.client_secret || '',
          metadata_url: provider.metadata_url || '',
          timeout: protocolConfig.timeout || 10000,
          scope: protocolConfig.scope || '',
          response_type: protocolConfig.response_type || '',
          issuer: protocolConfig.issuer || '',
          version: protocolConfig.version || '2.0',
          employee_id_attr: attributesMapping.employee_id || '',
          username_attr: attributesMapping.username || '',
          full_name_attr: attributesMapping.full_name || '',
          email_attr: attributesMapping.email || '',
          require_https: security.require_https !== false,
          validate_certificates: security.validate_certificates !== false,
          pkce_enabled: security.pkce_enabled || false,
          state_parameter: security.state_parameter || false,
        });
      } else {
        // 创建模式：使用默认值
        const template = PROTOCOL_TEMPLATES[formData.protocol];
        if (template) {
          const defaultMapping =
            template.defaultSettings.protocol_config.attributes_mapping || {};
          setFormData(prev => ({
            ...prev,
            name: '',
            button_text: '',
            base_url: '',
            client_id: '',
            client_secret: '',
            metadata_url: '',
            employee_id_attr: defaultMapping.employee_id || '',
            username_attr: defaultMapping.username || '',
            full_name_attr: defaultMapping.full_name || '',
            email_attr: defaultMapping.email || '',
          }));
        }
      }
      setErrors({});
    }
  }, [isOpen, mode, provider, formData.protocol]);

  // --- BEGIN COMMENT ---
  // 协议变更时更新默认值
  // --- END COMMENT ---
  const handleProtocolChange = (
    protocol: 'CAS' | 'OIDC' | 'SAML' | 'OAuth2'
  ) => {
    const template = PROTOCOL_TEMPLATES[protocol];
    if (template) {
      const defaultMapping =
        template.defaultSettings.protocol_config.attributes_mapping || {};
      const defaultSecurity = template.defaultSettings.security || {};
      const defaultVersion =
        template.defaultSettings.protocol_config.version || '2.0';

      setFormData(prev => ({
        ...prev,
        protocol,
        button_text: prev.button_text || `使用${template.name}登录`,
        employee_id_attr: defaultMapping.employee_id || '',
        username_attr: defaultMapping.username || '',
        full_name_attr: defaultMapping.full_name || '',
        email_attr: defaultMapping.email || '',
        require_https: defaultSecurity.require_https !== false,
        validate_certificates: defaultSecurity.validate_certificates !== false,
        pkce_enabled: defaultSecurity.pkce_enabled || false,
        state_parameter: defaultSecurity.state_parameter || false,
        version: defaultVersion, // 设置协议默认版本
      }));
    }
  };

  // --- BEGIN COMMENT ---
  // 表单验证
  // --- END COMMENT ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 基础字段验证
    if (!formData.name.trim()) {
      newErrors.name = '提供商名称为必填项';
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = '基础URL为必填项';
    } else {
      try {
        new URL(formData.base_url);
      } catch {
        newErrors.base_url = '请输入有效的URL格式';
      }
    }

    // 协议特定验证
    const template = PROTOCOL_TEMPLATES[formData.protocol];
    if (template) {
      for (const field of template.requiredFields) {
        const value = (formData as any)[field];
        if (!value || String(value).trim() === '') {
          const fieldName =
            {
              client_id: '客户端ID',
              client_secret: '客户端密钥',
              base_url: '基础URL',
            }[field] || field;
          newErrors[field] = `${fieldName}为必填项`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- BEGIN COMMENT ---
  // 保存表单
  // --- END COMMENT ---
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // 构建提交数据
      const submitData = {
        name: formData.name.trim(),
        protocol: formData.protocol,
        enabled: formData.enabled,
        button_text: formData.button_text.trim(),
        display_order: formData.display_order,
        client_id: formData.client_id?.trim() || null,
        client_secret: formData.client_secret?.trim() || null,
        metadata_url: formData.metadata_url?.trim() || null,
        settings: {
          protocol_config: {
            base_url: formData.base_url.trim(),
            timeout: formData.timeout || 10000,
            version: formData.version || '2.0',
            scope: formData.scope?.trim() || undefined,
            response_type: formData.response_type?.trim() || undefined,
            issuer: formData.issuer?.trim() || undefined,
            endpoints: {
              ...PROTOCOL_TEMPLATES[formData.protocol].defaultSettings
                .protocol_config.endpoints,
              // 对于CAS 3.0，确保validate_v3端点存在
              ...(formData.protocol === 'CAS' &&
                formData.version === '3.0' && {
                  validate_v3: '/p3/serviceValidate',
                }),
            },
            attributes_mapping: {
              employee_id: formData.employee_id_attr?.trim() || '',
              username: formData.username_attr?.trim() || '',
              full_name: formData.full_name_attr?.trim() || '',
              email: formData.email_attr?.trim() || '',
            },
          },
          security: {
            require_https: formData.require_https,
            validate_certificates: formData.validate_certificates,
            pkce_enabled: formData.pkce_enabled,
            state_parameter: formData.state_parameter,
          },
          ui: PROTOCOL_TEMPLATES[formData.protocol].defaultSettings.ui,
        },
      };

      await onSave(submitData);
      onClose();
      toast.success(mode === 'create' ? '提供商创建成功' : '提供商更新成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(mode === 'create' ? '创建失败' : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border',
          isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-white'
        )}
      >
        {/* 模态头部 */}
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-between border-b p-6',
            isDark ? 'border-stone-700' : 'border-stone-200'
          )}
        >
          <h2
            className={cn(
              'text-xl font-semibold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            {mode === 'create' ? '添加提供商' : '编辑提供商'}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-2 transition-colors',
              isDark
                ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="space-y-6 pb-4">
            {/* 基础信息 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 提供商名称 */}
              <div>
                <label
                  className={cn(
                    'mb-2 block text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  提供商名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 transition-colors',
                    errors.name
                      ? 'border-red-500'
                      : isDark
                        ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                        : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                  )}
                  placeholder="如：北京信息科技大学"
                />
                {errors.name && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 协议类型 */}
              <div>
                <label
                  className={cn(
                    'mb-2 block text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  协议类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.protocol}
                  onChange={e => handleProtocolChange(e.target.value as any)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 transition-colors',
                    isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                      : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                  )}
                >
                  {Object.entries(PROTOCOL_TEMPLATES).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.icon} {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* 按钮文本 */}
              <div>
                <label
                  className={cn(
                    'mb-2 block text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  按钮文本
                </label>
                <input
                  type="text"
                  value={formData.button_text}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      button_text: e.target.value,
                    }))
                  }
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 transition-colors',
                    isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                      : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                  )}
                  placeholder="登录按钮显示的文本"
                />
              </div>

              {/* 显示顺序 */}
              <div>
                <label
                  className={cn(
                    'mb-2 block text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  显示顺序
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 transition-colors',
                    isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                      : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                  )}
                  min="0"
                />
              </div>
            </div>

            {/* 连接配置 */}
            <div className="space-y-4">
              <h3
                className={cn(
                  'text-lg font-medium',
                  isDark ? 'text-stone-200' : 'text-stone-800'
                )}
              >
                连接配置
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* 基础URL */}
                <div>
                  <label
                    className={cn(
                      'mb-2 block text-sm font-medium',
                      isDark ? 'text-stone-300' : 'text-stone-700'
                    )}
                  >
                    基础URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.base_url}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        base_url: e.target.value,
                      }))
                    }
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 transition-colors',
                      errors.base_url
                        ? 'border-red-500'
                        : isDark
                          ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                          : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                    )}
                    placeholder="https://cas.example.com"
                  />
                  {errors.base_url && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      {errors.base_url}
                    </p>
                  )}
                </div>

                {/* OAuth2/OIDC特有字段 */}
                {(formData.protocol === 'OIDC' ||
                  formData.protocol === 'OAuth2') && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label
                        className={cn(
                          'mb-2 block text-sm font-medium',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                      >
                        客户端ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.client_id || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            client_id: e.target.value,
                          }))
                        }
                        className={cn(
                          'w-full rounded-lg border px-3 py-2 transition-colors',
                          errors.client_id
                            ? 'border-red-500'
                            : isDark
                              ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                              : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                        )}
                      />
                      {errors.client_id && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          {errors.client_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className={cn(
                          'mb-2 block text-sm font-medium',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                      >
                        客户端密钥 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.client_secret || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              client_secret: e.target.value,
                            }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 pr-10 transition-colors',
                            errors.client_secret
                              ? 'border-red-500'
                              : isDark
                                ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                                : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={cn(
                            'absolute top-1/2 right-3 -translate-y-1/2 transform',
                            isDark
                              ? 'text-stone-400 hover:text-stone-300'
                              : 'text-stone-600 hover:text-stone-700'
                          )}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.client_secret && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          {errors.client_secret}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* CAS协议特有字段 */}
                {formData.protocol === 'CAS' && (
                  <div>
                    <label
                      className={cn(
                        'mb-2 block text-sm font-medium',
                        isDark ? 'text-stone-300' : 'text-stone-700'
                      )}
                    >
                      CAS协议版本
                    </label>
                    <select
                      value={formData.version || '2.0'}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          version: e.target.value,
                        }))
                      }
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 transition-colors',
                        isDark
                          ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                          : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                      )}
                    >
                      <option value="2.0">
                        CAS 2.0 (使用 /serviceValidate)
                      </option>
                      <option value="3.0">
                        CAS 3.0 (使用 /p3/serviceValidate)
                      </option>
                    </select>
                    <p className="mt-1 text-sm text-stone-500">
                      不同版本的CAS服务器使用不同的票据验证端点，请根据您的CAS服务器版本选择
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 高级配置折叠面板 */}
            <div
              className={cn(
                'rounded-lg border',
                isDark ? 'border-stone-700' : 'border-stone-200'
              )}
            >
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  'flex w-full items-center justify-between p-4 text-left transition-colors',
                  isDark ? 'hover:bg-stone-750' : 'hover:bg-stone-50'
                )}
              >
                <span
                  className={cn(
                    'font-medium',
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  )}
                >
                  高级配置
                </span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAdvanced && (
                <div
                  className={cn(
                    'space-y-4 border-t p-4',
                    isDark ? 'border-stone-700' : 'border-stone-200'
                  )}
                >
                  {/* 属性映射 */}
                  <div>
                    <h4
                      className={cn(
                        'text-md mb-3 font-medium',
                        isDark ? 'text-stone-300' : 'text-stone-700'
                      )}
                    >
                      属性映射
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          className={cn(
                            'mb-2 block text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          员工ID字段
                        </label>
                        <input
                          type="text"
                          value={formData.employee_id_attr || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              employee_id_attr: e.target.value,
                            }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 transition-colors',
                            isDark
                              ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                              : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                          )}
                        />
                      </div>
                      <div>
                        <label
                          className={cn(
                            'mb-2 block text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          用户名字段
                        </label>
                        <input
                          type="text"
                          value={formData.username_attr || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              username_attr: e.target.value,
                            }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 transition-colors',
                            isDark
                              ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                              : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                          )}
                        />
                      </div>
                      <div>
                        <label
                          className={cn(
                            'mb-2 block text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          全名字段
                        </label>
                        <input
                          type="text"
                          value={formData.full_name_attr || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              full_name_attr: e.target.value,
                            }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 transition-colors',
                            isDark
                              ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                              : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                          )}
                        />
                      </div>
                      <div>
                        <label
                          className={cn(
                            'mb-2 block text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          邮箱字段
                        </label>
                        <input
                          type="text"
                          value={formData.email_attr || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              email_attr: e.target.value,
                            }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 transition-colors',
                            isDark
                              ? 'border-stone-600 bg-stone-700 text-stone-100 focus:border-blue-500'
                              : 'border-stone-300 bg-white text-stone-900 focus:border-blue-500'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 安全设置 */}
                  <div>
                    <h4
                      className={cn(
                        'text-md mb-3 font-medium',
                        isDark ? 'text-stone-300' : 'text-stone-700'
                      )}
                    >
                      安全设置
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.require_https}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              require_https: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={cn(
                            'text-sm',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          要求HTTPS连接
                        </span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.validate_certificates}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              validate_certificates: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={cn(
                            'text-sm',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          验证SSL证书
                        </span>
                      </label>

                      {(formData.protocol === 'OIDC' ||
                        formData.protocol === 'OAuth2') && (
                        <>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.pkce_enabled || false}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  pkce_enabled: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                              className={cn(
                                'text-sm',
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              )}
                            >
                              启用PKCE (推荐)
                            </span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.state_parameter || false}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  state_parameter: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                              className={cn(
                                'text-sm',
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              )}
                            >
                              使用state参数
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 启用状态 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={e =>
                  setFormData(prev => ({ ...prev, enabled: e.target.checked }))
                }
                className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                立即启用此提供商
              </span>
            </div>
          </div>
        </div>

        {/* 模态底部 */}
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-end gap-3 border-t p-6',
            isDark ? 'border-stone-700' : 'border-stone-200'
          )}
        >
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg px-4 py-2 transition-colors',
              isDark
                ? 'text-stone-300 hover:bg-stone-700 hover:text-stone-200'
                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-800'
            )}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
              loading
                ? 'cursor-not-allowed bg-blue-600 text-white opacity-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? '创建提供商' : '保存更改'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
