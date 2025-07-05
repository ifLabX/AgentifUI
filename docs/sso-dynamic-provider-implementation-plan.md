# 动态SSO提供商展示方案

## 1. 背景与问题

当前项目需要在登录页面根据数据库中的配置，动态展示可用的单点登录（SSO）选项。现有的实现 (`app/api/sso/providers/route.ts`) 尝试直接从核心的 `sso_providers` 表中查询数据，但这引发了一个关键的权限问题。

**根本原因**: `sso_providers` 表受严格的行级安全策略（RLS）保护，只允许管理员角色访问，以保护 `client_secret` 等敏感信息。当普通或未登录用户访问登录页时，其前端请求最终因权限不足而被数据库拒绝，导致API返回空列表，页面上无法显示任何SSO按钮。这是一个典型的RLS权限设计与应用需求之间的冲突。

## 2. 最佳实现方案

为了在不破坏现有安全模型的前提下解决此问题，我们采用分层设计方案，将安全策略固定在数据库层，确保极致安全和代码清晰。

### 第一步：创建安全的数据库视图（数据库层）

这是整个方案的基石。我们将创建一个新的数据库迁移文件，在数据库中创建一个专门用于公开SSO提供商信息的视图(VIEW)。这样做的好处是，安全策略在数据库层面强制执行，应用代码无论如何都无法访问到这个视图之外的敏感信息。

- **创建迁移文件**: 新增一个`supabase/migrations/`下的SQL文件。
- **定义视图 `public_sso_providers`**:
  - 此视图从 `sso_providers` 表中读取数据。
  - **只包含**对前端安全且必要的字段：`id`, `name`, `protocol`, `button_text`, `display_order` 以及 `settings` 中的 `ui` 部分。
  - 自动过滤出所有 `enabled = true` 的提供商。
- **授予权限**:
  - 为新视图设置行级安全策略（RLS），允许 `anon` (未登录用户) 和 `authenticated` (已登录用户) 角色进行读取操作。
  - 这样，即使用户未登录，前端也能安全地获取到SSO按钮列表。

### 第二步：创建API路由提供数据（后端API层）

为了让前端能方便地获取数据，我们将修改现有的API路由，使其从新的安全视图中读取数据。

- **修改API路由**: `app/api/sso/providers/route.ts`。
- **实现GET方法**:
  - 此路由的 `GET` 方法将接收前端的请求。
  - 它会使用标准的Supabase客户端查询我们在第一步中创建的 `public_sso_providers` 视图。
  - 由于视图是公开可读的，这里的查询不需要任何特殊的管理员权限，符合最小权限原则。
  - 最后，它会将查询到的提供商列表（按 `display_order` 排序）以JSON格式返回给前端。

### 第三步：在登录页面动态渲染SSO按钮（前端UI层）

最后，我们将修改登录页面，让它能够根据环境变量的设置来决定是否请求并显示这些动态的SSO登录按钮。

- **创建并使用动态按钮组件**:
  - 我们将创建一个新的客户端组件 `DynamicSSOButtons` (`'use client'`)。
  - 这个新组件会负责调用第二步创建的 `/api/sso/providers` 接口来获取SSO提供商列表。
  - 获取到数据后，它会遍历列表，为每个提供商生成一个登录按钮。
  - 每个按钮都是一个链接，指向 `/api/sso/${provider.id}/login`，从而触发你现有的SSO登录流程。
- **修改登录组件**: 我们会定位到 `components/auth/login-form.tsx`，并集成 `DynamicSSOButtons` 组件。

---

## 3. 实施细节与代码变更

### 步骤 1: 数据库迁移

在 `supabase/migrations/` 目录下创建一个新的SQL文件。

**文件名**: `20250715000000_create_public_sso_providers_view.sql`

**文件内容**:

```sql
-- supabase/migrations/20250715000000_create_public_sso_providers_view.sql

-- 创建一个视图，用于安全地公开启用的SSO提供商信息
CREATE OR REPLACE VIEW public.public_sso_providers AS
SELECT
    id,
    name,
    protocol,
    button_text,
    display_order,
    settings -> 'ui' as ui -- 只暴露UI相关的设置
FROM
    public.sso_providers
WHERE
    enabled = true;

-- 为视图启用行级安全
ALTER VIEW public.public_sso_providers OWNER TO postgres;
ALTER VIEW public.public_sso_providers ENABLE ROW LEVEL SECURITY;

-- 删除旧的、可能存在的策略
DROP POLICY IF EXISTS "Allow public read access to enabled SSO providers" ON public.public_sso_providers;

-- 创建新的策略，允许任何人读取此视图中的所有数据
CREATE POLICY "Allow public read access to enabled SSO providers"
ON public.public_sso_providers
FOR SELECT
TO anon, authenticated
USING (true);

-- 授予 `anon` 和 `authenticated` 角色对视图的 SELECT 权限
GRANT SELECT ON TABLE public.public_sso_providers TO anon;
GRANT SELECT ON TABLE public.public_sso_providers TO authenticated;

-- 注释：确保 postgres 用户拥有权限
GRANT ALL ON TABLE public.public_sso_providers TO postgres;

```

### 步骤 2: 修改API路由

我们将修改 `app/api/sso/providers/route.ts` 以使用新建的视图。这将**显著简化代码**并解决权限问题。

**文件路径**: `app/api/sso/providers/route.ts`

**修改前**:

```typescript
// --- BEGIN COMMENT ---
// 公共SSO提供商列表API
// 返回所有启用的SSO提供商信息，供登录页面使用
// 不需要认证，但只返回公开信息
// --- END COMMENT ---
import { SSOProviderService } from '@lib/services/sso/data/sso-provider-service';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 之前的方式：调用服务层，该服务层会查询受RLS保护的表
    const providers = await SSOProviderService.getEnabledProviders();

    // 手动过滤敏感信息
    const publicProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      protocol: provider.protocol,
      button_text: provider.button_text || provider.name,
      ui: {
        icon: provider.settings.ui?.icon || '🔐',
        theme: provider.settings.ui?.theme || 'primary',
        description:
          provider.settings.ui?.description || `${provider.name}登录`,
      },
      login_url: `/api/sso/${provider.id}/login`,
    }));

    return NextResponse.json({
      success: true,
      data: publicProviders,
      count: publicProviders.length,
    });
  } catch (error) {
    console.error('[SSO-PROVIDERS] Failed to fetch SSO providers:', error);
    return NextResponse.json(/* ... */);
  }
}
```

**修改后**:

```typescript
// --- BEGIN COMMENT ---
// 公共SSO提供商列表API
// 从安全的数据库视图 `public_sso_providers` 中获取数据
// 这个视图由数据库RLS策略保护，只暴露公开信息
// --- END COMMENT ---
import { createClient } from '@lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // 确保数据总是最新的

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 新的方式：直接查询公开、安全的视图
    const { data: providers, error } = await supabase
      .from('public_sso_providers')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    // 视图已经包含了处理过的、安全的数据结构
    // 我们可以直接添加 login_url 并返回
    const publicProviders = providers.map(provider => ({
      ...provider,
      login_url: `/api/sso/${provider.id}/login`,
    }));

    return NextResponse.json({
      success: true,
      data: publicProviders,
      count: publicProviders.length,
    });
  } catch (error: any) {
    console.error(
      '[SSO-PROVIDERS] Failed to fetch SSO providers from view:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || '获取SSO提供商列表失败',
        data: [],
      },
      { status: 500 }
    );
  }
}
```

**代码删除说明**:

- `SSOProviderService` 的导入和 `getEnabledProviders` 的调用将被删除。
- `SSOProviderService.getEnabledProviders()` 方法本身在项目中将不再被此公开API使用。虽然暂时可以保留，但可以标记为 `@deprecated` 或在未来重构中移除，以保持代码库整洁。

### 步骤 3: 前端UI集成

#### A. 创建新组件 `dynamic-sso-buttons.tsx`

在 `components/auth/` 目录下创建一个新文件。

**文件名**: `components/auth/dynamic-sso-buttons.tsx`

**文件内容**:

```tsx
'use client';

import { Button } from '@components/ui/button';
import { useTheme } from '@lib/hooks/use-theme';
import type { SsoProviderPublic } from '@lib/types/sso/auth-types';
import { cn } from '@lib/utils';
import { Loader2 } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function DynamicSSOButtons() {
  const [providers, setProviders] = useState<SsoProviderPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const t = useTranslations('pages.auth.login');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/sso/providers');
        if (!response.ok) {
          throw new Error('Failed to fetch SSO providers');
        }
        const result = await response.json();
        if (result.success) {
          setProviders(result.data);
        } else {
          throw new Error(result.error || 'API returned an error');
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching SSO providers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">{t('sso.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-red-500">
        {t('sso.error')}: {error}
      </div>
    );
  }

  if (providers.length === 0) {
    return null; // 如果没有提供商，不显示任何内容
  }

  return (
    <div className="space-y-3">
      {providers.map(provider => (
        <Button
          key={provider.id}
          asChild
          variant="outline"
          className={cn(
            'w-full font-serif transition-all hover:shadow-md',
            isDark
              ? 'border-stone-700 bg-stone-800 hover:bg-stone-700/50'
              : 'border-stone-300 bg-white hover:bg-stone-100'
          )}
        >
          <Link href={provider.login_url}>
            <span className="mr-3 text-lg">{provider.ui?.icon || '🔐'}</span>
            {provider.button_text || provider.name}
          </Link>
        </Button>
      ))}
    </div>
  );
}
```

_注意：`SsoProviderPublic` 类型可能需要被创建或调整，以匹配API返回的结构。_

#### B. 修改 `login-form.tsx`

在 `components/auth/login-form.tsx` 中导入并使用 `DynamicSSOButtons` 组件。

**文件路径**: `components/auth/login-form.tsx`

```tsx
// ... 其他导入
import { BistuSSOCard } from './bistu-sso-button';
import { DynamicSSOButtons } from './dynamic-sso-buttons';
import { SocialAuthButtons } from './social-auth-buttons';

// 1. 新增导入

export function LoginForm() {
  // ... 其他hooks和状态
  const ssoOnlyMode = process.env.NEXT_PUBLIC_SSO_ONLY_MODE === 'true';
  const enableDynamicSso =
    process.env.NEXT_PUBLIC_ENABLE_DYNAMIC_SSO === 'true'; // 2. 新增环境变量检查

  // ... 表单逻辑

  return (
    // ... JSX
    <div className="space-y-6">
      {/* --- BEGIN COMMENT --- */}
      {/* 条件渲染：仅在SSO专用模式下显示北信科SSO登录 */}
      {/* --- END COMMENT --- */}
      {ssoOnlyMode && <BistuSSOCard returnUrl="/chat" />}

      {/* --- BEGIN COMMENT --- */}
      {/* 条件渲染：仅在非SSO专用模式下显示社交登录和动态SSO按钮 */}
      {/* --- END COMMENT --- */}
      {!ssoOnlyMode && (
        <>
          {/* --- BEGIN COMMENT --- */}
          {/* 社交登录区域 */}
          {/* --- END COMMENT --- */}
          <SocialAuthButtons type="login" redirectTo="/chat" />

          {/* 3. 新增动态SSO按钮组件 */}
          {enableDynamicSso && <DynamicSSOButtons />}
        </>
      )}

      {/* ... 分割线和邮箱密码表单 ... */}
    </div>
    // ... JSX
  );
}
```

## 4. 环境变量配置

为了控制此功能，需要配置以下环境变量：

```env
# .env.local

# 设置为 'true' 来启用从 /api/sso/providers 获取并显示动态SSO按钮的功能
NEXT_PUBLIC_ENABLE_DYNAMIC_SSO=true

# 保持现有逻辑，如果为 'true'，则只显示BISTU SSO卡片
# 如果为 'false'，则会显示社交登录和动态SSO按钮（如果已启用）
NEXT_PUBLIC_SSO_ONLY_MODE=false
```

## 5. 方案优势总结

- **极致安全**: 敏感信息（如密钥）被锁定在数据库核心表中，绝无可能通过此方案泄露到前端。
- **职责清晰**: 数据库负责安全，API负责数据传输，前端负责展示，易于维护和扩展。
- **性能良好**: 数据库视图性能高，且API路由可以被缓存。
- **代码优雅**: 遵循Next.js App Router和Supabase的最佳实践，代码结构清晰，且简化了API层的实现。

---

此方案是解决此类场景的行业标准，能够确保系统的安全性、健壮性和可维护性。
