import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { encryptApiKey } from '@lib/utils/encryption';

// 正确创建 Supabase 客户端的函数
function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await (await cookieStore).get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: any) {
          (await cookieStore).set({ name, value, ...options });
        },
        async remove(name: string, options: any) {
          (await cookieStore).set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 获取当前用户会话
    const supabase = createClient();
    
    // 使用 getUser 获取经过身份验证的用户数据
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查用户是否为管理员
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '禁止访问' }, { status: 403 });
    }
    
    // 获取请求数据
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: '缺少 API 密钥' }, { status: 400 });
    }
    
    // 获取加密密钥
    const masterKey = process.env.API_ENCRYPTION_KEY;
    
    if (!masterKey) {
      console.error('API_ENCRYPTION_KEY 环境变量未设置');
      return NextResponse.json(
        { error: '服务器配置错误：加密密钥未设置' },
        { status: 500 }
      );
    }
    
    // 加密 API 密钥
    const encryptedKey = encryptApiKey(apiKey, masterKey);
    
    // 返回加密后的密钥
    return NextResponse.json({ encryptedKey });
  } catch (error) {
    console.error('加密 API 密钥时出错:', error);
    return NextResponse.json(
      { error: '加密 API 密钥时出错' },
      { status: 500 }
    );
  }
}