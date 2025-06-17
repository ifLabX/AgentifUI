// --- BEGIN COMMENT ---
// SSO用户管理服务
// 处理SSO用户的创建、查找和管理
// --- END COMMENT ---

import { createClient } from '@lib/supabase/server';
import type { Profile } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 创建SSO用户所需的数据
// --- END COMMENT ---
export interface CreateSSOUserData {
  employeeNumber: string;  // 学工号
  username: string;        // 用户名
  ssoProviderId: string;   // SSO提供商ID
  fullName?: string;       // 全名（可选）
}

// --- BEGIN COMMENT ---
// SSO用户查找结果
// --- END COMMENT ---
export interface SSOUserLookupResult {
  user: Profile | null;
  exists: boolean;
  isActive: boolean;
}

// --- BEGIN COMMENT ---
// SSO用户服务类
// --- END COMMENT ---
export class SSOUserService {
  /**
   * 通过学工号查找用户
   * @param employeeNumber 学工号
   * @returns 用户信息或null
   */
  static async findUserByEmployeeNumber(employeeNumber: string): Promise<Profile | null> {
    if (!employeeNumber || typeof employeeNumber !== 'string') {
      throw new Error('Employee number is required and must be a string');
    }

    try {
      const supabase = await createClient();
      
      console.log(`Looking up user by employee number: ${employeeNumber}`);

      // --- BEGIN COMMENT ---
      // 使用数据库函数查找用户，确保安全性和性能
      // --- END COMMENT ---
      const { data, error } = await supabase.rpc('find_user_by_employee_number', {
        emp_num: employeeNumber.trim(),
      });

      if (error) {
        console.error('Error finding user by employee number:', error);
        throw error;
      }

      // --- BEGIN COMMENT ---
      // 函数返回数组，取第一个结果
      // --- END COMMENT ---
      const userRecord = data && data.length > 0 ? data[0] : null;

      if (userRecord) {
        console.log(`Found user: ${userRecord.username} (${userRecord.employee_number})`);
        
        // --- BEGIN COMMENT ---
        // 转换数据库函数返回的格式为Profile接口格式
        // --- END COMMENT ---
        return {
          id: userRecord.user_id,
          full_name: userRecord.full_name,
          username: userRecord.username,
          employee_number: userRecord.employee_number,
          last_login: userRecord.last_login,
          auth_source: userRecord.auth_source,
          status: userRecord.status,
          // --- BEGIN COMMENT ---
          // 其他字段使用默认值或从其他查询获取
          // --- END COMMENT ---
          avatar_url: undefined,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sso_provider_id: null,
        } as Profile;
      }

      console.log(`No user found with employee number: ${employeeNumber}`);
      return null;
    } catch (error) {
      console.error('Failed to find user by employee number:', error);
      throw new Error(`Failed to find user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 创建SSO用户
   * @param userData 用户数据
   * @returns 创建的用户信息
   */
  static async createSSOUser(userData: CreateSSOUserData): Promise<Profile> {
    // --- BEGIN COMMENT ---
    // 验证输入数据
    // --- END COMMENT ---
    if (!userData.employeeNumber || !userData.username || !userData.ssoProviderId) {
      throw new Error('Employee number, username, and SSO provider ID are required');
    }

    try {
      const supabase = await createClient();
      
      console.log(`Creating SSO user: ${userData.username} (${userData.employeeNumber})`);

      // --- BEGIN COMMENT ---
      // 检查学工号是否已存在
      // --- END COMMENT ---
      const existingUser = await this.findUserByEmployeeNumber(userData.employeeNumber);
      if (existingUser) {
        throw new Error(`User with employee number ${userData.employeeNumber} already exists`);
      }

      // --- BEGIN COMMENT ---
      // 调用数据库函数创建用户
      // --- END COMMENT ---
      const { data: userId, error } = await supabase.rpc('create_sso_user', {
        emp_number: userData.employeeNumber.trim(),
        user_name: userData.fullName || userData.username.trim(),
        sso_provider_uuid: userData.ssoProviderId,
      });

      if (error) {
        console.error('Error creating SSO user:', error);
        throw error;
      }

      if (!userId) {
        throw new Error('Failed to create user: no user ID returned');
      }

      console.log(`Successfully created SSO user with ID: ${userId}`);

      // --- BEGIN COMMENT ---
      // 获取创建的用户完整信息
      // --- END COMMENT ---
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching created user profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        throw new Error('Created user profile not found');
      }

      console.log(`SSO user created successfully: ${profile.username}`);
      return profile;
    } catch (error) {
      console.error('Failed to create SSO user:', error);
      throw new Error(`Failed to create SSO user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新用户最后登录时间
   * @param userId 用户ID
   * @returns 是否更新成功
   */
  static async updateLastLogin(userId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const supabase = await createClient();
      
      console.log(`Updating last login time for user: ${userId}`);

      // --- BEGIN COMMENT ---
      // 使用数据库函数更新登录时间
      // --- END COMMENT ---
      const { data: success, error } = await supabase.rpc('update_sso_user_login', {
        user_uuid: userId,
      });

      if (error) {
        console.error('Error updating user last login:', error);
        throw error;
      }

      const updateSuccessful = success === true;
      console.log(`Last login update ${updateSuccessful ? 'successful' : 'failed'} for user: ${userId}`);
      
      return updateSuccessful;
    } catch (error) {
      console.error('Failed to update user last login:', error);
      throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取SSO用户详细查找结果
   * @param employeeNumber 学工号
   * @returns 查找结果包括用户信息和状态
   */
  static async lookupSSOUser(employeeNumber: string): Promise<SSOUserLookupResult> {
    try {
      const user = await this.findUserByEmployeeNumber(employeeNumber);
      
      return {
        user,
        exists: user !== null,
        isActive: user?.status === 'active' || false,
      };
    } catch (error) {
      console.error('Failed to lookup SSO user:', error);
      return {
        user: null,
        exists: false,
        isActive: false,
      };
    }
  }

  /**
   * 获取北信SSO提供商信息
   * @returns SSO提供商信息
   */
  static async getBistuSSOProvider(): Promise<{ id: string; name: string } | null> {
    try {
      const supabase = await createClient();
      
      // --- BEGIN COMMENT ---
      // 查找北京信息科技大学SSO提供商配置
      // --- END COMMENT ---
      const { data, error } = await supabase
        .from('sso_providers')
        .select('id, name')
        .eq('name', '北京信息科技大学')
        .eq('enabled', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 未找到记录
          console.warn('BISTU SSO provider not found in database');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get BISTU SSO provider:', error);
      return null;
    }
  }

  /**
   * 批量更新SSO用户信息（管理员功能）
   * @param updates 更新数据数组
   * @returns 更新结果
   */
  static async batchUpdateSSOUsers(
    updates: Array<{ employeeNumber: string; data: Partial<Profile> }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      try {
        const user = await this.findUserByEmployeeNumber(update.employeeNumber);
        if (!user) {
          result.failed++;
          result.errors.push(`User with employee number ${update.employeeNumber} not found`);
          continue;
        }

        const supabase = await createClient();
        const { error } = await supabase
          .from('profiles')
          .update({
            ...update.data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          result.failed++;
          result.errors.push(`Failed to update ${update.employeeNumber}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error processing ${update.employeeNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`Batch update completed: ${result.success} successful, ${result.failed} failed`);
    return result;
  }

  /**
   * 验证学工号格式
   * @param employeeNumber 学工号
   * @returns 是否有效
   */
  static validateEmployeeNumber(employeeNumber: string): boolean {
    if (!employeeNumber || typeof employeeNumber !== 'string') {
      return false;
    }
    
    // --- BEGIN COMMENT ---
    // 北信学工号格式验证
    // TODO: 请根据实际的学工号格式调整此正则表达式
    // 当前假设为10位数字，您可能需要根据实际情况修改
    // --- END COMMENT ---
    const trimmed = employeeNumber.trim();
    const pattern = /^\d{10}$/;
    return pattern.test(trimmed);
  }
} 