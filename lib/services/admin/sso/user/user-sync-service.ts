// --- BEGIN COMMENT ---
// SSO用户同步服务
// 负责将SSO认证后的用户信息同步到本地用户系统
// 支持用户创建、更新、权限分配和组织架构同步
// --- END COMMENT ---
import {
  createAdminClient,
  createClient as createSupabaseServerClient,
} from '@lib/supabase/server';
import type { Profile } from '@lib/types/database';
import type { SSOUserInfo } from '@lib/types/sso/admin-types';

type UserProfile = Profile;

// --- BEGIN COMMENT ---
// 用户同步结果接口
// --- END COMMENT ---
export interface UserSyncResult {
  user: UserProfile;
  created: boolean;
  updated: boolean;
  errors: string[];
}

// --- BEGIN COMMENT ---
// 用户同步配置接口
// --- END COMMENT ---
export interface UserSyncConfig {
  autoCreateUser: boolean;
  autoUpdateProfile: boolean;
  defaultRole?: string;
  allowedDomains?: string[];
}

// --- BEGIN COMMENT ---
// SSO用户同步服务类
// 负责处理SSO认证后的用户信息同步
// --- END COMMENT ---
export class UserSyncService {
  private config: UserSyncConfig;

  constructor(config?: Partial<UserSyncConfig>) {
    this.config = {
      autoCreateUser: true,
      autoUpdateProfile: true,
      defaultRole: 'user',
      ...config,
    };
  }

  // --- BEGIN COMMENT ---
  // 静态同步用户方法（API调用接口）
  // --- END COMMENT ---
  static async syncUser(
    userInfo: SSOUserInfo,
    provider: { id: string; name: string }
  ): Promise<UserProfile> {
    const service = new UserSyncService();
    // 核心修正：传入providerId和providerName
    const result = await service.syncUser(userInfo, provider.id, provider.name);

    if (result.errors.length > 0) {
      throw new Error(`用户同步失败: ${result.errors.join(', ')}`);
    }

    return result.user;
  }

  // --- BEGIN COMMENT ---
  // 获取Supabase Admin客户端实例，用于所有数据库操作以绕过RLS
  // --- END COMMENT ---
  private async getSupabaseAdminClient() {
    return await createAdminClient();
  }

  // --- BEGIN COMMENT ---
  // 同步SSO用户信息到本地系统
  // 核心功能：处理用户创建或更新
  // --- END COMMENT ---
  async syncUser(
    ssoUserInfo: SSOUserInfo,
    providerId: string,
    providerName: string // 增加providerName参数
  ): Promise<UserSyncResult> {
    const result: UserSyncResult = {
      user: {} as UserProfile,
      created: false,
      updated: false,
      errors: [],
    };

    try {
      // 验证用户信息
      const validationErrors = this.validateUserInfo(ssoUserInfo);
      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        return result;
      }

      // 查找现有用户
      const existingUser = await this.findExistingUser(ssoUserInfo);

      if (existingUser) {
        // 更新现有用户
        const updateResult = await this.updateExistingUser(
          existingUser,
          ssoUserInfo
        );
        result.user = updateResult.user;
        result.updated = updateResult.updated;
        result.errors = updateResult.errors;
      } else {
        // 创建新用户
        if (this.config.autoCreateUser) {
          const createResult = await this.createNewUser(
            ssoUserInfo,
            providerId,
            providerName // 传入providerName
          );
          result.user = createResult.user;
          result.created = createResult.created;
          result.errors = createResult.errors;
        } else {
          result.errors.push('Auto user creation is disabled');
        }
      }
    } catch (error) {
      result.errors.push(
        `User sync failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return result;
  }

  // --- BEGIN COMMENT ---
  // 验证SSO用户信息
  // --- END COMMENT ---
  private validateUserInfo(userInfo: SSOUserInfo): string[] {
    const errors: string[] = [];

    if (!userInfo.username || userInfo.username.trim().length === 0) {
      errors.push('Username is required');
    }

    if (!userInfo.id || userInfo.id.trim().length === 0) {
      // 在CAS中，id通常是employeeNumber
      errors.push('User ID (employee_number) is required');
    }

    // 验证邮箱域名（如果配置了允许的域名）
    if (userInfo.email && this.config.allowedDomains) {
      const emailDomain = userInfo.email.split('@')[1];
      if (!this.config.allowedDomains.includes(emailDomain)) {
        errors.push(`Email domain ${emailDomain} is not allowed`);
      }
    }

    return errors;
  }

  // --- BEGIN COMMENT ---
  // 查找现有用户
  // 使用Admin Client以绕过RLS
  // 按工号(id)、用户名或邮箱查找
  // --- END COMMENT ---
  private async findExistingUser(
    userInfo: SSOUserInfo
  ): Promise<UserProfile | null> {
    const supabase = await this.getSupabaseAdminClient();
    let queryBuilder = supabase.from('profiles').select('*');

    const conditions = [`employee_number.eq.${userInfo.id}`];
    if (userInfo.username) {
      conditions.push(`username.eq.${userInfo.username}`);
    }
    if (userInfo.email) {
      conditions.push(`email.eq.${userInfo.email}`);
    }

    queryBuilder = queryBuilder.or(conditions.join(','));

    const { data, error } = await queryBuilder.limit(1).maybeSingle();

    if (error) {
      throw new Error(`Failed to find existing user: ${error.message}`);
    }

    return data || null;
  }

  // --- BEGIN COMMENT ---
  // 更新现有用户信息
  // 使用Admin Client以绕过RLS
  // --- END COMMENT ---
  private async updateExistingUser(
    existingUser: UserProfile,
    ssoUserInfo: SSOUserInfo
  ): Promise<{ user: UserProfile; updated: boolean; errors: string[] }> {
    const errors: string[] = [];
    let updated = false;

    try {
      const supabase = await this.getSupabaseAdminClient();

      if (this.config.autoUpdateProfile) {
        const updateData: Partial<UserProfile> = {};

        // 更新基础信息
        if (ssoUserInfo.name && ssoUserInfo.name !== existingUser.full_name) {
          updateData.full_name = ssoUserInfo.name;
        }

        if (ssoUserInfo.email && ssoUserInfo.email !== existingUser.email) {
          updateData.email = ssoUserInfo.email;
        }

        // 确保工号信息同步
        if (ssoUserInfo.id && ssoUserInfo.id !== existingUser.employee_number) {
          updateData.employee_number = ssoUserInfo.id;
        }

        if (Object.keys(updateData).length > 0) {
          updated = true;
        }
      }

      // 总是更新最后登录时间
      const finalUpdateData: any = {
        ...(updated ? { ...existingUser, ...ssoUserInfo } : {}),
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(finalUpdateData)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) {
        errors.push(`Failed to update user profile: ${error.message}`);
        return { user: existingUser, updated: false, errors };
      }

      return { user: data, updated, errors };
    } catch (error) {
      errors.push(
        `Failed to update existing user: ${error instanceof Error ? error.message : String(error)}`
      );
      return { user: existingUser, updated: false, errors };
    }
  }

  // --- BEGIN COMMENT ---
  // 创建新用户
  // 修正：使用Admin Client创建auth.users记录，让触发器创建profile
  // --- END COMMENT ---
  private async createNewUser(
    ssoUserInfo: SSOUserInfo,
    providerId: string,
    providerName: string
  ): Promise<{ user: UserProfile; created: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const supabase = await this.getSupabaseAdminClient();

      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          // 如果提供了email就用，否则基于username或id构建
          email: ssoUserInfo.email || `${ssoUserInfo.username}@sso.local`,
          user_metadata: {
            full_name: ssoUserInfo.name || ssoUserInfo.username,
            username: ssoUserInfo.username,
            employee_number: ssoUserInfo.id,
            auth_source: 'sso',
            sso_provider_id: providerId,
            sso_provider_name: providerName,
          },
          app_metadata: {
            provider: 'sso',
            provider_id: providerId,
            employee_number: ssoUserInfo.id,
          },
          email_confirm: true, // SSO用户自动确认邮箱
        });

      if (authError) {
        // 处理邮箱冲突，尝试查找用户
        if (authError.message.includes('already been registered')) {
          const existingUser = await this.findExistingUser(ssoUserInfo);
          if (existingUser) {
            return { user: existingUser, created: false, errors };
          }
        }
        errors.push(`Failed to create auth user: ${authError.message}`);
        return { user: {} as UserProfile, created: false, errors };
      }

      if (!authUser.user) {
        throw new Error('Failed to create auth user: no user returned');
      }

      // 等待并查找由触发器创建的profile
      let profile = await this.waitForProfile(authUser.user.id);

      if (!profile) {
        // 如果触发器失败，手动创建profile作为备用方案
        profile = await this.manuallyCreateProfile(
          authUser.user.id,
          ssoUserInfo,
          providerId
        );
      } else {
        // 触发器成功，但可能需要补充信息
        profile = await this.updateProfileWithSSOData(
          profile.id,
          ssoUserInfo,
          providerId
        );
      }

      return { user: profile, created: true, errors };
    } catch (error) {
      errors.push(
        `Failed to create new user: ${error instanceof Error ? error.message : String(error)}`
      );
      return { user: {} as UserProfile, created: false, errors };
    }
  }

  // --- BEGIN COMMENT ---
  // 辅助函数：等待并重试查找Profile
  // --- END COMMENT ---
  private async waitForProfile(
    userId: string,
    retries = 5,
    delay = 500
  ): Promise<UserProfile | null> {
    const supabase = await this.getSupabaseAdminClient();
    for (let i = 0; i < retries; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        return data;
      }
      await new Promise(res => setTimeout(res, delay));
    }
    return null;
  }

  // --- BEGIN COMMENT ---
  // 辅助函数：手动创建Profile（作为备用方案）
  // --- END COMMENT ---
  private async manuallyCreateProfile(
    userId: string,
    ssoUserInfo: SSOUserInfo,
    providerId: string
  ): Promise<UserProfile> {
    const supabase = await this.getSupabaseAdminClient();
    const insertData: any = this.buildProfileData(ssoUserInfo, providerId);
    insertData.id = userId;

    const { data, error } = await supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Manual profile creation failed: ${error.message}`);
    }
    return data;
  }

  // --- BEGIN COMMENT ---
  // 辅助函数：使用SSO数据更新Profile
  // --- END COMMENT ---
  private async updateProfileWithSSOData(
    userId: string,
    ssoUserInfo: SSOUserInfo,
    providerId: string
  ): Promise<UserProfile> {
    const supabase = await this.getSupabaseAdminClient();
    const updateData = this.buildProfileData(ssoUserInfo, providerId);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update with SSO data failed: ${error.message}`);
    }
    return data;
  }

  // --- BEGIN COMMENT ---
  // 辅助函数：构建Profile数据对象
  // --- END COMMENT ---
  private buildProfileData(
    ssoUserInfo: SSOUserInfo,
    providerId: string
  ): Omit<UserProfile, 'id' | 'created_at'> {
    return {
      employee_number: ssoUserInfo.id,
      username: ssoUserInfo.username,
      full_name: ssoUserInfo.name || ssoUserInfo.username,
      email: ssoUserInfo.email || undefined,
      role: (this.config.defaultRole as 'user' | 'admin') || 'user',
      auth_source: 'sso',
      status: 'active',
      sso_provider_id: providerId,
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
