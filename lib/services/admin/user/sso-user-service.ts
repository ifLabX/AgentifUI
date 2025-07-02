// --- BEGIN COMMENT ---
// SSO用户管理服务
// 处理SSO用户的创建、查找和管理
// --- END COMMENT ---
import { createAdminClient, createClient } from '@lib/supabase/server';
import type { Profile } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 创建SSO用户所需的数据
// --- END COMMENT ---
export interface CreateSSOUserData {
  employeeNumber: string; // 学工号
  username: string; // 用户名
  ssoProviderId: string; // SSO提供商ID
  fullName?: string; // 全名（可选）
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
   * 通过学工号查找用户（实际通过邮箱查找）
   * @param employeeNumber 学工号
   * @returns 用户信息或null
   */
  static async findUserByEmployeeNumber(
    employeeNumber: string
  ): Promise<Profile | null> {
    if (!employeeNumber || typeof employeeNumber !== 'string') {
      throw new Error('Employee number is required and must be a string');
    }

    try {
      const supabase = await createClient();

      // --- BEGIN COMMENT ---
      // 构建SSO用户的邮箱地址（学工号@bistu.edu.cn）
      // 通过邮箱查找用户，因为email字段在触发器中会被正确设置
      // --- END COMMENT ---
      const email = `${employeeNumber.trim()}@bistu.edu.cn`;
      console.log(
        `Looking up user by email: ${email} (for employee: ${employeeNumber})`
      );

      // --- BEGIN COMMENT ---
      // 首先尝试通过普通客户端查找（受RLS策略限制）
      // --- END COMMENT ---
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(
            `No user found with email via normal client: ${email}, trying admin client...`
          );

          // --- BEGIN COMMENT ---
          // 如果普通客户端找不到，尝试使用Admin客户端（绕过RLS）
          // 这对于SSO用户查找很重要，因为可能存在RLS策略限制
          // --- END COMMENT ---
          try {
            const adminSupabase = await createAdminClient();
            const { data: adminData, error: adminError } = await adminSupabase
              .from('profiles')
              .select('*')
              .eq('email', email)
              .single();

            if (adminError) {
              if (adminError.code === 'PGRST116') {
                console.log(
                  `No user found with email via admin client: ${email}`
                );
                return null;
              }
              console.error(
                'Error finding user by email via admin client:',
                adminError
              );
              throw adminError;
            }

            if (adminData) {
              console.log(
                `Found user via admin client: ${adminData.username} (email: ${adminData.email})`
              );
              return adminData as Profile;
            }
          } catch (adminError) {
            console.warn(
              'Admin client lookup failed, user may not exist:',
              adminError
            );
            return null;
          }
        } else {
          console.error('Error finding user by email:', error);
          throw error;
        }
      }

      if (data) {
        console.log(
          `Found user via normal client: ${data.username} (email: ${data.email})`
        );
        return data as Profile;
      }

      console.log(`No user found with email: ${email}`);
      return null;
    } catch (error) {
      console.error(
        'Failed to find user by employee number (via email):',
        error
      );
      throw new Error(
        `Failed to find user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 通过ID直接查找用户（使用Admin客户端，绕过RLS）
   * @param userId 用户ID
   * @returns 用户信息或null
   */
  static async findUserByIdWithAdmin(userId: string): Promise<Profile | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const adminSupabase = await createAdminClient();

      console.log(`Looking up user by ID with admin client: ${userId}`);

      const { data, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No user found with ID: ${userId}`);
          return null;
        }
        console.error('Error finding user by ID:', error);
        throw error;
      }

      if (data) {
        console.log(`Found user by ID: ${data.username} (${data.email})`);
        return data as Profile;
      }

      return null;
    } catch (error) {
      console.error('Failed to find user by ID:', error);
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 创建SSO用户 - 使用Supabase Admin API
   * @param userData 用户数据
   * @returns 创建的用户信息
   */
  static async createSSOUser(userData: CreateSSOUserData): Promise<Profile> {
    // --- BEGIN COMMENT ---
    // 验证输入数据
    // --- END COMMENT ---
    if (
      !userData.employeeNumber ||
      !userData.username ||
      !userData.ssoProviderId
    ) {
      throw new Error(
        'Employee number, username, and SSO provider ID are required'
      );
    }

    try {
      // --- BEGIN COMMENT ---
      // 使用普通客户端查找用户，使用Admin客户端创建用户
      // --- END COMMENT ---
      const supabase = await createClient();
      const adminSupabase = await createAdminClient();

      console.log(
        `Creating SSO user: ${userData.username} (${userData.employeeNumber})`
      );

      // --- BEGIN COMMENT ---
      // 检查用户是否已存在（通过邮箱查找）
      // --- END COMMENT ---
      const existingUser = await this.findUserByEmployeeNumber(
        userData.employeeNumber
      );
      if (existingUser) {
        console.log(
          `User already exists for employee ${userData.employeeNumber}, returning existing user`
        );
        return existingUser;
      }

      // --- BEGIN COMMENT ---
      // 使用Supabase Admin API创建auth.users记录
      // 这样会同时创建auth.users记录和通过触发器自动创建profiles记录
      // --- END COMMENT ---
      const email = `${userData.employeeNumber}@bistu.edu.cn`; // 使用学工号生成邮箱

      console.log(
        `Creating auth user with email: ${email}, employee_number: ${userData.employeeNumber}`
      );

      const { data: authUser, error: authError } =
        await adminSupabase.auth.admin.createUser({
          email,
          user_metadata: {
            full_name: userData.fullName || userData.username,
            username: userData.username,
            employee_number: userData.employeeNumber,
            auth_source: 'bistu_sso',
            sso_provider_id: userData.ssoProviderId,
          },
          app_metadata: {
            provider: 'bistu_sso',
            employee_number: userData.employeeNumber,
          },
          email_confirm: true, // SSO用户自动确认邮箱
        });

      // --- BEGIN COMMENT ---
      // 处理邮箱冲突问题
      // 如果邮箱已存在，说明用户已经注册过，尝试查找现有用户
      // --- END COMMENT ---
      if (authError && authError.message.includes('already been registered')) {
        console.log(
          `Email ${email} already exists, trying to find existing user`
        );

        // --- BEGIN COMMENT ---
        // 策略1：重新查找用户，使用增强的查找方法（包括Admin客户端）
        // --- END COMMENT ---
        const existingUser = await this.findUserByEmployeeNumber(
          userData.employeeNumber
        );
        if (existingUser) {
          console.log(
            `Found existing user via email lookup: ${existingUser.id}`
          );
          return existingUser;
        }

        // --- BEGIN COMMENT ---
        // 策略2：如果邮箱查找失败，尝试通过Auth API获取用户ID，然后直接查找Profile
        // --- END COMMENT ---
        console.log(
          'Email lookup failed, trying to find auth user and corresponding profile...'
        );
        try {
          // 使用Admin API查找auth.users记录
          const { data: authUsers, error: authLookupError } =
            await adminSupabase.auth.admin.listUsers();

          if (!authLookupError && authUsers?.users) {
            const authUser = authUsers.users.find(user => user.email === email);
            if (authUser) {
              console.log(`Found auth.users record with ID: ${authUser.id}`);

              // 直接通过ID查找Profile
              const profileUser = await this.findUserByIdWithAdmin(authUser.id);
              if (profileUser) {
                console.log(
                  `Found corresponding profile: ${profileUser.username}`
                );
                return profileUser;
              } else {
                console.log('Profile not found, creating one...');

                // --- BEGIN COMMENT ---
                // 如果auth.users存在但profiles不存在，创建profiles记录
                // --- END COMMENT ---
                const { data: newProfile, error: createError } =
                  await adminSupabase
                    .from('profiles')
                    .insert({
                      id: authUser.id,
                      employee_number: userData.employeeNumber,
                      username: userData.username,
                      full_name: userData.fullName || userData.username,
                      auth_source: 'bistu_sso',
                      sso_provider_id: userData.ssoProviderId,
                      email: email,
                      status: 'active',
                      role: 'user',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      last_login: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (createError) {
                  console.error(
                    'Failed to create missing profile:',
                    createError
                  );
                  throw new Error('PROFILE_CREATION_FAILED');
                }

                console.log('Successfully created missing profile');
                return newProfile as Profile;
              }
            }
          }
        } catch (lookupError) {
          console.warn('Failed to lookup auth user:', lookupError);
        }

        // --- BEGIN COMMENT ---
        // 如果所有策略都失败，抛出错误
        // --- END COMMENT ---
        console.error(
          'Auth user exists but no corresponding profile found and could not create one'
        );
        throw new Error('ACCOUNT_DATA_INCONSISTENT');
      }

      // --- BEGIN COMMENT ---
      // 如果是其他类型的auth错误，直接抛出
      // --- END COMMENT ---
      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      if (!authUser.user) {
        throw new Error('Failed to create auth user: no user returned');
      }

      console.log(
        `Successfully created auth.users record with ID: ${authUser.user.id}`
      );

      // --- BEGIN COMMENT ---
      // 等待触发器创建profiles记录，然后通过邮箱查找用户
      // 使用重试机制，通过邮箱查找比ID查找更可靠
      // --- END COMMENT ---
      let profile = null;
      let retryCount = 0;
      const maxRetries = 3; // 减少重试次数

      while (retryCount < maxRetries) {
        try {
          // 先等待触发器执行
          await new Promise(resolve => setTimeout(resolve, 500));

          // --- BEGIN COMMENT ---
          // 使用邮箱查找用户，因为email字段在触发器中会被正确设置
          // --- END COMMENT ---
          profile = await this.findUserByEmployeeNumber(
            userData.employeeNumber
          );

          if (profile) {
            console.log(
              'Successfully found user via email after trigger execution'
            );

            // --- BEGIN COMMENT ---
            // 更新SSO专用字段（employee_number, sso_provider_id等）
            // 确保employee_number字段被正确设置
            // --- END COMMENT ---
            console.log(
              `Updating profile ${profile.id} with employee_number: ${userData.employeeNumber}`
            );

            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({
                employee_number: userData.employeeNumber,
                auth_source: 'bistu_sso',
                sso_provider_id: userData.ssoProviderId,
                full_name: userData.fullName || userData.username,
                username: userData.username,
                email: email, // 确保邮箱正确设置
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id)
              .select()
              .single();

            if (updateError) {
              console.warn(
                'Failed to update SSO fields, but user exists:',
                updateError
              );
              // 不阻断流程，返回原始profile
            } else {
              profile = updatedProfile;
            }

            break; // 成功，退出重试循环
          } else {
            retryCount++;
            console.log(
              `Profile not found via email yet, retry ${retryCount}/${maxRetries}`
            );
          }
        } catch (error) {
          retryCount++;
          console.warn(`Profile lookup attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            break; // 退出重试，进入备用方案
          }
        }
      }

      // --- BEGIN COMMENT ---
      // 备用方案：如果触发器创建的记录无法通过email查找到，使用Admin客户端直接查找并更新
      // --- END COMMENT ---
      if (!profile) {
        console.log(
          'Trying admin client to find and update existing profile...'
        );

        try {
          const adminSupabaseForProfile = await createAdminClient();

          // --- BEGIN COMMENT ---
          // 使用Admin客户端直接通过ID查找profiles记录（绕过RLS）
          // --- END COMMENT ---
          const { data: existingProfile, error: findError } =
            await adminSupabaseForProfile
              .from('profiles')
              .select('*')
              .eq('id', authUser.user.id)
              .single();

          if (!findError && existingProfile) {
            console.log(
              'Found existing profile via admin client, updating SSO fields...'
            );

            // --- BEGIN COMMENT ---
            // 更新现有记录的SSO字段
            // --- END COMMENT ---
            console.log(
              `Updating existing profile ${authUser.user.id} with employee_number: ${userData.employeeNumber}, email: ${email}`
            );

            const { data: updatedProfile, error: updateError } =
              await adminSupabaseForProfile
                .from('profiles')
                .update({
                  employee_number: userData.employeeNumber,
                  auth_source: 'bistu_sso',
                  sso_provider_id: userData.ssoProviderId,
                  full_name: userData.fullName || userData.username,
                  username: userData.username,
                  email: email, // 确保email字段正确
                  status: 'active', // 确保status为active
                  updated_at: new Date().toISOString(),
                })
                .eq('id', authUser.user.id)
                .select()
                .single();

            if (updateError) {
              console.error('Failed to update existing profile:', updateError);
              throw updateError;
            }

            profile = updatedProfile;
            console.log(
              'Successfully updated existing profile with SSO fields'
            );
          } else {
            // --- BEGIN COMMENT ---
            // 如果真的没有profiles记录，创建新的
            // --- END COMMENT ---
            console.log(
              `No profile found, creating new one with admin client for user ${authUser.user.id}, employee_number: ${userData.employeeNumber}, email: ${email}`
            );

            const { data: newProfile, error: createError } =
              await adminSupabaseForProfile
                .from('profiles')
                .insert({
                  id: authUser.user.id,
                  employee_number: userData.employeeNumber,
                  username: userData.username,
                  full_name: userData.fullName || userData.username,
                  auth_source: 'bistu_sso',
                  sso_provider_id: userData.ssoProviderId,
                  email: email,
                  status: 'active',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_login: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) {
              console.error(
                'Failed to create new profile with admin client:',
                createError
              );
              throw createError;
            }

            profile = newProfile;
            console.log('Successfully created new profile with admin client');
          }
        } catch (adminError) {
          const errorMsg = 'Failed to handle profile with admin client';
          console.error(errorMsg, adminError);

          // 清理已创建的auth用户
          try {
            await adminSupabase.auth.admin.deleteUser(authUser.user.id);
            console.log('Cleaned up auth user after profile handling failure');
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }

          throw new Error(errorMsg);
        }
      }

      console.log(`SSO user created successfully: ${profile.username}`);
      return profile;
    } catch (error) {
      console.error('Failed to create SSO user:', error);
      throw new Error(
        `Failed to create SSO user: ${error instanceof Error ? error.message : String(error)}`
      );
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
      const { data: success, error } = await supabase.rpc(
        'update_sso_user_login',
        {
          user_uuid: userId,
        }
      );

      if (error) {
        console.error('Error updating user last login:', error);
        throw error;
      }

      const updateSuccessful = success === true;
      console.log(
        `Last login update ${updateSuccessful ? 'successful' : 'failed'} for user: ${userId}`
      );

      return updateSuccessful;
    } catch (error) {
      console.error('Failed to update user last login:', error);
      throw new Error(
        `Failed to update last login: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取SSO用户详细查找结果
   * @param employeeNumber 学工号
   * @returns 查找结果包括用户信息和状态
   */
  static async lookupSSOUser(
    employeeNumber: string
  ): Promise<SSOUserLookupResult> {
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
   * 获取北信科SSO提供商信息
   * @returns SSO提供商信息
   */
  static async getBistuSSOProvider(): Promise<{
    id: string;
    name: string;
  } | null> {
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
          result.errors.push(
            `User with employee number ${update.employeeNumber} not found`
          );
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
          result.errors.push(
            `Failed to update ${update.employeeNumber}: ${error.message}`
          );
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error processing ${update.employeeNumber}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log(
      `Batch update completed: ${result.success} successful, ${result.failed} failed`
    );
    return result;
  }

  /**
   * 验证学工号格式
   * @param employeeNumber 学工号
   * @returns 是否有效
   */
  static validateEmployeeNumber(employeeNumber: any): boolean {
    // --- BEGIN COMMENT ---
    // 先检查是否存在值
    // --- END COMMENT ---
    if (employeeNumber === null || employeeNumber === undefined) {
      return false;
    }

    // --- BEGIN COMMENT ---
    // 转换为字符串类型，处理可能的数字类型输入
    // --- END COMMENT ---
    const employeeStr = String(employeeNumber);

    if (!employeeStr) {
      return false;
    }

    // --- BEGIN COMMENT ---
    // 根据北信科实际情况：
    // - 8位数字为工号（老师使用，如：12345678）
    // - 10位数字为学号（学生使用，如：2021011221）
    // --- END COMMENT ---
    const trimmed = employeeStr.trim();
    const pattern = /^\d{8}$|^\d{10}$/;
    return pattern.test(trimmed);
  }
}
