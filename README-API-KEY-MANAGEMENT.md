# API 密钥管理系统

本文档介绍了 API 密钥管理系统的设计、实现和使用方法。

## 概述

API 密钥管理系统用于安全地存储和管理各种 API 提供商（如 Dify、OpenAI 等）的密钥和配置信息。系统将敏感信息存储在数据库中，并使用加密技术保护 API 密钥。

## 实现的功能

1. **安全存储 API 密钥**：使用 AES-256-GCM 加密算法加密存储 API 密钥
2. **提供商和服务实例管理**：支持多种 API 提供商和服务实例
3. **配置缓存**：缓存 API 配置，减少数据库查询
4. **回退机制**：当数据库配置不可用时，回退到环境变量
5. **React Hook**：提供 React Hook 用于在组件中预加载 API 配置

## 数据库结构

系统使用以下数据库表：

1. **providers**：存储 API 提供商信息
   - id: UUID (主键)
   - name: 提供商名称
   - type: 提供商类型 (direct/aggregator)
   - base_url: 基础 URL
   - auth_type: 认证类型
   - is_active: 是否激活

2. **service_instances**：存储服务实例信息
   - id: UUID (主键)
   - provider_id: 关联提供商
   - name: 实例名称
   - instance_id: 实例标识符
   - api_path: API 路径
   - is_default: 是否为默认实例
   - config: 其他配置参数

3. **api_keys**：存储 API 密钥
   - id: UUID (主键)
   - provider_id: 关联提供商
   - user_id: 关联用户 (可选)
   - key_value: 加密的密钥值
   - is_default: 是否为默认密钥
   - usage_count: 使用次数
   - last_used_at: 最后使用时间

## 安装和设置

### 1. 创建数据库表

在 Supabase 控制台中执行 `supabase/migrations/20250508_api_key_management.sql` 脚本，创建必要的数据库表。

### 2. 设置加密主密钥

在 `.env.local` 文件中添加 `API_ENCRYPTION_KEY` 环境变量，用于加密和解密 API 密钥。如果没有设置，迁移脚本会自动生成一个。

```
# API 密钥加密主密钥
API_ENCRYPTION_KEY=your_random_32_byte_hex_string
```

### 3. 迁移现有 Dify 配置

运行以下命令，将环境变量中的 Dify 配置迁移到数据库：

```bash
npm run migrate-dify
```

## 使用方法

### 获取 Dify 配置

获取 Dify 应用配置通常涉及两个步骤：
1. **获取当前应用的 `appId`**：这通常通过状态管理（例如，我们项目中的 `useCurrentAppStore`）来实现，该状态管理会从数据库加载默认应用或用户选择的应用。
2. **使用 `appId` 获取具体配置**：可以将获取到的 `appId` 传递给 `getDifyAppConfig` 函数或 `useDifyConfig` Hook。

```typescript
import { getDifyAppConfig } from '@lib/config/dify-config';
import { useCurrentAppStore } from '@lib/stores/current-app-store'; // 假设的路径

// 示例：在某个异步函数或服务端逻辑中
async function someFunction() {
  // 1. 从 Store 获取当前 appId (这里用伪代码表示，实际取决于 Store 实现)
  // const currentAppId = useCurrentAppStore.getState().currentAppId; 
  // 或者，如果是在初始化阶段，可能是直接获取默认配置的 appId
  const defaultAppInstance = await getDefaultAppInstanceFromDb(); // 伪代码：从数据库获取默认应用
  const appIdToUse = defaultAppInstance?.instance_id;

  if (!appIdToUse) {
    console.error("当前应用ID未设置");
    return;
  }

  // 2. 获取配置
  const config = await getDifyAppConfig(appIdToUse); // appId 是必需的

  // 使用配置
  if (config) {
  const { apiKey, apiUrl } = config;
  // 使用 apiKey 和 apiUrl 调用 Dify API
}
```

### 在 React 组件中使用

```tsx
import { useDifyConfig } from '@lib/hooks/use-api-config'; // 确保路径正确
import { useCurrentAppStore } from '@lib/stores/current-app-store'; // 确保路径正确

function ChatComponent() {
  // 1. 从 Store 获取当前 appId 和加载状态
  const { currentAppId, isLoadingAppId, errorLoadingAppId } = useCurrentAppStore();

  // 2. 使用获取到的 appId 调用 useDifyConfig
  // 注意：只有当 currentAppId 有效时才调用 useDifyConfig，或者 useDifyConfig 内部能处理 appId 为 null 的情况
  // 当前 useDifyConfig 要求 appId 是 string，所以需要确保 currentAppId 不是 null
  
  // 处理 appId 加载状态
  const appIdForConfig = currentAppId; // 直接使用，但后续逻辑需要处理其可能为 null 的情况

  // 当 appIdForConfig 准备好后，才获取其 Dify 配置
  const { 
    config, 
    isLoading: isConfigLoading, 
    error: configError 
  } = useDifyConfig(appIdForConfig!); // 使用非空断言，前提是确保 appIdForConfig 在此时已有效
                                     // 更安全的做法是条件性调用或传递

  if (isLoadingAppId) return <div>Loading application ID...</div>;
  if (errorLoadingAppId) return <div>Error loading application ID: {errorLoadingAppId}</div>;
  if (!appIdForConfig) return <div>Application ID not available. Please select an application.</div>;
  
  if (isConfigLoading) return <div>Loading Dify configuration for app: {appIdForConfig}...</div>;
  if (configError) return <div>Error loading Dify config: {configError.message}</div>;
  if (!config) return <div>Dify configuration not found for app: {appIdForConfig}</div>;
  
  // 使用 config.apiKey 和 config.apiUrl
  return (
    <div>
      {/* 聊天组件内容 */}
    </div>
  );
}
```

## 安全注意事项

1. **主密钥保护**：确保 `API_ENCRYPTION_KEY` 安全存储，不要泄露或提交到版本控制系统
2. **定期轮换密钥**：定期更新 API 密钥，提高安全性
3. **访问控制**：限制对 API 密钥表的访问权限，只允许授权用户和服务访问

## 后续开发计划

1. **管理界面**：开发 API 密钥和提供商管理界面
2. **用户自定义密钥**：支持用户添加自己的 API 密钥
3. **使用统计**：跟踪 API 密钥使用情况
4. **密钥轮换**：实现自动密钥轮换功能
5. **支持更多提供商**：添加对 OpenAI、Anthropic 等提供商的支持
