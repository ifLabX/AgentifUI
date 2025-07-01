// --- BEGIN COMMENT ---
// SSO数据库服务层
// 负责与sso_providers表交互，提供完整的CRUD功能
// 支持缓存、事务处理和数据验证
// --- END COMMENT ---
import { createClient as createSupabaseClient } from '@lib/supabase/client';
import { createClient as createSupabaseServerClient } from '@lib/supabase/server';
import type { SsoProtocol, SsoProvider } from '@lib/types/sso/admin-types';

// --- BEGIN COMMENT ---
// 提供商状态枚举
// --- END COMMENT ---
export type ProviderStatus = 'active' | 'inactive';

// --- BEGIN COMMENT ---
// SSO数据库服务类
// 提供与sso_providers表的完整交互功能
// --- END COMMENT ---
export class SSODatabaseService {
  private isServer: boolean;

  constructor(isServer: boolean = true) {
    this.isServer = isServer;
  }

  // --- BEGIN COMMENT ---
  // 获取Supabase客户端实例
  // --- END COMMENT ---
  private async getSupabaseClient() {
    return this.isServer
      ? await createSupabaseServerClient()
      : createSupabaseClient();
  }

  // --- BEGIN COMMENT ---
  // 获取所有SSO提供商列表
  // 支持状态过滤和排序
  // --- END COMMENT ---
  async getAllProviders(statusFilter?: ProviderStatus): Promise<SsoProvider[]> {
    const supabase = await this.getSupabaseClient();

    let query = supabase
      .from('sso_providers')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (statusFilter) {
      query = query.eq('enabled', statusFilter === 'active');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch SSO providers: ${error.message}`);
    }

    return (data || []).map(this.mapRowToProvider);
  }

  // --- BEGIN COMMENT ---
  // 获取活跃的SSO提供商
  // 用于登录页面显示
  // --- END COMMENT ---
  async getActiveProviders(): Promise<SsoProvider[]> {
    return this.getAllProviders('active');
  }

  // --- BEGIN COMMENT ---
  // 根据ID获取特定提供商
  // --- END COMMENT ---
  async getProviderById(id: string): Promise<SsoProvider | null> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Provider not found
      }
      throw new Error(`Failed to fetch SSO provider: ${error.message}`);
    }

    return this.mapRowToProvider(data);
  }

  // --- BEGIN COMMENT ---
  // 根据协议类型获取提供商
  // --- END COMMENT ---
  async getProvidersByProtocol(protocol: SsoProtocol): Promise<SsoProvider[]> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('protocol', protocol)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch SSO providers by protocol: ${error.message}`
      );
    }

    return (data || []).map(this.mapRowToProvider);
  }

  // --- BEGIN COMMENT ---
  // 创建新的SSO提供商
  // --- END COMMENT ---
  async createProvider(
    provider: Omit<SsoProvider, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SsoProvider> {
    const supabase = await this.getSupabaseClient();

    // 确保display_order
    if (provider.display_order === undefined) {
      provider.display_order = await this.getNextDisplayOrder();
    }

    const insertData = {
      name: provider.name,
      protocol: provider.protocol,
      settings: provider.settings as any,
      client_id: provider.client_id,
      client_secret: provider.client_secret,
      metadata_url: provider.metadata_url,
      enabled: provider.enabled,
      display_order: provider.display_order,
      button_text: provider.button_text,
    };

    const { data, error } = await supabase
      .from('sso_providers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create SSO provider: ${error.message}`);
    }

    return this.mapRowToProvider(data);
  }

  // --- BEGIN COMMENT ---
  // 更新现有SSO提供商
  // --- END COMMENT ---
  async updateProvider(
    id: string,
    updates: Partial<Omit<SsoProvider, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<SsoProvider> {
    const supabase = await this.getSupabaseClient();

    const updateData: any = {
      ...(updates.name && { name: updates.name }),
      ...(updates.protocol && { protocol: updates.protocol }),
      ...(updates.settings && { settings: updates.settings as any }),
      ...(updates.client_id !== undefined && { client_id: updates.client_id }),
      ...(updates.client_secret !== undefined && {
        client_secret: updates.client_secret,
      }),
      ...(updates.metadata_url !== undefined && {
        metadata_url: updates.metadata_url,
      }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.display_order !== undefined && {
        display_order: updates.display_order,
      }),
      ...(updates.button_text !== undefined && {
        button_text: updates.button_text,
      }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sso_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update SSO provider: ${error.message}`);
    }

    return this.mapRowToProvider(data);
  }

  // --- BEGIN COMMENT ---
  // 删除SSO提供商
  // --- END COMMENT ---
  async deleteProvider(id: string): Promise<void> {
    const supabase = await this.getSupabaseClient();

    const { error } = await supabase
      .from('sso_providers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete SSO provider: ${error.message}`);
    }
  }

  // --- BEGIN COMMENT ---
  // 批量更新提供商显示顺序
  // --- END COMMENT ---
  async updateDisplayOrder(
    providers: Array<{ id: string; display_order: number }>
  ): Promise<void> {
    const supabase = await this.getSupabaseClient();

    const updatePromises = providers.map(({ id, display_order }) =>
      supabase
        .from('sso_providers')
        .update({
          display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);

    for (const result of results) {
      if (result.error) {
        throw new Error(
          `Failed to update display order: ${result.error.message}`
        );
      }
    }
  }

  // --- BEGIN COMMENT ---
  // 切换提供商状态
  // --- END COMMENT ---
  async toggleProviderStatus(id: string): Promise<SsoProvider> {
    const provider = await this.getProviderById(id);
    if (!provider) {
      throw new Error(`SSO provider not found: ${id}`);
    }

    const newEnabled = !provider.enabled;
    return this.updateProvider(id, { enabled: newEnabled });
  }

  // --- BEGIN COMMENT ---
  // 获取下一个显示顺序值
  // --- END COMMENT ---
  private async getNextDisplayOrder(): Promise<number> {
    const supabase = await this.getSupabaseClient();

    const { data, error } = await supabase
      .from('sso_providers')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get next display order: ${error.message}`);
    }

    return (data?.display_order || 0) + 1;
  }

  // --- BEGIN COMMENT ---
  // 将数据库行映射为SsoProvider类型
  // --- END COMMENT ---
  private mapRowToProvider(row: any): SsoProvider {
    return {
      id: row.id,
      name: row.name,
      protocol: row.protocol as SsoProtocol,
      settings: row.settings as any,
      client_id: row.client_id,
      client_secret: row.client_secret,
      metadata_url: row.metadata_url,
      enabled: row.enabled,
      display_order: row.display_order,
      button_text: row.button_text,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // --- BEGIN COMMENT ---
  // 验证提供商配置
  // --- END COMMENT ---
  async validateProviderConfig(
    provider: SsoProvider
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 基础字段验证
    if (!provider.name || provider.name.trim().length === 0) {
      errors.push('Provider name is required');
    }

    if (!provider.protocol) {
      errors.push('Protocol is required');
    }

    // 协议特定配置验证
    if (provider.settings) {
      const config = provider.settings.protocol_config;
      if (!config) {
        errors.push('Protocol configuration is required');
        return { valid: false, errors };
      }

      switch (provider.protocol) {
        case 'CAS':
          if (!config.base_url) {
            errors.push('CAS base URL is required');
          }
          if (!config.endpoints?.login) {
            errors.push('CAS login endpoint is required');
          }
          if (!config.endpoints?.validate) {
            errors.push('CAS validate endpoint is required');
          }
          break;

        case 'OIDC':
          if (!provider.client_id) {
            errors.push('OIDC client ID is required');
          }
          if (!provider.client_secret) {
            errors.push('OIDC client secret is required');
          }
          if (!config.base_url && !config.issuer) {
            errors.push('OIDC issuer URL is required');
          }
          break;

        case 'SAML':
          if (!config.entity_id && !provider.metadata_url) {
            errors.push('SAML entity ID or metadata URL is required');
          }
          if (!config.base_url && !config.sso_url) {
            errors.push('SAML SSO URL is required');
          }
          break;

        case 'OAuth2':
          if (!provider.client_id) {
            errors.push('OAuth2 client ID is required');
          }
          if (!provider.client_secret) {
            errors.push('OAuth2 client secret is required');
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // --- BEGIN COMMENT ---
  // 检查提供商名称是否已存在
  // --- END COMMENT ---
  async isProviderNameExists(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    const supabase = await this.getSupabaseClient();

    let query = supabase.from('sso_providers').select('id').eq('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check provider name: ${error.message}`);
    }

    return (data || []).length > 0;
  }
}
