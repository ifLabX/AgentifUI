import { createClient } from '@lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Users for Group API Route
 *
 * 处理群组成员管理中的用户分页列表请求
 * 支持搜索、分页和排除已存在成员
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // --- 检查用户权限 ---
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // --- 检查是否为管理员 ---
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // --- 解析请求参数 ---
    const body = await request.json();
    const { page = 1, pageSize = 10, search, excludeUserIds = [] } = body;

    // --- 构建查询 ---
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, email, avatar_url, role, status', {
        count: 'exact',
      })
      .eq('status', 'active') // 只获取活跃用户
      .order('created_at', { ascending: false });

    // 排除指定的用户ID（如已在群组中的用户）
    if (excludeUserIds.length > 0) {
      query = query.not('id', 'in', `(${excludeUserIds.join(',')})`);
    }

    // 搜索条件：用户名、全名或邮箱包含搜索词
    if (search && search.trim()) {
      query = query.or(
        `username.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
      );
    }

    // 应用分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('获取用户列表失败:', error);
      return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
    }

    // --- 计算分页信息 ---
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // --- 格式化用户数据 ---
    const formattedUsers = (users || []).map(user => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({
      users: formattedUsers,
      page,
      pageSize,
      total,
      totalPages,
      success: true,
    });
  } catch (error) {
    console.error('用户列表API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
