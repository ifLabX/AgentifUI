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

```typescript
import { getDifyAppConfig } from '../lib/config/dify-config';

// 获取默认 Dify 应用配置
const config = await getDifyAppConfig('default');

// 使用配置
if (config) {
  const { apiKey, apiUrl } = config;
  // 使用 apiKey 和 apiUrl 调用 Dify API
}
```

### 在 React 组件中使用

```tsx
import { useDifyConfig } from '../lib/hooks/use-api-config';

function ChatComponent() {
  const { config, isLoading, error } = useDifyConfig('default');
  
  if (isLoading) return <div>Loading configuration...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!config) return <div>Configuration not found</div>;
  
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
