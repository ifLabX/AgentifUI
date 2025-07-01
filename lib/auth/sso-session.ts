// --- BEGIN COMMENT ---
// SSO会话管理工具
// 提供简化的会话验证和解析功能
// 为后续NextAuth.js集成预留接口
// --- END COMMENT ---
import { NextRequest } from 'next/server';

// --- BEGIN COMMENT ---
// SSO会话数据接口
// --- END COMMENT ---
export interface SSOSessionData {
  userId: string;
  username: string;
  email: string | null;
  name: string;
  provider: string;
  providerId: string;
  loginAt: string;
}

// --- BEGIN COMMENT ---
// 从请求中获取SSO会话
// --- END COMMENT ---
export function getSSOSession(request: NextRequest): SSOSessionData | null {
  try {
    const sessionCookie = request.cookies.get('sso-session')?.value;

    if (!sessionCookie || !sessionCookie.startsWith('sso-')) {
      return null;
    }

    // 解析会话token
    const tokenData = sessionCookie.substring(4); // 移除 'sso-' 前缀
    const sessionDataJson = Buffer.from(tokenData, 'base64').toString('utf-8');
    const sessionData = JSON.parse(sessionDataJson) as SSOSessionData;

    // 验证会话数据完整性
    if (!sessionData.userId || !sessionData.username || !sessionData.provider) {
      return null;
    }

    // 检查会话是否过期（24小时）
    const loginTime = new Date(sessionData.loginAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return null; // 会话已过期
    }

    return sessionData;
  } catch (error) {
    console.error('Failed to parse SSO session:', error);
    return null;
  }
}

// --- BEGIN COMMENT ---
// 验证用户是否已登录
// --- END COMMENT ---
export function isAuthenticated(request: NextRequest): boolean {
  const session = getSSOSession(request);
  return session !== null;
}

// --- BEGIN COMMENT ---
// 创建会话token
// --- END COMMENT ---
export function createSSOSessionToken(sessionData: SSOSessionData): string {
  const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return `sso-${token}`;
}
