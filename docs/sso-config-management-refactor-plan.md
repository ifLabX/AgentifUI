# SSO配置管理系统重构方案

## 📋 项目概述

### 重构目标

将当前硬编码的SSO配置系统重构为完全可配置的管理系统，支持通过后端管理界面动态配置多种SSO提供商和协议。

### 当前问题分析

1. **配置分散**: 环境变量、数据库、代码硬编码三处配置
2. **扩展性差**: 新增SSO提供商需要修改代码
3. **维护困难**: 配置修改需要重启服务
4. **管理界面缺失**: 无法通过界面动态配置SSO

### 目标架构

```
管理员界面 → SSO配置API → 统一配置服务 → 数据库配置 → 动态SSO服务实例
```

## 🗄️ 数据库层重构

### 1. 现有表结构分析

**当前sso_providers表结构**：
```sql
CREATE TABLE sso_providers (
  id UUID PRIMARY KEY,                          -- SSO提供商唯一标识符
  name TEXT NOT NULL,                           -- 提供商显示名称（如：北京信息科技大学）
  protocol sso_protocol NOT NULL,               -- SSO协议类型：'SAML', 'OAuth2', 'OIDC', 'CAS'
  settings JSONB NOT NULL DEFAULT '{}',         -- 协议配置和UI设置的JSON结构
  client_id TEXT,                               -- OAuth2/OIDC客户端ID（预留字段）
  client_secret TEXT,                           -- OAuth2/OIDC客户端密钥（预留字段）
  metadata_url TEXT,                            -- SAML元数据URL（预留字段）
  enabled BOOLEAN DEFAULT true,                 -- 是否启用该SSO提供商
  created_at TIMESTAMP WITH TIME ZONE,          -- 创建时间
  updated_at TIMESTAMP WITH TIME ZONE           -- 最后更新时间
);
```

**已有北信科配置**：
```sql
-- ID: '10000000-0000-0000-0000-000000000001'
-- name: '北京信息科技大学'
-- protocol: 'CAS'
-- settings: 包含base_url, endpoints等配置
```

### 2. 表结构扩展（谨慎增量修改）

#### 2.1 扩展sso_providers表

```sql
-- 新增字段，使用ALTER TABLE避免破坏现有数据
ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;  -- 登录页面按钮显示顺序（数字越小越靠前）

ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS button_text TEXT;                 -- 登录按钮显示文本（如：北京信息科技大学统一认证）

-- 为现有字段添加详细注释
COMMENT ON COLUMN sso_providers.id IS 'SSO提供商唯一标识符，用于API路由和服务实例缓存';
COMMENT ON COLUMN sso_providers.name IS '提供商显示名称，用于管理界面展示和日志记录';
COMMENT ON COLUMN sso_providers.protocol IS 'SSO协议类型，支持CAS、OIDC、SAML等，决定使用哪个服务实现类';
COMMENT ON COLUMN sso_providers.enabled IS '是否启用该提供商，false时不会在登录页面显示且API拒绝访问';
COMMENT ON COLUMN sso_providers.display_order IS '登录页面按钮显示顺序，数字越小越靠前，相同值按name排序';
COMMENT ON COLUMN sso_providers.button_text IS '登录按钮显示文本，为空时使用name字段值';
COMMENT ON COLUMN sso_providers.client_id IS 'OAuth2/OIDC协议的客户端ID，CAS协议不使用此字段';
COMMENT ON COLUMN sso_providers.client_secret IS 'OAuth2/OIDC协议的客户端密钥，建议加密存储';
COMMENT ON COLUMN sso_providers.metadata_url IS 'SAML协议的元数据URL，用于自动配置端点信息';

-- 注释说明settings字段的标准结构
COMMENT ON COLUMN sso_providers.settings IS '
SSO提供商完整配置，JSONB格式，标准结构如下：
{
  "protocol_config": {
    "base_url": "string",               // SSO服务器基础URL
    "endpoints": {
      "login": "string",                // 登录端点路径
      "logout": "string",               // 注销端点路径
      "validate": "string",             // 票据验证端点路径
      "metadata": "string"              // 元数据端点路径（可选）
    },
    "version": "string",                // 协议版本（如CAS 2.0/3.0）
    "timeout": number,                  // 请求超时时间（毫秒）
    "attributes_mapping": {
      "employee_id": "string",          // 工号字段映射
      "username": "string",             // 用户名字段映射
      "full_name": "string",            // 全名字段映射
      "email": "string"                 // 邮箱字段映射
    }
  },
  "security": {
    "require_https": boolean,           // 是否要求HTTPS连接
    "validate_certificates": boolean,   // 是否验证SSL证书
    "allowed_redirect_hosts": ["string"] // 允许的重定向主机列表
  },
  "ui": {
    "icon": "string",                   // 按钮图标（emoji或图片URL）
    "logo_url": "string",               // 机构logo图片URL
    "description": "string",            // 详细描述文本
    "theme": "string"                   // 按钮主题：primary/secondary/default/outline
  }
}';
```

#### 2.2 创建SSO协议模板表

```sql
-- 新建表，不影响现有结构
CREATE TABLE IF NOT EXISTS sso_protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 模板唯一标识符
  protocol sso_protocol NOT NULL,                 -- 对应的SSO协议类型
  name TEXT NOT NULL,                             -- 模板显示名称
  description TEXT,                               -- 模板详细描述
  config_schema JSONB NOT NULL,                   -- JSON Schema配置验证规则
  default_settings JSONB NOT NULL,                -- 默认配置模板
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为协议模板表字段添加注释
COMMENT ON TABLE sso_protocol_templates IS 'SSO协议配置模板，为不同协议提供标准配置模板和验证规则';
COMMENT ON COLUMN sso_protocol_templates.id IS '模板唯一标识符';
COMMENT ON COLUMN sso_protocol_templates.protocol IS 'SSO协议类型，必须与sso_providers.protocol枚举值一致';
COMMENT ON COLUMN sso_protocol_templates.name IS '模板显示名称，用于管理界面选择协议时展示';
COMMENT ON COLUMN sso_protocol_templates.description IS '协议详细描述，说明适用场景和特性';
COMMENT ON COLUMN sso_protocol_templates.config_schema IS 'JSON Schema格式的配置验证规则，用于验证settings字段';
COMMENT ON COLUMN sso_protocol_templates.default_settings IS '该协议的默认配置模板，创建新提供商时使用';

-- 插入CAS协议模板
INSERT INTO sso_protocol_templates (protocol, name, description, config_schema, default_settings)
VALUES (
  'CAS',
  'CAS 2.0/3.0 协议',
  '中央认证服务协议，广泛用于高校统一认证系统，支持单点登录和注销',
  '{
    "type": "object",
    "properties": {
      "protocol_config": {
        "type": "object",
        "properties": {
          "base_url": {"type": "string", "format": "uri", "description": "CAS服务器基础URL"},
          "version": {"type": "string", "enum": ["2.0", "3.0"], "description": "CAS协议版本"},
          "timeout": {"type": "number", "minimum": 1000, "description": "请求超时时间（毫秒）"}
        },
        "required": ["base_url"]
      }
    }
  }',
  '{
    "protocol_config": {
      "version": "2.0",
      "timeout": 10000,
      "endpoints": {
        "login": "/login",
        "logout": "/logout",
        "validate": "/serviceValidate",
        "validate_v3": "/p3/serviceValidate"
      },
      "attributes_mapping": {
        "employee_id": "cas:user",
        "username": "cas:username", 
        "full_name": "cas:name"
      }
    },
    "security": {
      "require_https": true,
      "validate_certificates": true
    }
  }'
) ON CONFLICT DO NOTHING;
```

#### 2.3 数据迁移策略

```sql
-- 更新现有北信科配置，保持向后兼容
UPDATE sso_providers 
SET 
  button_text = '北京信息科技大学统一认证',
  display_order = 1,
  settings = settings || jsonb_build_object(
    'ui', jsonb_build_object(
      'icon', '🏛️',
      'logo_url', '',
      'description', '北京信息科技大学统一认证系统',
      'theme', 'primary'
    ),
    'security', jsonb_build_object(
      'require_https', true,
      'validate_certificates', true,
      'allowed_redirect_hosts', array['bistu.edu.cn']
    )
  )
WHERE name = '北京信息科技大学';
```

## 🔧 服务层重构

### 1. 统一SSO配置服务

```typescript
// lib/services/sso/sso-config-service.ts
export class SSOConfigService {
  private static cache = new Map<string, SSOProvider>();
  private static cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  private static lastCacheUpdate = 0;

  /**
   * 获取所有启用的SSO提供商
   */
  static async getEnabledProviders(): Promise<SSOProvider[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * 根据ID获取SSO提供商配置（带缓存）
   */
  static async getProviderById(id: string): Promise<SSOProvider | null> {
    // 检查缓存
    if (this.isCacheValid() && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', id)
      .eq('enabled', true)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw error;

    // 更新缓存
    if (data) {
      this.cache.set(id, data);
      this.lastCacheUpdate = Date.now();
    }

    return data;
  }

  /**
   * 验证SSO配置
   */
  static async validateConfig(config: Partial<SSOProvider>): Promise<ValidationResult> {
    const errors: string[] = [];

    // 基础验证
    if (!config.name?.trim()) errors.push('提供商名称不能为空');
    if (!config.protocol) errors.push('协议类型不能为空');

    // 协议特定验证
    if (config.protocol === 'CAS') {
      const protocolConfig = config.settings?.protocol_config;
      if (!protocolConfig?.base_url) {
        errors.push('CAS base_url 不能为空');
      } else if (!this.isValidURL(protocolConfig.base_url)) {
        errors.push('CAS base_url 格式无效');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 测试SSO连接
   */
  static async testConnection(provider: SSOProvider): Promise<TestResult> {
    try {
      const service = await SSOServiceFactory.createService(provider.id);
      
      // 对于CAS协议，测试基础URL可达性
      if (provider.protocol === 'CAS') {
        const baseUrl = provider.settings.protocol_config.base_url;
        const response = await fetch(`${baseUrl}/login`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        return {
          success: response.ok,
          message: response.ok ? '连接成功' : `HTTP ${response.status}`,
          details: {
            status: response.status,
            url: `${baseUrl}/login`
          }
        };
      }

      return { success: false, message: '暂不支持该协议的连接测试' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败',
        details: { error: String(error) }
      };
    }
  }

  /**
   * 清除缓存
   */
  static clearCache() {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  private static isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  private static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. 抽象SSO服务基类

```typescript
// lib/services/sso/base-sso-service.ts
export interface SSOServiceConfig {
  providerId: string;
  settings: any;
}

export interface SSOUserInfo {
  employeeNumber: string;
  username: string;
  fullName?: string;
  email?: string;
  success: boolean;
  attributes?: Record<string, any>;
  rawResponse?: string;
}

export abstract class BaseSSOService {
  protected config: SSOServiceConfig;
  
  constructor(config: SSOServiceConfig) {
    this.config = config;
  }

  abstract generateLoginURL(returnUrl?: string): string;
  abstract generateLogoutURL(returnUrl?: string): string;
  abstract validateAuth(params: any): Promise<SSOUserInfo>;
  abstract getConfig(): Partial<SSOServiceConfig>;
}
```

### 3. 增强的CAS服务实现

```typescript
// lib/services/sso/cas-sso-service.ts
export class CASService extends BaseSSOService {
  private xmlParser: XMLParser;

  constructor(config: SSOServiceConfig) {
    super(config);
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
    });
  }

  generateLoginURL(returnUrl?: string): string {
    const protocolConfig = this.config.settings.protocol_config;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
    }

    const serviceUrl = returnUrl ? 
      `${appUrl}/api/sso/${this.config.providerId}/callback?returnUrl=${encodeURIComponent(returnUrl)}` : 
      `${appUrl}/api/sso/${this.config.providerId}/callback`;

    const params = new URLSearchParams({ service: serviceUrl });
    const loginEndpoint = protocolConfig.endpoints?.login || '/login';
    
    return `${protocolConfig.base_url}${loginEndpoint}?${params.toString()}`;
  }

  generateLogoutURL(returnUrl?: string): string {
    const protocolConfig = this.config.settings.protocol_config;
    const params = new URLSearchParams();
    
    if (returnUrl) {
      params.set('service', returnUrl);
    }

    const logoutEndpoint = protocolConfig.endpoints?.logout || '/logout';
    return `${protocolConfig.base_url}${logoutEndpoint}${params.toString() ? '?' + params.toString() : ''}`;
  }

  async validateAuth(params: { ticket: string; service: string }): Promise<SSOUserInfo> {
    const { ticket, service } = params;
    const protocolConfig = this.config.settings.protocol_config;
    
    try {
      const validateEndpoint = protocolConfig.version === '3.0' 
        ? (protocolConfig.endpoints?.validate_v3 || '/p3/serviceValidate')
        : (protocolConfig.endpoints?.validate || '/serviceValidate');

      const validateParams = new URLSearchParams({ service, ticket });
      const response = await fetch(
        `${protocolConfig.base_url}${validateEndpoint}?${validateParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/xml, text/xml',
            'User-Agent': 'AgentifUI-SSO-Client/2.0',
          },
          signal: AbortSignal.timeout(protocolConfig.timeout || 10000),
        }
      );

      const xmlText = await response.text();
      return this.parseValidationResponse(xmlText);
    } catch (error) {
      return {
        employeeNumber: '',
        username: '',
        success: false,
        attributes: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  private parseValidationResponse(xmlText: string): SSOUserInfo {
    try {
      const parsed = this.xmlParser.parse(xmlText);
      const serviceResponse = parsed['cas:serviceResponse'];

      if (serviceResponse['cas:authenticationSuccess']) {
        const success = serviceResponse['cas:authenticationSuccess'];
        const user = success['cas:user'];
        const attributes = success['cas:attributes'] || {};

        const mapping = this.config.settings.protocol_config.attributes_mapping || {};
        
        return {
          username: String(user || ''),
          employeeNumber: String(user || ''),
          fullName: String(attributes[mapping.full_name || 'cas:name'] || ''),
          success: true,
          attributes: this.cleanAttributes(attributes),
          rawResponse: xmlText,
        };
      } else if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        return {
          employeeNumber: '',
          username: '',
          success: false,
          attributes: {
            error_code: failure['@_code'] || 'UNKNOWN_ERROR',
            error_message: typeof failure === 'string' ? failure : failure['#text'] || 'Authentication failed',
          },
          rawResponse: xmlText,
        };
      }

      throw new Error('Unexpected CAS response format');
    } catch (error) {
      return {
        employeeNumber: '',
        username: '',
        success: false,
        attributes: { parse_error: error instanceof Error ? error.message : String(error) },
        rawResponse: xmlText,
      };
    }
  }

  private cleanAttributes(attributes: any): Record<string, any> {
    return Object.keys(attributes).reduce((acc, key) => {
      if (key.startsWith('cas:')) {
        const cleanKey = key.replace('cas:', '');
        acc[cleanKey] = String(attributes[key] || '');
      }
      return acc;
    }, {} as Record<string, any>);
  }

  getConfig(): Partial<SSOServiceConfig> {
    return {
      providerId: this.config.providerId,
      settings: {
        ...this.config.settings,
        protocol_config: {
          ...this.config.settings.protocol_config,
          // 隐藏敏感信息
          base_url: new URL(this.config.settings.protocol_config.base_url).origin + '/***',
        }
      }
    };
  }
}
```

### 4. 动态服务工厂

```typescript
// lib/services/sso/sso-service-factory.ts
export class SSOServiceFactory {
  private static serviceCache = new Map<string, BaseSSOService>();

  static async createService(providerId: string): Promise<BaseSSOService> {
    // 检查缓存
    if (this.serviceCache.has(providerId)) {
      return this.serviceCache.get(providerId)!;
    }

    const provider = await SSOConfigService.getProviderById(providerId);
    if (!provider) {
      throw new Error(`SSO provider ${providerId} not found or disabled`);
    }

    let service: BaseSSOService;
    
    switch (provider.protocol) {
      case 'CAS':
        service = new CASService({
          providerId: provider.id,
          settings: provider.settings
        });
        break;
      case 'OIDC':
        // TODO: 实现OIDC服务
        throw new Error('OIDC protocol not implemented yet');
      case 'SAML':
        // TODO: 实现SAML服务
        throw new Error('SAML protocol not implemented yet');
      default:
        throw new Error(`Unsupported SSO protocol: ${provider.protocol}`);
    }

    this.serviceCache.set(providerId, service);
    return service;
  }

  static clearCache() {
    this.serviceCache.clear();
    // 同时清理配置服务缓存
    SSOConfigService.clearCache();
  }
}
```

## 🌐 API层重构

### 1. 动态SSO API路由

```typescript
// app/api/sso/[providerId]/login/route.ts
export async function GET(
  request: NextRequest, 
  { params }: { params: { providerId: string } }
) {
  try {
    const service = await SSOServiceFactory.createService(params.providerId);
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    
    // 验证重定向URL安全性
    const safeReturnUrl = validateReturnUrl(returnUrl);
    const loginUrl = service.generateLoginURL(safeReturnUrl);
    
    console.log(`SSO login initiated for provider ${params.providerId}, return URL: ${safeReturnUrl}`);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error(`SSO login failed for provider ${params.providerId}:`, error);
    return NextResponse.redirect(
      new URL(`/login?error=sso_provider_error&message=${encodeURIComponent(error.message)}`, 
        process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}

function validateReturnUrl(returnUrl: string | null): string {
  const allowedReturnUrls = ['/chat', '/dashboard', '/settings', '/apps', '/'];
  
  if (!returnUrl || !returnUrl.startsWith('/')) {
    return '/chat';
  }
  
  const isValidReturnUrl = allowedReturnUrls.includes(returnUrl) || 
    returnUrl.startsWith('/chat/') ||
    returnUrl.startsWith('/apps/');
    
  return isValidReturnUrl ? returnUrl : '/chat';
}
```

```typescript
// app/api/sso/[providerId]/callback/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  const requestUrl = new URL(request.url);
  const ticket = requestUrl.searchParams.get('ticket');
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/chat';
  
  console.log(`SSO callback received for provider ${params.providerId}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  if (!ticket) {
    return NextResponse.redirect(
      new URL('/login?error=missing_ticket&message=认证参数缺失', appUrl)
    );
  }

  try {
    const service = await SSOServiceFactory.createService(params.providerId);
    const serviceUrl = `${appUrl}/api/sso/${params.providerId}/callback`;
    
    const userInfo = await service.validateAuth({ ticket, service: serviceUrl });
    
    if (!userInfo.success || !userInfo.employeeNumber) {
      return NextResponse.redirect(
        new URL('/login?error=ticket_validation_failed&message=身份验证失败', appUrl)
      );
    }

    // 查找或创建用户
    let user = await SSOUserService.findUserByEmployeeNumber(userInfo.employeeNumber);
    
    if (!user) {
      user = await SSOUserService.createSSOUser({
        employeeNumber: userInfo.employeeNumber,
        username: userInfo.username,
        fullName: userInfo.fullName || userInfo.username,
        ssoProviderId: params.providerId,
      });
    } else {
      await SSOUserService.updateLastLogin(user.id);
    }

    // 设置SSO用户数据并重定向
    const userEmail = `${user.employee_number}@bistu.edu.cn`;
    const successUrl = new URL('/sso/processing', appUrl);
    successUrl.searchParams.set('sso_login', 'success');
    successUrl.searchParams.set('user_id', user.id);
    successUrl.searchParams.set('user_email', userEmail);
    successUrl.searchParams.set('redirect_to', returnUrl);
    
    const response = NextResponse.redirect(successUrl);
    
    // 设置SSO用户数据cookie
    const ssoUserData = {
      userId: user.id,
      email: userEmail,
      employeeNumber: user.employee_number,
      username: user.username,
      fullName: user.full_name,
      authSource: 'sso',
      providerId: params.providerId,
      loginTime: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };

    response.cookies.set('sso_user_data', JSON.stringify(ssoUserData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(`SSO callback failed for provider ${params.providerId}:`, error);
    return NextResponse.redirect(
      new URL(`/login?error=sso_callback_failed&message=${encodeURIComponent(error.message)}`, appUrl)
    );
  }
}
```

### 2. SSO管理API

```typescript
// app/api/admin/sso/providers/route.ts
export async function GET() {
  try {
    const providers = await SSOConfigService.getEnabledProviders();
    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SSO providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证配置
    const validation = await SSOConfigService.validateConfig(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: provider, error } = await supabase
      .from('sso_providers')
      .insert({
        ...data,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) throw error;

    // 清除缓存
    SSOServiceFactory.clearCache();
    
    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create SSO provider' },
      { status: 500 }
    );
  }
}
```

## 🎨 前端重构

### 1. 动态SSO按钮组件

```typescript
// components/auth/dynamic-sso-buttons.tsx
export function DynamicSSOButtons({ returnUrl }: { returnUrl?: string }) {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviders() {
      try {
        const response = await fetch('/api/sso/providers');
        if (response.ok) {
          const data = await response.json();
          setProviders(data);
        }
      } catch (error) {
        console.error('Failed to load SSO providers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProviders();
  }, []);

  if (loading) {
    return <div className="space-y-2">
      {[1, 2].map(i => (
        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-2">
      {providers.map(provider => (
        <SSOProviderButton 
          key={provider.id}
          provider={provider}
          returnUrl={returnUrl}
        />
      ))}
    </div>
  );
}
```

### 2. SSO管理界面

```typescript
// app/admin/sso/page.tsx
export default function SSOManagementPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SSO提供商管理</h1>
        <Button asChild>
          <Link href="/admin/sso/create">添加SSO提供商</Link>
        </Button>
      </div>
      
      <SSOProviderList />
    </div>
  );
}

// components/admin/sso/sso-provider-list.tsx
export function SSOProviderList() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  
  // 实现提供商列表展示、启用/禁用、排序等功能
  
  return (
    <div className="space-y-4">
      {providers.map(provider => (
        <SSOProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}
```

## 🔄 兼容性和迁移策略

### 1. 向后兼容处理

```typescript
// lib/services/sso/legacy-support.ts
export function createBistuCASService(): BaseSSOService {
  // 尝试从数据库获取配置
  const provider = SSOConfigService.getProviderByName('北京信息科技大学');
  if (provider) {
    return SSOServiceFactory.createService(provider.id);
  }
  
  // 回退到环境变量配置
  console.warn('Using legacy environment variable configuration for BISTU CAS');
  return new CASService({
    providerId: '10000000-0000-0000-0000-000000000001',
    settings: {
      protocol_config: {
        base_url: process.env.BISTU_SSO_BASE_URL || 'https://sso.bistu.edu.cn',
        version: '2.0',
        endpoints: {
          login: '/login',
          logout: '/logout',
          validate: '/serviceValidate'
        }
      }
    }
  });
}
```

### 2. 渐进式迁移

**阶段1**: 保持现有API路径兼容
```typescript
// app/api/sso/bistu/login/route.ts
export async function GET(request: NextRequest) {
  // 重定向到新的动态路由
  const providerId = '10000000-0000-0000-0000-000000000001';
  const returnUrl = request.nextUrl.searchParams.get('returnUrl');
  
  const redirectUrl = new URL(`/api/sso/${providerId}/login`, process.env.NEXT_PUBLIC_APP_URL);
  if (returnUrl) {
    redirectUrl.searchParams.set('returnUrl', returnUrl);
  }
  
  return NextResponse.redirect(redirectUrl);
}
```

## 📋 实施计划

### 阶段1: 数据库扩展 (1周)

1. **扩展sso_providers表**
   - 添加新字段（display_order, button_text等）
   - 更新现有北信科配置

2. **创建协议模板表**
   - 创建sso_protocol_templates表
   - 插入CAS协议模板

3. **数据迁移验证**
   - 确保现有SSO功能正常
   - 验证数据完整性

### 阶段2: 服务层重构 (2周)

1. **创建基础服务类**
   - 实现BaseSSOService抽象类
   - 重构CASService继承基类

2. **配置服务实现**
   - 实现SSOConfigService
   - 实现SSOServiceFactory

3. **向后兼容处理**
   - 保持现有createBistuCASService函数
   - 添加渐进式迁移支持

### 阶段3: API层重构 (1-2周)

1. **动态路由实现**
   - 创建/api/sso/[providerId]/*路由
   - 实现通用回调处理

2. **管理API开发**
   - 实现SSO提供商CRUD API
   - 添加配置验证和测试接口

3. **兼容性路由**
   - 保持/api/sso/bistu/*路径
   - 重定向到新的动态路由

### 阶段4: 前端开发 (2周)

1. **动态组件开发**
   - 实现DynamicSSOButtons组件
   - 更新登录页面

2. **管理界面开发**
   - 创建SSO管理页面
   - 实现配置编辑器

3. **用户体验优化**
   - 添加加载状态
   - 优化错误处理

### 阶段5: 测试和部署 (1周)

1. **功能测试**
   - 测试现有SSO功能
   - 测试新增提供商功能

2. **安全测试**
   - 验证权限控制
   - 测试配置验证

3. **生产部署**
   - 数据库迁移
   - 功能验证

## 🔒 安全考虑

### 1. 配置安全

- 敏感信息加密存储
- 管理员权限验证
- 配置变更审计日志

### 2. 运行时安全

- URL验证和重定向保护
- 请求超时和频率限制
- 错误信息脱敏

### 3. 数据安全

- RLS策略保护
- 输入验证和清理
- SQL注入防护

## 🎯 预期效果

✅ **配置统一化**: 所有SSO配置集中在数据库管理  
✅ **界面可视化**: 管理员可通过界面配置SSO  
✅ **扩展灵活性**: 支持多种SSO协议，易于扩展  
✅ **安全可控**: 配置验证、连接测试、审计日志  
✅ **用户友好**: 动态SSO按钮，自定义样式  
✅ **维护简便**: 无需修改代码即可调整SSO配置  
✅ **向后兼容**: 现有功能不受影响，平滑迁移  

## 📝 风险评估

### 高风险项

1. **数据库迁移**: 谨慎处理现有数据，确保不破坏当前SSO功能
2. **缓存一致性**: 服务重启后缓存失效，需要预热机制
3. **配置错误**: 错误配置可能导致SSO完全失效

### 缓解措施

1. **分阶段部署**: 先扩展数据库，再逐步迁移功能
2. **回滚方案**: 保持旧代码路径，出问题时快速回滚
3. **监控告警**: 添加SSO成功率监控，异常时及时告警

## 📚 参考文档

- [当前SSO实现文档](./bistu-sso-integration-guide.md)
- [数据库设计文档](./DATABASE-DESIGN.md)
- [Supabase数据库文档](./supabase-docs.md)

## 💡 优化建议

### 方案1：完全使用 settings.ui（推荐）

```sql
-- 移除冗余字段，只保留必要的
ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- settings 结构优化
COMMENT ON COLUMN sso_providers.settings IS '
{
  "protocol_config": { ... },
  "security": { ... },
  "ui": {
    "button_text": "北京信息科技大学统一认证",
    "button_icon": "🏛️",
    "logo_url": "https://example.com/logo.png",
    "description": "北京信息科技大学统一认证系统",
    "theme": "default"  // 简化的主题标识
  }
}';
```

### 方案2：保留核心字段，去除冗余

```sql
-- 只保留最常用的字段
ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ADD COLUMN IF NOT EXISTS button_text TEXT;

-- 去除 button_icon 和 button_style
-- 图标和样式信息放入 settings.ui
```

## 🎯 最佳实践建议

### 1. **数据存储原则**
- **频繁查询的字段**：放在表级别（如 `button_text`, `display_order`）
- **复杂配置信息**：放在JSONB中（如图标、样式、描述）
- **避免重复存储**：同一信息只存储一次

### 2. **简化的数据结构**

```sql
-- 推荐的最终结构
ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ADD COLUMN IF NOT EXISTS button_text TEXT;

-- settings 中包含其他UI信息
{
  "protocol_config": { ... },
  "security": { ... },
  "ui": {
    "icon": "🏛️",
    "logo_url": "",
    "description": "详细描述",
    "theme": "primary" // 简化的主题标识，而非具体样式
  }
}
```

### 3. **前端处理方案**

```typescript
// 组件中统一处理样式
const getButtonStyle = (theme: string) => {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-gray-600 hover:bg-gray-700", 
    default: "bg-slate-600 hover:bg-slate-700"
  }
  return styles[theme] || styles.default
}

// SSO按钮组件示例
const SSOProviderButton = ({ provider }: { provider: SSOProvider }) => {
  const uiConfig = provider.settings.ui || {};
  const theme = uiConfig.theme || 'default';
  
  return (
    <Button 
      className={cn(
        "w-full justify-start gap-3",
        getButtonStyle(theme)
      )}
      onClick={() => window.location.href = `/api/sso/${provider.id}/login`}
    >
      {uiConfig.icon && <span className="text-lg">{uiConfig.icon}</span>}
      <span>{provider.button_text || provider.name}</span>
    </Button>
  );
};
```

## 📋 修正后的迁移方案

```sql
-- 简化的表结构扩展
ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ADD COLUMN IF NOT EXISTS button_text TEXT;

-- 更新现有数据
UPDATE sso_providers 
SET 
  button_text = '北京信息科技大学统一认证',
  display_order = 1,
  settings = settings || jsonb_build_object(
    'ui', jsonb_build_object(
      'icon', '🏛️',
      'logo_url', '',
      'description', '北京信息科技大学统一认证系统',
      'theme', 'primary'
    )
  )
WHERE name = '北京信息科技大学';
``` 