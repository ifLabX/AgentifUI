import { createClient } from '@lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Users API Route
 *
 * 处理管理员用户管理相关的API请求
 * 获取用户列表（简化版，用于群组管理中的用户选择）
 */
export async function GET() {
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

    // --- 获取用户基本信息（只查询profiles表存在的字段） ---
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role, status')
      .eq('status', 'active') // 只获取活跃用户
      .order('full_name', { ascending: true });

    if (error) {
      console.error('获取用户列表失败:', error);
      return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
    }

    // --- 格式化用户数据，优先显示真实姓名 ---
    const formattedUsers = (users || []).map(user => ({
      id: user.id,
      full_name: user.full_name || user.username || '未知用户',
      username: user.username,
      avatar_url: user.avatar_url,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({
      users: formattedUsers,
      success: true,
    });
  } catch (error) {
    console.error('用户列表API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
