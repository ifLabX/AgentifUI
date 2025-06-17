# 北京信息科技大学SSO集成技术方案

## 概述

本文档详细描述了将北京信息科技大学统一认证系统（CAS）集成到AgentifUI平台的技术方案。该方案基于CAS 2.0/3.0协议，实现用户通过学校SSO系统的单点登录功能。

**项目目标**：
- 实现北京信息科技大学CAS SSO登录集成
- 首次登录时自动创建用户账户
- 存储用户的学工号（employeeNumber）作为企业标识
- 后续登录时基于学工号识别用户身份
- 完全兼容现有的认证体系

**文档版本**：v1.0  
**更新日期**：2025-01-08

## 目录

1. [SSO认证流程分析](#sso认证流程分析)
2. [技术架构设计](#技术架构设计)
3. [数据库设计](#数据库设计)
4. [核心功能实现](#核心功能实现)
5. [API接口设计](#api接口设计)
6. [安全考虑](#安全考虑)
7. [测试方案](#测试方案)
8. [部署配置](#部署配置)
9. [错误处理](#错误处理)
10. [维护和监控](#维护和监控)

---

## SSO认证流程分析

### 北京信息科技大学CAS协议分析

根据提供的文档，北京信息科技大学采用标准的CAS（Central Authentication Service）协议，支持CAS 2.0和CAS 3.0版本。

#### 核心端点信息

| 端点类型 | URL | 协议版本 | 功能描述 |
|----------|-----|----------|----------|
| 登录入口 | `https://sso.bistu.edu.cn/login` | CAS 2.0/3.0 | 用户登录页面 |
| 注销入口 | `https://sso.bistu.edu.cn/logout` | CAS 2.0/3.0 | 用户注销 |
| 票据验证 | `https://sso.bistu.edu.cn/serviceValidate` | CAS 2.0 | 票据验证接口 |
| 票据验证 | `https://sso.bistu.edu.cn/p3/serviceValidate` | CAS 3.0 | 增强票据验证接口 |

#### 认证流程详解

##### 首次登录流程

1. **用户访问应用**：用户通过浏览器访问AgentifUI应用
2. **检查登录状态**：应用检查用户登录状态（通过session cookie判断）
3. **重定向到CAS**：判断用户未登录后，重定向到北信CAS登录页面
4. **用户登录认证**：用户在CAS页面输入学工号和密码
5. **CAS验证并重定向**：CAS验证成功后，重定向回应用并携带ticket
6. **验证ticket**：应用使用ticket调用CAS验证接口获取用户信息
7. **创建用户账户**：如果是首次登录，基于学工号创建用户账户
8. **建立应用会话**：设置应用内的session，完成登录流程

##### 已登录用户访问流程

1. **用户访问应用**：已在CAS登录的用户访问应用
2. **检查应用登录状态**：应用检查发现用户未在应用内登录
3. **重定向到CAS**：重定向到CAS服务器
4. **CAS检查CASTGC**：CAS通过CASTGC cookie验证用户已登录
5. **直接重定向**：CAS直接重定向回应用并携带ticket
6. **验证ticket并登录**：应用验证ticket后建立会话

#### CAS响应数据格式

根据测试结果，ticket验证成功后返回的XML格式：

```xml
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
  <cas:authenticationSuccess>
    <cas:user>2021011221</cas:user>
    <cas:attributes>
      <cas:log_username></cas:log_username>
      <cas:employeeNumber>2021011221</cas:employeeNumber>
    </cas:attributes>
  </cas:authenticationSuccess>
</cas:serviceResponse>
```

**关键字段说明**：
- `cas:user`: 用户登录名（学工号）
- `cas:employeeNumber`: 员工编号（学工号），作为企业唯一标识
- `cas:log_username`: 日志用户名（可能为空）

---

## 技术架构设计

### 系统架构图

```
用户浏览器
    ↓
AgentifUI应用
├── 路由层 (middleware.ts)
├── SSO处理器 (SSO Service)
├── API层 (API Routes)
├── 用户管理服务 (User Service)
└── 数据库层 (Supabase)
    ↓
北信CAS服务器
```

### 核心组件设计

#### 1. SSO认证组件 (`lib/services/sso/`)

```typescript
// SSO服务接口定义
interface SSOService {
  // 生成登录URL
  generateLoginURL(returnUrl: string): string
  
  // 验证ticket并获取用户信息
  validateTicket(ticket: string, service: string): Promise<SSOUserInfo>
  
  // 生成注销URL
  generateLogoutURL(): string
}

// 用户信息接口
interface SSOUserInfo {
  employeeNumber: string  // 学工号
  username: string        // 用户名
  success: boolean        // 验证是否成功
  attributes?: Record<string, any>  // 其他属性
}
```

#### 2. 用户管理组件 (`lib/services/user/`)

```typescript
interface UserService {
  // 通过学工号查找用户
  findUserByEmployeeNumber(employeeNumber: string): Promise<Profile | null>
  
  // 创建SSO用户
  createSSOUser(ssoUser: SSOUserInfo): Promise<Profile>
  
  // 更新用户最后登录时间
  updateLastLogin(userId: string): Promise<void>
}
```

---

## 数据库设计

### 现有表结构扩展

基于现有的数据库设计，需要对以下表进行扩展：

#### 1. profiles表扩展

```sql
-- 添加学工号字段存储
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS employee_number TEXT UNIQUE;

-- 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_profiles_employee_number 
ON profiles(employee_number) WHERE employee_number IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN profiles.employee_number IS '学工号：北京信息科技大学统一身份标识';
```

#### 2. sso_providers表配置

```sql
-- 插入北京信息科技大学SSO配置
INSERT INTO sso_providers (
  id,
  name,
  protocol,
  settings,
  enabled
) VALUES (
  gen_random_uuid(),
  '北京信息科技大学',
  'CAS',  -- 需要扩展枚举类型
  jsonb_build_object(
    'base_url', 'https://sso.bistu.edu.cn',
    'login_endpoint', '/login',
    'logout_endpoint', '/logout',
    'validate_endpoint', '/serviceValidate',
    'validate_endpoint_v3', '/p3/serviceValidate',
    'version', '2.0',
    'attributes_enabled', true
  ),
  true
) ON CONFLICT DO NOTHING;
```

#### 3. 扩展枚举类型

```sql
-- 扩展SSO协议类型以支持CAS
ALTER TYPE sso_protocol ADD VALUE IF NOT EXISTS 'CAS';

-- 扩展认证来源类型
ALTER TYPE auth_source_type ADD VALUE IF NOT EXISTS 'bistu_sso';
```

#### 4. 数据库函数

```sql
-- 学工号查找函数
CREATE OR REPLACE FUNCTION find_user_by_employee_number(emp_num TEXT)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  username TEXT,
  employee_number TEXT,
  last_login TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.employee_number,
    p.last_login
  FROM profiles p
  WHERE p.employee_number = emp_num
    AND p.status = 'active'::account_status;
END;
$$;

-- SSO用户创建函数
CREATE OR REPLACE FUNCTION create_sso_user(
  emp_number TEXT,
  user_name TEXT,
  sso_provider_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- 生成新的用户ID
  new_user_id := gen_random_uuid();
  
  -- 确保用户名唯一
  final_username := user_name;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := user_name || '_' || counter;
  END LOOP;
  
  -- 创建用户记录
  INSERT INTO profiles (
    id,
    employee_number,
    username,
    full_name,
    auth_source,
    sso_provider_id,
    status,
    role,
    created_at,
    updated_at,
    last_login
  ) VALUES (
    new_user_id,
    emp_number,
    final_username,
    user_name,
    'bistu_sso'::auth_source_type,
    sso_provider_uuid,
    'active'::account_status,
    'user'::user_role,
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN new_user_id;
END;
$$;
```

---

## 核心功能实现

### 1. BISTU CAS服务实现

创建 `lib/services/sso/bistu-cas-service.ts`：

```typescript
import { XMLParser } from 'fast-xml-parser';

export interface BistuSSOConfig {
  baseUrl: string;
  serviceUrl: string;  // 应用的回调URL
}

export interface BistuUserInfo {
  employeeNumber: string;
  username: string;
  success: boolean;
  attributes?: {
    log_username?: string;
    [key: string]: any;
  };
}

export class BistuCASService {
  private config: BistuSSOConfig;
  private xmlParser: XMLParser;

  constructor(config: BistuSSOConfig) {
    this.config = config;
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  /**
   * 生成CAS登录URL
   */
  generateLoginURL(returnUrl?: string): string {
    const serviceUrl = returnUrl ? 
      `${this.config.serviceUrl}?returnUrl=${encodeURIComponent(returnUrl)}` : 
      this.config.serviceUrl;

    const params = new URLSearchParams({
      service: serviceUrl,
    });

    return `${this.config.baseUrl}/login?${params.toString()}`;
  }

  /**
   * 生成CAS注销URL
   */
  generateLogoutURL(): string {
    return `${this.config.baseUrl}/logout`;
  }

  /**
   * 验证CAS ticket并获取用户信息
   */
  async validateTicket(ticket: string, service: string): Promise<BistuUserInfo> {
    try {
      const params = new URLSearchParams({
        service,
        ticket,
      });

      const response = await fetch(
        `${this.config.baseUrl}/serviceValidate?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/xml',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      return this.parseValidationResponse(xmlText);
    } catch (error) {
      console.error('CAS ticket validation failed:', error);
      return {
        employeeNumber: '',
        username: '',
        success: false,
      };
    }
  }

  /**
   * 解析CAS验证响应XML
   */
  private parseValidationResponse(xmlText: string): BistuUserInfo {
    try {
      const parsed = this.xmlParser.parse(xmlText);
      const serviceResponse = parsed['cas:serviceResponse'];

      if (serviceResponse['cas:authenticationSuccess']) {
        const success = serviceResponse['cas:authenticationSuccess'];
        const user = success['cas:user'];
        const attributes = success['cas:attributes'] || {};

        return {
          username: user,
          employeeNumber: attributes['cas:employeeNumber'] || user,
          success: true,
          attributes: {
            log_username: attributes['cas:log_username'] || '',
          },
        };
      } else if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        console.error('CAS authentication failed:', failure);
        return {
          employeeNumber: '',
          username: '',
          success: false,
        };
      }

      throw new Error('Unexpected CAS response format');
    } catch (error) {
      console.error('Failed to parse CAS response:', error);
      return {
        employeeNumber: '',
        username: '',
        success: false,
      };
    }
  }
}
```

### 2. SSO用户管理服务

创建 `lib/services/user/sso-user-service.ts`：

```typescript
import { supabaseServerClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/database';

export interface CreateSSOUserData {
  employeeNumber: string;
  username: string;
  ssoProviderId: string;
}

export class SSOUserService {
  /**
   * 通过学工号查找用户
   */
  static async findUserByEmployeeNumber(employeeNumber: string): Promise<Profile | null> {
    const supabase = supabaseServerClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('employee_number', employeeNumber)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到记录
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * 创建SSO用户
   */
  static async createSSOUser(userData: CreateSSOUserData): Promise<Profile> {
    const supabase = supabaseServerClient();

    // 调用数据库函数创建用户
    const { data, error } = await supabase.rpc('create_sso_user', {
      emp_number: userData.employeeNumber,
      user_name: userData.username,
      sso_provider_uuid: userData.ssoProviderId,
    });

    if (error) {
      throw error;
    }

    // 获取创建的用户信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data)
      .single();

    if (profileError) {
      throw profileError;
    }

    return profile;
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const supabase = supabaseServerClient();

    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }
}
```

---

## API接口设计

### 1. SSO登录入口

创建 `app/api/sso/bistu/login/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { BistuCASService } from '@/lib/services/sso/bistu-cas-service';

export async function GET(request: NextRequest) {
  try {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/chat';
    
    const casService = new BistuCASService({
      baseUrl: 'https://sso.bistu.edu.cn',
      serviceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sso/bistu/callback`,
    });

    const loginUrl = casService.generateLoginURL(returnUrl);
    
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('SSO login redirect failed:', error);
    return NextResponse.redirect('/login?error=sso_redirect_failed');
  }
}
```

### 2. SSO回调处理

创建 `app/api/sso/bistu/callback/route.ts`：

这个接口负责处理CAS回调，验证ticket，创建或查找用户，建立会话。

### 3. SSO注销处理

创建 `app/api/sso/bistu/logout/route.ts`：

处理用户注销，清除本地会话并重定向到CAS注销页面。

---

## 实施步骤

### 第一阶段：数据库准备
1. 扩展现有表结构
2. 创建必要的数据库函数
3. 配置SSO提供商信息

### 第二阶段：核心服务开发
1. 实现BISTU CAS服务
2. 实现SSO用户管理服务
3. 单元测试覆盖

### 第三阶段：API接口开发
1. 实现SSO登录、回调、注销接口
2. 集成测试
3. 错误处理完善

### 第四阶段：前端集成
1. 添加SSO登录按钮
2. 用户体验优化
3. 端到端测试

### 第五阶段：部署和监控
1. 生产环境配置
2. 监控和日志
3. 性能优化

该方案确保了系统的安全性、可维护性和用户体验，完全兼容现有系统架构。 