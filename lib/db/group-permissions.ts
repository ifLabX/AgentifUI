import { createClient } from '@lib/supabase/client';
import { Result, failure, success } from '@lib/types/result';

// --- BEGIN COMMENT ---
// 群组权限管理服务
// 只有管理员可以管理群组和权限
// --- END COMMENT ---

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    email: string | null;
  };
}

export interface GroupAppPermission {
  id: string;
  group_id: string;
  service_instance_id: string;
  is_enabled: boolean;
  usage_quota: number | null;
  used_count: number;
  created_at: string;
  app?: {
    id: string;
    display_name: string | null;
    instance_id: string;
    visibility: string;
  };
}

export interface UserAccessibleApp {
  service_instance_id: string;
  display_name: string | null;
  description: string | null;
  instance_id: string;
  api_path: string;
  visibility: 'public' | 'group_only' | 'private';
  config: any;
  usage_quota: number | null;
  used_count: number;
  quota_remaining: number | null;
  group_name: string | null;
}

export interface AppPermissionCheck {
  has_access: boolean;
  quota_remaining: number | null;
  error_message: string | null;
}

// --- BEGIN COMMENT ---
// 🔧 群组管理函数（仅管理员）
// --- END COMMENT ---

/**
 * 获取所有群组列表（仅管理员）
 */
export async function getGroups(): Promise<Result<Group[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('groups')
      .select(
        `
        *,
        group_members(count)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取群组列表失败:', error);
      return failure(new Error(error.message));
    }

    const groups = data.map(group => ({
      ...group,
      member_count: group.group_members?.[0]?.count || 0,
    }));

    return success(groups);
  } catch (error) {
    console.error('获取群组列表异常:', error);
    return failure(new Error('获取群组列表失败'));
  }
}

/**
 * 创建群组（仅管理员）
 */
export async function createGroup(data: {
  name: string;
  description?: string;
}): Promise<Result<Group>> {
  try {
    const supabase = createClient();

    const { data: group, error } = await supabase
      .from('groups')
      .insert([
        {
          name: data.name,
          description: data.description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('创建群组失败:', error);
      return failure(new Error(error.message));
    }

    return success(group);
  } catch (error) {
    console.error('创建群组异常:', error);
    return failure(new Error('创建群组失败'));
  }
}

/**
 * 更新群组（仅管理员）
 */
export async function updateGroup(
  groupId: string,
  data: { name?: string; description?: string }
): Promise<Result<Group>> {
  try {
    const supabase = createClient();

    const { data: group, error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      console.error('更新群组失败:', error);
      return failure(new Error(error.message));
    }

    return success(group);
  } catch (error) {
    console.error('更新群组异常:', error);
    return failure(new Error('更新群组失败'));
  }
}

/**
 * 删除群组（仅管理员）
 */
export async function deleteGroup(groupId: string): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from('groups').delete().eq('id', groupId);

    if (error) {
      console.error('删除群组失败:', error);
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error('删除群组异常:', error);
    return failure(new Error('删除群组失败'));
  }
}

// --- BEGIN COMMENT ---
// 👥 群组成员管理函数（仅管理员）
// --- END COMMENT ---

/**
 * 获取群组成员列表
 */
export async function getGroupMembers(
  groupId: string
): Promise<Result<GroupMember[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('group_members')
      .select(
        `
        *,
        user:profiles(id, username, full_name, email)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取群组成员失败:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('获取群组成员异常:', error);
    return failure(new Error('获取群组成员失败'));
  }
}

/**
 * 添加群组成员（仅管理员）
 */
export async function addGroupMember(
  groupId: string,
  userId: string
): Promise<Result<GroupMember>> {
  try {
    const supabase = createClient();

    const { data: member, error } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: groupId,
          user_id: userId,
        },
      ])
      .select(
        `
        *,
        user:profiles(id, username, full_name, email)
      `
      )
      .single();

    if (error) {
      console.error('添加群组成员失败:', error);
      return failure(new Error(error.message));
    }

    return success(member);
  } catch (error) {
    console.error('添加群组成员异常:', error);
    return failure(new Error('添加群组成员失败'));
  }
}

/**
 * 移除群组成员（仅管理员）
 */
export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('移除群组成员失败:', error);
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error('移除群组成员异常:', error);
    return failure(new Error('移除群组成员失败'));
  }
}

// --- BEGIN COMMENT ---
// 🎯 群组应用权限管理函数（仅管理员）
// --- END COMMENT ---

/**
 * 获取群组应用权限列表
 */
export async function getGroupAppPermissions(
  groupId: string
): Promise<Result<GroupAppPermission[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('group_app_permissions')
      .select(
        `
        *,
        app:service_instances(id, display_name, instance_id, visibility)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取群组应用权限失败:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('获取群组应用权限异常:', error);
    return failure(new Error('获取群组应用权限失败'));
  }
}

/**
 * 设置群组应用权限（仅管理员）
 */
export async function setGroupAppPermission(
  groupId: string,
  serviceInstanceId: string,
  data: {
    is_enabled: boolean;
    usage_quota?: number | null;
  }
): Promise<Result<GroupAppPermission>> {
  try {
    const supabase = createClient();

    const { data: permission, error } = await supabase
      .from('group_app_permissions')
      .upsert([
        {
          group_id: groupId,
          service_instance_id: serviceInstanceId,
          is_enabled: data.is_enabled,
          usage_quota: data.usage_quota || null,
        },
      ])
      .select(
        `
        *,
        app:service_instances(id, display_name, instance_id, visibility)
      `
      )
      .single();

    if (error) {
      console.error('设置群组应用权限失败:', error);
      return failure(new Error(error.message));
    }

    return success(permission);
  } catch (error) {
    console.error('设置群组应用权限异常:', error);
    return failure(new Error('设置群组应用权限失败'));
  }
}

/**
 * 删除群组应用权限（仅管理员）
 */
export async function removeGroupAppPermission(
  groupId: string,
  serviceInstanceId: string
): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('group_app_permissions')
      .delete()
      .eq('group_id', groupId)
      .eq('service_instance_id', serviceInstanceId);

    if (error) {
      console.error('删除群组应用权限失败:', error);
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error('删除群组应用权限异常:', error);
    return failure(new Error('删除群组应用权限失败'));
  }
}

// --- BEGIN COMMENT ---
// 🔍 用户权限查询函数（所有用户可用）
// --- END COMMENT ---

/**
 * 获取用户可访问的应用列表
 */
export async function getUserAccessibleApps(
  userId: string
): Promise<Result<UserAccessibleApp[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_user_accessible_apps', {
      p_user_id: userId,
    });

    if (error) {
      console.error('获取用户可访问应用失败:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('获取用户可访问应用异常:', error);
    return failure(new Error('获取应用列表失败'));
  }
}

/**
 * 检查用户对特定应用的访问权限
 */
export async function checkUserAppPermission(
  userId: string,
  serviceInstanceId: string
): Promise<Result<AppPermissionCheck>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('check_user_app_permission', {
      p_user_id: userId,
      p_service_instance_id: serviceInstanceId,
    });

    if (error) {
      console.error('检查用户应用权限失败:', error);
      return failure(new Error(error.message));
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return success({
        has_access: false,
        quota_remaining: null,
        error_message: '权限检查失败',
      });
    }

    return success(result);
  } catch (error) {
    console.error('检查用户应用权限异常:', error);
    return failure(new Error('权限检查失败'));
  }
}

/**
 * 增加应用使用计数
 */
export async function incrementAppUsage(
  userId: string,
  serviceInstanceId: string,
  increment: number = 1
): Promise<
  Result<{
    success: boolean;
    new_used_count: number;
    quota_remaining: number | null;
    error_message: string | null;
  }>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('increment_app_usage', {
      p_user_id: userId,
      p_service_instance_id: serviceInstanceId,
      p_increment: increment,
    });

    if (error) {
      console.error('增加应用使用计数失败:', error);
      return failure(new Error(error.message));
    }

    const result = Array.isArray(data) ? data[0] : data;
    return success(result);
  } catch (error) {
    console.error('增加应用使用计数异常:', error);
    return failure(new Error('使用计数更新失败'));
  }
}
