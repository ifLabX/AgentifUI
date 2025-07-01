// --- BEGIN COMMENT ---
// SSO用户同步服务
// 负责将SSO认证后的用户信息同步到本地用户系统
// 支持用户创建、更新、权限分配和组织架构同步
// --- END COMMENT ---
import { createClient as createSupabaseServerClient } from '@lib/supabase/server';
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
  requireEmailVerification: boolean;
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
      requireEmailVerification: false,
      ...config,
    };
  }

  // --- BEGIN COMMENT ---
  // 静态同步用户方法（API调用接口）
  // --- END COMMENT ---
  static async syncUser(
    userInfo: SSOUserInfo,
    provider: { id: string; name: string }
  ): Promise<any> {
    const service = new UserSyncService();
    const result = await service.syncUser(userInfo, provider.id);

    if (result.errors.length > 0) {
      throw new Error(`用户同步失败: ${result.errors.join(', ')}`);
    }

    return result.user;
  }

  // --- BEGIN COMMENT ---
  // 获取Supabase客户端实例
  // --- END COMMENT ---
  private async getSupabaseClient() {
    return await createSupabaseServerClient();
  }

  // --- BEGIN COMMENT ---
  // 同步SSO用户信息到本地系统
  // 核心功能：处理用户创建或更新
  // --- END COMMENT ---
  async syncUser(
    ssoUserInfo: SSOUserInfo,
    providerId: string
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
          ssoUserInfo,
          providerId
        );
        result.user = updateResult.user;
        result.updated = updateResult.updated;
        result.errors = updateResult.errors;
      } else {
        // 创建新用户
        if (this.config.autoCreateUser) {
          const createResult = await this.createNewUser(
            ssoUserInfo,
            providerId
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
      errors.push('User ID is required');
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
  // 按工号、用户名或邮箱查找
  // --- END COMMENT ---
  private async findExistingUser(
    userInfo: SSOUserInfo
  ): Promise<UserProfile | null> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(
        `employee_number.eq.${userInfo.id},username.eq.${userInfo.username}${userInfo.email ? `,email.eq.${userInfo.email}` : ''}`
      )
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find existing user: ${error.message}`);
    }

    return data || null;
  }

  // --- BEGIN COMMENT ---
  // 更新现有用户信息
  // --- END COMMENT ---
  private async updateExistingUser(
    existingUser: UserProfile,
    ssoUserInfo: SSOUserInfo,
    providerId: string
  ): Promise<{ user: UserProfile; updated: boolean; errors: string[] }> {
    const errors: string[] = [];
    let updated = false;

    try {
      const supabase = await this.getSupabaseClient();

      if (this.config.autoUpdateProfile) {
        const updateData: any = {};

        // 更新基础信息
        if (ssoUserInfo.name && ssoUserInfo.name !== existingUser.full_name) {
          updateData.full_name = ssoUserInfo.name;
          updated = true;
        }

        if (ssoUserInfo.email && ssoUserInfo.email !== existingUser.email) {
          updateData.email = ssoUserInfo.email;
          updated = true;
        }

        // 确保工号信息同步
        if (ssoUserInfo.id && ssoUserInfo.id !== existingUser.employee_number) {
          updateData.employee_number = ssoUserInfo.id;
          updated = true;
        }

        // 更新最后登录时间
        updateData.last_login = new Date().toISOString();
        updated = true;

        if (updated) {
          updateData.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', existingUser.id)
            .select()
            .single();

          if (error) {
            errors.push(`Failed to update user profile: ${error.message}`);
            return { user: existingUser, updated: false, errors };
          }

          return { user: data, updated: true, errors };
        }
      }

      // 即使没有更新，也要更新最后登录时间
      const { data, error } = await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) {
        errors.push(`Failed to update last login: ${error.message}`);
        return { user: existingUser, updated: false, errors };
      }

      return { user: data, updated: false, errors };
    } catch (error) {
      errors.push(
        `Failed to update existing user: ${error instanceof Error ? error.message : String(error)}`
      );
      return { user: existingUser, updated: false, errors };
    }
  }

  // --- BEGIN COMMENT ---
  // 创建新用户
  // --- END COMMENT ---
  private async createNewUser(
    ssoUserInfo: SSOUserInfo,
    providerId: string
  ): Promise<{ user: UserProfile; created: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const supabase = await this.getSupabaseClient();

      const insertData: any = {
        employee_number: ssoUserInfo.id,
        username: ssoUserInfo.username,
        full_name: ssoUserInfo.name || ssoUserInfo.username,
        email: ssoUserInfo.email,
        role: this.config.defaultRole || 'user',
        auth_source: 'sso',
        status: 'active',
        sso_provider_id: providerId,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        errors.push(`Failed to create user: ${error.message}`);
        return { user: {} as UserProfile, created: false, errors };
      }

      return { user: data, created: true, errors };
    } catch (error) {
      errors.push(
        `Failed to create new user: ${error instanceof Error ? error.message : String(error)}`
      );
      return { user: {} as UserProfile, created: false, errors };
    }
  }

  // --- BEGIN COMMENT ---
  // 根据工号查找用户
  // --- END COMMENT ---
  async findUserByEmployeeNumber(
    employeeNumber: string
  ): Promise<UserProfile | null> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('employee_number', employeeNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(
        `Failed to find user by employee number: ${error.message}`
      );
    }

    return data || null;
  }

  // --- BEGIN COMMENT ---
  // 根据用户名查找用户
  // --- END COMMENT ---
  async findUserByUsername(username: string): Promise<UserProfile | null> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }

    return data || null;
  }

  // --- BEGIN COMMENT ---
  // 批量同步用户（用于批量导入或数据迁移）
  // --- END COMMENT ---
  async batchSyncUsers(
    userInfoList: SSOUserInfo[],
    providerId: string
  ): Promise<UserSyncResult[]> {
    const results: UserSyncResult[] = [];

    for (const userInfo of userInfoList) {
      try {
        const result = await this.syncUser(userInfo, providerId);
        results.push(result);
      } catch (error) {
        results.push({
          user: {} as UserProfile,
          created: false,
          updated: false,
          errors: [
            `Batch sync failed for user ${userInfo.username}: ${error instanceof Error ? error.message : String(error)}`,
          ],
        });
      }
    }

    return results;
  }

  // --- BEGIN COMMENT ---
  // 获取SSO用户统计信息
  // --- END COMMENT ---
  async getSSOUserStats(providerId?: string): Promise<{
    totalSSOUsers: number;
    activeUsers: number;
    lastWeekLogins: number;
  }> {
    const supabase = await this.getSupabaseClient();

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('auth_source', 'sso');

    if (providerId) {
      query = query.eq('sso_provider_id', providerId);
    }

    const { count: totalSSOUsers, error } = await query;

    if (error) {
      throw new Error(`Failed to get SSO user stats: ${error.message}`);
    }

    // 获取活跃用户数（最近30天有登录）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let activeQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('auth_source', 'sso')
      .gte('last_login', thirtyDaysAgo.toISOString());

    if (providerId) {
      activeQuery = activeQuery.eq('sso_provider_id', providerId);
    }

    const { count: activeUsers } = await activeQuery;

    // 获取最近一周登录数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let weekQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('auth_source', 'sso')
      .gte('last_login', oneWeekAgo.toISOString());

    if (providerId) {
      weekQuery = weekQuery.eq('sso_provider_id', providerId);
    }

    const { count: lastWeekLogins } = await weekQuery;

    return {
      totalSSOUsers: totalSSOUsers || 0,
      activeUsers: activeUsers || 0,
      lastWeekLogins: lastWeekLogins || 0,
    };
  }
}
