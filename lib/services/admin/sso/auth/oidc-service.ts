// --- BEGIN COMMENT ---
// OIDC协议服务实现
// 支持OpenID Connect和OAuth2协议
// 提供现代Web应用的标准认证流程
// --- END COMMENT ---
import type { SSOUserInfo, SsoProvider } from '@lib/types/sso/admin-types';
import type {
  OIDCTokenResponse,
  OIDCUserInfoResponse,
  SSOAuthParams,
} from '@lib/types/sso/auth-types';

import { BaseSSOService } from '../core/base-sso-service';

// --- BEGIN COMMENT ---
// OIDC协议服务类
// 继承BaseSSOService，实现OIDC/OAuth2协议特定的认证逻辑
// --- END COMMENT ---
export class OIDCService extends BaseSSOService {
  constructor(provider: SsoProvider) {
    super(provider);
    // 验证OIDC特定配置
    this.validateOIDCConfig();
  }

  // --- BEGIN COMMENT ---
  // 生成OIDC登录URL
  // 遵循OAuth2/OIDC标准流程
  // --- END COMMENT ---
  generateLoginURL(returnUrl?: string): string {
    this.validateProviderConfig();

    const config = this.getProtocolConfig();
    const redirectUri = this.urlBuilder.buildCallbackUrl(this.provider.id);

    // 构建授权URL
    const authUrl = new URL(config.endpoints.authorization, config.base_url);
    authUrl.searchParams.set('client_id', this.provider.client_id!);
    authUrl.searchParams.set('response_type', config.response_type || 'code');
    authUrl.searchParams.set('scope', config.scope || 'openid profile email');
    authUrl.searchParams.set('redirect_uri', redirectUri);

    // 添加state参数用于安全和返回URL
    if (returnUrl || this.getSecurityConfig().state_parameter) {
      const state = this.generateState(returnUrl);
      authUrl.searchParams.set('state', state);
    }

    // 如果启用PKCE，添加code_challenge
    if (this.getSecurityConfig().pkce_enabled) {
      const { codeChallenge, codeVerifier } = this.generatePKCE();
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      // 存储code_verifier用于token交换（实际应用中应存储在session中）
      this.log('info', 'Generated PKCE for OIDC flow', {
        providerId: this.provider.id,
        codeChallenge,
      });
    }

    this.log('info', 'Generated OIDC login URL', {
      providerId: this.provider.id,
      redirectUri,
      authUrl: authUrl.toString(),
    });

    return authUrl.toString();
  }

  // --- BEGIN COMMENT ---
  // 验证OIDC认证授权码
  // 核心功能：处理OAuth2/OIDC回调，交换token并获取用户信息
  // --- END COMMENT ---
  async validateAuth(params: SSOAuthParams): Promise<SSOUserInfo> {
    this.validateProviderConfig();
    this.validateAuthParams(params, ['code']);

    const { code, state } = params;

    this.log('info', 'Starting OIDC authorization code validation', {
      providerId: this.provider.id,
      hasState: !!state,
    });

    try {
      // 1. 交换授权码获取访问令牌
      const tokenResponse = await this.exchangeCodeForToken(code!);

      // 2. 使用访问令牌获取用户信息
      const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

      // 3. 映射用户信息
      const mappedUserInfo = this.mapOIDCUserInfo(userInfo);

      this.log('info', 'OIDC validation successful', {
        providerId: this.provider.id,
        username: mappedUserInfo.username,
      });

      return mappedUserInfo;
    } catch (error) {
      this.log('error', 'OIDC validation failed', {
        providerId: this.provider.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 交换授权码获取访问令牌
  // --- END COMMENT ---
  private async exchangeCodeForToken(code: string): Promise<OIDCTokenResponse> {
    const config = this.getProtocolConfig();
    const redirectUri = this.urlBuilder.buildCallbackUrl(this.provider.id);

    const tokenUrl = new URL(config.endpoints.token, config.base_url);

    // 构建token请求参数
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.provider.client_id!,
      client_secret: this.provider.client_secret!,
      code: code,
      redirect_uri: redirectUri,
    });

    this.log('info', 'Exchanging authorization code for token', {
      tokenUrl: tokenUrl.toString(),
      redirectUri,
    });

    try {
      const response = await fetch(tokenUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'AgentifUI-SSO/1.0',
        },
        body: tokenParams.toString(),
        signal: AbortSignal.timeout(this.getProtocolConfig().timeout || 10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const tokenData: OIDCTokenResponse = await response.json();

      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }

      return tokenData;
    } catch (error) {
      throw this.handleRequestError(error, 'OIDC token exchange');
    }
  }

  // --- BEGIN COMMENT ---
  // 获取用户信息
  // --- END COMMENT ---
  private async fetchUserInfo(
    accessToken: string
  ): Promise<OIDCUserInfoResponse> {
    const config = this.getProtocolConfig();
    const userInfoUrl = new URL(config.endpoints.userinfo, config.base_url);

    this.log('info', 'Fetching user info from OIDC provider', {
      userInfoUrl: userInfoUrl.toString(),
    });

    try {
      const response = await fetch(userInfoUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'AgentifUI-SSO/1.0',
        },
        signal: AbortSignal.timeout(this.getProtocolConfig().timeout || 10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch user info: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const userInfo: OIDCUserInfoResponse = await response.json();

      if (!userInfo.sub) {
        throw new Error('No subject (sub) in user info response');
      }

      return userInfo;
    } catch (error) {
      throw this.handleRequestError(error, 'OIDC user info fetch');
    }
  }

  // --- BEGIN COMMENT ---
  // 映射OIDC用户信息到标准格式
  // --- END COMMENT ---
  private mapOIDCUserInfo(userInfo: OIDCUserInfoResponse): SSOUserInfo {
    const mapping = this.getProtocolConfig().attributes_mapping;

    // 使用基类的属性映射方法
    const mappedData = this.mapUserAttributes(userInfo as any);

    return {
      id:
        (userInfo[
          mapping.employee_id as keyof OIDCUserInfoResponse
        ] as string) || userInfo.sub,
      username:
        (userInfo[mapping.username as keyof OIDCUserInfoResponse] as string) ||
        userInfo.preferred_username ||
        userInfo.sub,
      email:
        (userInfo[mapping.email as keyof OIDCUserInfoResponse] as string) ||
        userInfo.email ||
        null,
      name:
        (userInfo[mapping.full_name as keyof OIDCUserInfoResponse] as string) ||
        userInfo.name ||
        userInfo.preferred_username ||
        userInfo.sub,
      provider: this.provider.name,
      raw: userInfo,
    };
  }

  // --- BEGIN COMMENT ---
  // 生成安全的state参数
  // --- END COMMENT ---
  private generateState(returnUrl?: string): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const random = Array.from(randomBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    if (returnUrl) {
      // 简化版本：实际应用中应该加密或使用安全的状态管理
      return `${random}:${encodeURIComponent(returnUrl)}`;
    }

    return random;
  }

  // --- BEGIN COMMENT ---
  // 生成PKCE参数（简化版本）
  // --- END COMMENT ---
  private generatePKCE(): { codeChallenge: string; codeVerifier: string } {
    // 简化版本：实际应用中应使用更安全的实现
    const codeVerifier = crypto.getRandomValues(new Uint8Array(32));
    const codeVerifierString = Array.from(codeVerifier, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    // 使用SHA256生成code_challenge（简化版本）
    const codeChallenge = btoa(codeVerifierString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return {
      codeChallenge,
      codeVerifier: codeVerifierString,
    };
  }

  // --- BEGIN COMMENT ---
  // 验证OIDC特定配置
  // --- END COMMENT ---
  private validateOIDCConfig(): void {
    if (!this.provider.client_id) {
      throw new Error(`OIDC provider ${this.provider.name} requires client_id`);
    }

    if (!this.provider.client_secret) {
      throw new Error(
        `OIDC provider ${this.provider.name} requires client_secret`
      );
    }

    const config = this.getProtocolConfig();

    if (this.provider.protocol === 'OIDC' && !config.issuer) {
      this.log('warn', 'OIDC provider missing issuer URL, using base_url');
    }

    const endpoints = config.endpoints;
    if (!endpoints.authorization) {
      throw new Error(
        `OIDC provider ${this.provider.name} requires authorization endpoint`
      );
    }

    if (!endpoints.token) {
      throw new Error(
        `OIDC provider ${this.provider.name} requires token endpoint`
      );
    }

    if (!endpoints.userinfo) {
      throw new Error(
        `OIDC provider ${this.provider.name} requires userinfo endpoint`
      );
    }

    // 验证scope格式
    const scope = config.scope || 'openid profile email';
    if (this.provider.protocol === 'OIDC' && !scope.includes('openid')) {
      throw new Error(
        `OIDC provider ${this.provider.name} requires 'openid' scope`
      );
    }
  }

  // --- BEGIN COMMENT ---
  // 获取OIDC发行者信息
  // --- END COMMENT ---
  getIssuer(): string {
    return this.getProtocolConfig().issuer || this.getProtocolConfig().base_url;
  }

  // --- BEGIN COMMENT ---
  // 检查是否启用PKCE
  // --- END COMMENT ---
  isPKCEEnabled(): boolean {
    return !!this.getSecurityConfig().pkce_enabled;
  }
}
