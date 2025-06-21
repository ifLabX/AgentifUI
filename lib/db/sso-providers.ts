// --- BEGIN COMMENT ---
// SSO提供商数据库访问层
// 提供完整的CRUD操作和查询功能，支持SSO配置管理
// --- END COMMENT ---

import { createClient, createAdminClient } from '@lib/supabase/server';
import type { 
  SsoProvider, 
  SsoProtocolTemplate, 
  SsoProtocol, 
  SsoProviderSettings 
} from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 SSO提供商查询筛选条件
// --- END COMMENT ---
export interface SSOProviderFilters {
  protocol?: SsoProtocol;
  enabled?: boolean;
  search?: string;
  orderBy?: 'display_order' | 'name' | 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}

// --- BEGIN COMMENT ---
// 🎯 创建SSO提供商所需的数据
// --- END COMMENT ---
export interface CreateSSOProviderData {
  name: string;
  protocol: SsoProtocol;
  settings: SsoProviderSettings;
  button_text?: string;
  display_order?: number;
  enabled?: boolean;
  client_id?: string;
  client_secret?: string;
  metadata_url?: string;
}

// --- BEGIN COMMENT ---
// 🎯 更新SSO提供商的数据
// --- END COMMENT ---
export interface UpdateSSOProviderData {
  name?: string;
  protocol?: SsoProtocol;
  settings?: SsoProviderSettings;
  button_text?: string;
  display_order?: number;
  enabled?: boolean;
  client_id?: string;
  client_secret?: string;
  metadata_url?: string;
}

// --- BEGIN COMMENT ---
// 🎯 配置验证结果
// --- END COMMENT ---
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// --- BEGIN COMMENT ---
// 🎯 连接测试结果
// --- END COMMENT ---
export interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  responseTime?: number;
}

// --- BEGIN COMMENT ---
// 🎯 获取所有SSO提供商
// 支持筛选、搜索和排序
// --- END COMMENT ---
export async function getAllSSOProviders(filters?: SSOProviderFilters): Promise<SsoProvider[]> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('sso_providers')
      .select('*');

    // 应用筛选条件
    if (filters?.protocol) {
      query = query.eq('protocol', filters.protocol);
    }
    
    if (filters?.enabled !== undefined) {
      query = query.eq('enabled', filters.enabled);
    }
    
    // 搜索功能：支持按名称和按钮文本搜索
    if (filters?.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${searchTerm},button_text.ilike.${searchTerm}`);
    }
    
    // 排序
    const orderBy = filters?.orderBy || 'display_order';
    const orderDirection = filters?.orderDirection || 'asc';
    
    if (orderBy === 'display_order') {
      // 显示顺序排序：先按display_order，再按name
      query = query.order('display_order', { ascending: orderDirection === 'asc' })
                   .order('name', { ascending: true });
    } else {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch SSO providers:', error);
      throw new Error(`获取SSO提供商列表失败: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllSSOProviders:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 根据ID获取SSO提供商
// --- END COMMENT ---
export async function getSSOProviderById(id: string): Promise<SsoProvider | null> {
  try {
    if (!id || !id.trim()) {
      throw new Error('提供商ID不能为空');
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      console.error('Failed to fetch SSO provider by ID:', error);
      throw new Error(`获取SSO提供商失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getSSOProviderById:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 根据名称获取SSO提供商
// 用于查找特定的提供商（如北京信息科技大学）
// --- END COMMENT ---
export async function getSSOProviderByName(name: string): Promise<SsoProvider | null> {
  try {
    if (!name || !name.trim()) {
      throw new Error('提供商名称不能为空');
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('name', name.trim())
      .eq('enabled', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      console.error('Failed to fetch SSO provider by name:', error);
      throw new Error(`获取SSO提供商失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getSSOProviderByName:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 创建新的SSO提供商
// 需要管理员权限
// --- END COMMENT ---
export async function createSSOProvider(data: CreateSSOProviderData): Promise<SsoProvider> {
  try {
    // 基础数据验证
    if (!data.name || !data.name.trim()) {
      throw new Error('提供商名称不能为空');
    }
    
    if (!data.protocol) {
      throw new Error('协议类型不能为空');
    }
    
    if (!data.settings || !data.settings.protocol_config) {
      throw new Error('协议配置不能为空');
    }

    const supabase = await createAdminClient();
    
    // 检查名称是否已存在
    const { data: existing } = await supabase
      .from('sso_providers')
      .select('id')
      .eq('name', data.name.trim())
      .single();
      
    if (existing) {
      throw new Error(`提供商名称 "${data.name}" 已存在`);
    }
    
    // 如果没有指定显示顺序，设为最大值+1
    let displayOrder = data.display_order;
    if (displayOrder === undefined) {
      const { data: maxOrderData } = await supabase
        .from('sso_providers')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);
        
      displayOrder = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].display_order || 0) + 1 
        : 1;
    }

    const insertData = {
      name: data.name.trim(),
      protocol: data.protocol,
      settings: data.settings,
      button_text: data.button_text?.trim() || null,
      display_order: displayOrder,
      enabled: data.enabled !== undefined ? data.enabled : true,
      client_id: data.client_id?.trim() || null,
      client_secret: data.client_secret?.trim() || null,
      metadata_url: data.metadata_url?.trim() || null,
    };

    const { data: newProvider, error } = await supabase
      .from('sso_providers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create SSO provider:', error);
      throw new Error(`创建SSO提供商失败: ${error.message}`);
    }

    console.log(`SSO provider created successfully: ${newProvider.name}`);
    return newProvider;
  } catch (error) {
    console.error('Error in createSSOProvider:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 更新SSO提供商
// 需要管理员权限
// --- END COMMENT ---
export async function updateSSOProvider(id: string, data: UpdateSSOProviderData): Promise<SsoProvider> {
  try {
    if (!id || !id.trim()) {
      throw new Error('提供商ID不能为空');
    }

    const supabase = await createAdminClient();
    
    // 检查提供商是否存在
    const existing = await getSSOProviderById(id);
    if (!existing) {
      throw new Error('SSO提供商不存在');
    }
    
    // 如果更新名称，检查新名称是否已被其他提供商使用
    if (data.name && data.name.trim() !== existing.name) {
      const { data: nameExists } = await supabase
        .from('sso_providers')
        .select('id')
        .eq('name', data.name.trim())
        .neq('id', id)
        .single();
        
      if (nameExists) {
        throw new Error(`提供商名称 "${data.name}" 已被其他提供商使用`);
      }
    }

    // 构建更新数据
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.protocol !== undefined) updateData.protocol = data.protocol;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.button_text !== undefined) updateData.button_text = data.button_text?.trim() || null;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.client_id !== undefined) updateData.client_id = data.client_id?.trim() || null;
    if (data.client_secret !== undefined) updateData.client_secret = data.client_secret?.trim() || null;
    if (data.metadata_url !== undefined) updateData.metadata_url = data.metadata_url?.trim() || null;

    const { data: updatedProvider, error } = await supabase
      .from('sso_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update SSO provider:', error);
      throw new Error(`更新SSO提供商失败: ${error.message}`);
    }

    console.log(`SSO provider updated successfully: ${updatedProvider.name}`);
    return updatedProvider;
  } catch (error) {
    console.error('Error in updateSSOProvider:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 删除SSO提供商
// 需要管理员权限，软删除（设为禁用）
// --- END COMMENT ---
export async function deleteSSOProvider(id: string): Promise<boolean> {
  try {
    if (!id || !id.trim()) {
      throw new Error('提供商ID不能为空');
    }

    const supabase = await createAdminClient();
    
    // 检查提供商是否存在
    const existing = await getSSOProviderById(id);
    if (!existing) {
      throw new Error('SSO提供商不存在');
    }

    // 软删除：设为禁用状态
    const { error } = await supabase
      .from('sso_providers')
      .update({ 
        enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete SSO provider:', error);
      throw new Error(`删除SSO提供商失败: ${error.message}`);
    }

    console.log(`SSO provider disabled successfully: ${existing.name}`);
    return true;
  } catch (error) {
    console.error('Error in deleteSSOProvider:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 获取所有协议模板
// --- END COMMENT ---
export async function getAllProtocolTemplates(): Promise<SsoProtocolTemplate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sso_protocol_templates')
      .select('*')
      .order('protocol');

    if (error) {
      console.error('Failed to fetch protocol templates:', error);
      throw new Error(`获取协议模板失败: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllProtocolTemplates:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 根据协议类型获取模板
// --- END COMMENT ---
export async function getProtocolTemplate(protocol: SsoProtocol): Promise<SsoProtocolTemplate | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sso_protocol_templates')
      .select('*')
      .eq('protocol', protocol)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      console.error('Failed to fetch protocol template:', error);
      throw new Error(`获取协议模板失败: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getProtocolTemplate:', error);
    throw error;
  }
}

// --- BEGIN COMMENT ---
// 🎯 验证SSO提供商配置
// 基于协议模板的JSON Schema进行验证
// --- END COMMENT ---
export async function validateProviderConfig(
  protocol: SsoProtocol, 
  settings: any
): Promise<ValidationResult> {
  try {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基础验证
    if (!settings || typeof settings !== 'object') {
      errors.push('配置不能为空且必须是对象');
      return { isValid: false, errors, warnings };
    }

    // 协议配置验证
    const protocolConfig = settings.protocol_config;
    if (!protocolConfig || typeof protocolConfig !== 'object') {
      errors.push('protocol_config 配置不能为空');
      return { isValid: false, errors, warnings };
    }

    // 根据协议类型进行特定验证
    switch (protocol) {
      case 'CAS':
        if (!protocolConfig.base_url) {
          errors.push('CAS协议必须配置 base_url');
        } else if (!isValidURL(protocolConfig.base_url)) {
          errors.push('base_url 格式无效');
        }
        
        if (!protocolConfig.endpoints) {
          errors.push('CAS协议必须配置 endpoints');
        } else {
          if (!protocolConfig.endpoints.login) errors.push('缺少登录端点配置');
          if (!protocolConfig.endpoints.logout) errors.push('缺少注销端点配置');
          if (!protocolConfig.endpoints.validate) errors.push('缺少验证端点配置');
        }
        break;
        
      case 'OIDC':
        if (!protocolConfig.issuer) {
          errors.push('OIDC协议必须配置 issuer');
        } else if (!isValidURL(protocolConfig.issuer)) {
          errors.push('issuer URL 格式无效');
        }
        break;
        
      case 'SAML':
        if (!protocolConfig.metadata_url && !protocolConfig.entity_id) {
          errors.push('SAML协议必须配置 metadata_url 或 entity_id');
        }
        break;
    }

    // 安全配置验证
    const security = settings.security;
    if (security) {
      if (security.require_https === false) {
        warnings.push('建议在生产环境中启用HTTPS要求');
      }
      if (security.validate_certificates === false) {
        warnings.push('建议在生产环境中启用证书验证');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    console.error('Error in validateProviderConfig:', error);
    return {
      isValid: false,
      errors: ['配置验证过程中发生错误']
    };
  }
}

// --- BEGIN COMMENT ---
// 🎯 测试SSO提供商连接
// 验证配置的可达性和正确性
// --- END COMMENT ---
export async function testProviderConnection(id: string): Promise<TestResult> {
  try {
    const provider = await getSSOProviderById(id);
    if (!provider) {
      return {
        success: false,
        message: 'SSO提供商不存在'
      };
    }

    if (!provider.enabled) {
      return {
        success: false,
        message: 'SSO提供商已禁用'
      };
    }

    const protocolConfig = provider.settings.protocol_config;
    if (!protocolConfig) {
      return {
        success: false,
        message: '协议配置缺失'
      };
    }

    const startTime = Date.now();

    try {
      // 根据协议类型进行不同的连接测试
      switch (provider.protocol) {
        case 'CAS':
          return await testCASConnection(protocolConfig, startTime);
        case 'OIDC':
          return await testOIDCConnection(protocolConfig, startTime);
        case 'SAML':
          return await testSAMLConnection(protocolConfig, startTime);
        default:
          return {
            success: false,
            message: `暂不支持 ${provider.protocol} 协议的连接测试`
          };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接测试失败',
        details: { error: String(error) },
        responseTime
      };
    }
  } catch (error) {
    console.error('Error in testProviderConnection:', error);
    return {
      success: false,
      message: '连接测试过程中发生错误'
    };
  }
}

// --- BEGIN COMMENT ---
// 🎯 辅助函数：测试CAS连接
// --- END COMMENT ---
async function testCASConnection(protocolConfig: any, startTime: number): Promise<TestResult> {
  const baseUrl = protocolConfig.base_url;
  const loginEndpoint = protocolConfig.endpoints?.login || '/login';
  const testUrl = `${baseUrl}${loginEndpoint}`;

  try {
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(protocolConfig.timeout || 10000)
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      message: response.ok ? '连接成功' : `HTTP ${response.status}: ${response.statusText}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        url: testUrl,
        headers: Object.fromEntries(response.headers.entries())
      },
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    throw new Error(`CAS服务器连接失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- BEGIN COMMENT ---
// 🎯 辅助函数：测试OIDC连接
// --- END COMMENT ---
async function testOIDCConnection(protocolConfig: any, startTime: number): Promise<TestResult> {
  const issuer = protocolConfig.issuer;
  const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;

  try {
    const response = await fetch(wellKnownUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(protocolConfig.timeout || 10000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const config = await response.json();
      return {
        success: true,
        message: 'OIDC配置获取成功',
        details: {
          issuer: config.issuer,
          authorization_endpoint: config.authorization_endpoint,
          token_endpoint: config.token_endpoint,
          userinfo_endpoint: config.userinfo_endpoint
        },
        responseTime
      };
    } else {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          url: wellKnownUrl
        },
        responseTime
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    throw new Error(`OIDC服务器连接失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- BEGIN COMMENT ---
// 🎯 辅助函数：测试SAML连接
// --- END COMMENT ---
async function testSAMLConnection(protocolConfig: any, startTime: number): Promise<TestResult> {
  const metadataUrl = protocolConfig.metadata_url;
  if (!metadataUrl) {
    return {
      success: false,
      message: 'SAML协议需要配置 metadata_url 才能进行连接测试'
    };
  }

  try {
    const response = await fetch(metadataUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(protocolConfig.timeout || 10000)
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      message: response.ok ? 'SAML元数据获取成功' : `HTTP ${response.status}: ${response.statusText}`,
      details: {
        status: response.status,
        url: metadataUrl,
        contentType: response.headers.get('content-type')
      },
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    throw new Error(`SAML服务器连接失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- BEGIN COMMENT ---
// 🎯 辅助函数：验证URL格式
// --- END COMMENT ---
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// --- BEGIN COMMENT ---
// 🎯 获取启用的SSO提供商（用于登录页面）
// 按显示顺序排序
// --- END COMMENT ---
export async function getEnabledSSOProviders(): Promise<SsoProvider[]> {
  return getAllSSOProviders({
    enabled: true,
    orderBy: 'display_order',
    orderDirection: 'asc'
  });
} 