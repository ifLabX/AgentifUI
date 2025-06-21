# SSO配置管理系统使用指南

本文档介绍如何使用新的SSO配置管理系统，该系统支持通过后端界面动态配置多种SSO提供商。

## 🎯 系统概述

### 主要特性

✅ **动态配置**: 通过管理界面配置SSO提供商，无需修改代码  
✅ **多协议支持**: 支持CAS、OIDC、SAML等多种SSO协议  
✅ **向后兼容**: 现有的BISTU SSO功能完全兼容  
✅ **可视化管理**: 友好的Web界面进行配置管理  
✅ **连接测试**: 内置连接测试功能  
✅ **缓存优化**: 自动缓存配置，提高性能  

### 架构设计

```
前端登录页面 → 动态SSO按钮 → SSO API路由 → 服务工厂 → 协议实现
     ↑                                                          ↓
管理员界面 ← 配置API ← 配置服务 ← 数据库配置 ← 协议模板
```

## 🚀 快速开始

### 1. 数据库迁移

应用新的数据库迁移文件：

```bash
# 查看迁移状态
npx supabase migration list

# 应用迁移
npx supabase db push
```

### 2. 验证现有配置

运行测试脚本验证系统功能：

```bash
node scripts/test_sso_system.js
```

### 3. 访问管理界面

访问 `/admin/sso` 查看和管理SSO提供商配置。

## 📊 管理界面功能

### SSO提供商管理

- **查看列表**: 显示所有配置的SSO提供商
- **创建新提供商**: 支持CAS、OIDC、SAML协议
- **编辑配置**: 修改现有提供商的配置
- **启用/禁用**: 控制提供商的可用状态
- **排序**: 调整按钮在登录页面的显示顺序
- **连接测试**: 测试SSO服务器连接状态

### 配置选项

#### 基础配置
- **名称**: 提供商显示名称
- **协议**: SSO协议类型（CAS/OIDC/SAML）
- **启用状态**: 是否在登录页面显示

#### UI配置
- **按钮文本**: 登录按钮显示文字
- **显示顺序**: 在登录页面的排序
- **图标**: 按钮图标（在settings.ui.icon中配置）
- **主题**: 按钮主题样式（在settings.ui.theme中配置）
- **Logo**: 机构Logo图片（在settings.ui.logo_url中配置）

#### 协议配置
- **服务器地址**: SSO服务器的基础URL
- **端点配置**: 登录、注销、验证等端点
- **属性映射**: 用户属性字段映射
- **安全设置**: HTTPS要求、证书验证等

## 🔧 API接口

### 公开API（供前端使用）

```typescript
// 获取可用的SSO提供商列表
GET /api/sso/providers

// SSO登录（动态路由）
GET /api/sso/{providerId}/login?returnUrl=/chat

// SSO回调（动态路由）
GET /api/sso/{providerId}/callback

// SSO注销（动态路由）
GET /api/sso/{providerId}/logout
```

### 管理API（需要管理员权限）

```typescript
// 获取所有SSO提供商
GET /api/admin/sso/providers

// 创建SSO提供商
POST /api/admin/sso/providers

// 更新SSO提供商
PUT /api/admin/sso/providers/{id}

// 删除SSO提供商
DELETE /api/admin/sso/providers/{id}

// 测试连接
POST /api/admin/sso/providers/{id}/test

// 获取协议模板
GET /api/admin/sso/templates
```

## 🎨 前端集成

### 动态SSO按钮

新的登录页面会自动显示所有启用的SSO提供商：

```tsx
import { DynamicSSOButtons } from '@components/auth/dynamic-sso-buttons';

// 在登录表单中使用
<DynamicSSOButtons returnUrl="/chat" />
```

### 按钮样式处理

通过主题配置控制按钮样式，在前端统一处理：

```tsx
// 组件中统一处理样式
const getButtonStyle = (theme: string) => {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white", 
    default: "bg-slate-600 hover:bg-slate-700 text-white",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
  }
  return styles[theme] || styles.default
}

// SSO按钮组件
const SSOProviderButton = ({ provider }) => {
  const uiConfig = provider.settings.ui || {};
  
  return (
    <Button 
      className={cn(
        "w-full justify-start gap-3",
        getButtonStyle(uiConfig.theme || 'default')
      )}
    >
      {uiConfig.icon && <span className="text-lg">{uiConfig.icon}</span>}
      <span>{provider.button_text || provider.name}</span>
    </Button>
  );
};
```

## 🔐 配置CAS协议

### 标准CAS配置示例

```json
{
  "name": "某某大学统一认证",
  "protocol": "CAS",
  "settings": {
    "protocol_config": {
      "base_url": "https://sso.example.edu.cn",
      "version": "2.0",
      "timeout": 10000,
      "endpoints": {
        "login": "/login",
        "logout": "/logout",
        "validate": "/serviceValidate"
      },
      "attributes_mapping": {
        "employee_id": "cas:user",
        "username": "cas:username",
        "full_name": "cas:name"
      }
    },
    "security": {
      "require_https": true,
      "validate_certificates": true,
      "allowed_redirect_hosts": ["example.edu.cn"]
    },
    "ui": {
      "icon": "🏛️",
      "logo_url": "https://example.edu.cn/logo.png",
      "description": "某某大学统一认证系统",
      "theme": "primary"
    }
  },
  "button_text": "某某大学统一认证",
  "display_order": 1,
  "enabled": true
}
```

## 🔧 向后兼容

### 现有API路径

为保证向后兼容，以下旧API路径仍然可用：

```bash
# 旧路径（重定向到新实现）
/api/sso/bistu/login
/api/sso/bistu/logout  
/api/sso/bistu/callback

# 新路径（推荐使用）
/api/sso/10000000-0000-0000-0000-000000000001/login
/api/sso/10000000-0000-0000-0000-000000000001/logout
/api/sso/10000000-0000-0000-0000-000000000001/callback
```

### 代码兼容

现有的BistuCASService相关代码仍然可用：

```typescript
// 旧代码仍然可用
import { createBistuCASService } from '@lib/services/sso/bistu-cas-service';

// 新代码（推荐）
import { SSOServiceFactory } from '@lib/services/sso';
const service = await SSOServiceFactory.createServiceByName('北京信息科技大学');
```

## 📈 性能优化

### 缓存机制

- **配置缓存**: SSO提供商配置缓存5分钟
- **服务缓存**: SSO服务实例缓存直到配置更新
- **自动清理**: 配置更新时自动清除相关缓存

### 懒加载

- **按需创建**: 只在需要时创建SSO服务实例
- **动态加载**: 前端按需加载SSO提供商列表

## 🛠️ 故障排查

### 常见问题

#### 1. SSO提供商不显示
- 检查提供商是否已启用
- 验证配置是否正确
- 查看浏览器控制台错误

#### 2. 登录重定向失败
- 检查base_url配置是否正确
- 验证NEXT_PUBLIC_APP_URL环境变量
- 确认SSO服务器可访问

#### 3. 回调处理失败
- 检查回调URL配置
- 验证ticket验证端点
- 查看服务器日志

### 调试工具

```bash
# 测试API端点
node scripts/test_sso_system.js

# 检查TypeScript类型
npx tsc --noEmit

# 查看数据库配置
# 在Supabase Dashboard中查看sso_providers表
```

## 🔄 扩展指南

### 添加新协议

1. **创建协议实现**:
   ```typescript
   export class NewProtocolService extends BaseSSOService {
     // 实现协议特定逻辑
   }
   ```

2. **更新服务工厂**:
   ```typescript
   case 'NewProtocol':
     service = new NewProtocolService(config);
     break;
   ```

3. **添加协议模板**:
   ```sql
   INSERT INTO sso_protocol_templates (protocol, name, ...)
   VALUES ('NewProtocol', '新协议', ...);
   ```

### 自定义用户字段

修改用户创建逻辑以支持更多字段：

```typescript
// 在SSOUserService.createSSOUser中
user_metadata: {
  full_name: userData.fullName,
  username: userData.username,
  employee_number: userData.employeeNumber,
  department: userData.department,      // 新增
  student_type: userData.studentType,   // 新增
  // ... 其他自定义字段
}
```

## 📝 最佳实践

1. **安全配置**: 始终启用HTTPS和证书验证
2. **错误处理**: 配置合适的超时时间和重试机制
3. **用户体验**: 设置清晰的按钮文本和图标
4. **监控**: 定期测试SSO连接状态
5. **备份**: 定期备份SSO配置数据

## 🤝 贡献指南

如需扩展或改进SSO系统，请参考：

1. 遵循现有的代码规范和注释风格
2. 添加适当的TypeScript类型定义
3. 编写测试用例验证新功能
4. 更新相关文档说明

---

## 📞 技术支持

如有问题或建议，请：

1. 查看日志文件获取详细错误信息
2. 运行测试脚本验证系统状态
3. 联系系统管理员获取支持 

## 🗄️ 数据库设计说明

### 核心表结构

#### sso_providers 表
SSO提供商配置的主表，存储所有SSO提供商的基本信息和配置。

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | UUID | 提供商唯一标识符，用于API路由 | `10000000-0000-0000-0000-000000000001` |
| `name` | TEXT | 提供商显示名称 | `北京信息科技大学` |
| `protocol` | ENUM | SSO协议类型 | `CAS`, `OIDC`, `SAML` |
| `settings` | JSONB | 完整配置信息（详见下方结构说明） | `{"protocol_config": {...}}` |
| `enabled` | BOOLEAN | 是否启用 | `true`/`false` |
| `display_order` | INTEGER | 登录页面显示顺序 | `1`, `2`, `3` |
| `button_text` | TEXT | 登录按钮文本 | `北京信息科技大学统一认证` |
| `client_id` | TEXT | OAuth2/OIDC客户端ID（预留） | - |
| `client_secret` | TEXT | OAuth2/OIDC客户端密钥（预留） | - |
| `metadata_url` | TEXT | SAML元数据URL（预留） | - |

#### sso_protocol_templates 表  
协议配置模板表，为不同SSO协议提供标准配置模板和验证规则。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 模板唯一标识符 |
| `protocol` | ENUM | 协议类型 |
| `name` | TEXT | 模板显示名称 |
| `description` | TEXT | 协议详细描述 |
| `config_schema` | JSONB | JSON Schema验证规则 |
| `default_settings` | JSONB | 默认配置模板 |

### settings 字段结构说明

`sso_providers.settings` 字段采用JSONB格式存储复杂配置，标准结构如下：

```json
{
  "protocol_config": {
    "base_url": "https://sso.example.edu.cn",    // SSO服务器地址
    "version": "2.0",                            // 协议版本
    "timeout": 10000,                            // 超时时间（毫秒）
    "endpoints": {
      "login": "/login",                         // 登录端点
      "logout": "/logout",                       // 注销端点
      "validate": "/serviceValidate"             // 验证端点
    },
    "attributes_mapping": {                      // 用户属性映射
      "employee_id": "cas:user",                 // 工号字段
      "username": "cas:username",                // 用户名字段
      "full_name": "cas:name"                    // 全名字段
    }
  },
  "security": {
    "require_https": true,                       // 要求HTTPS
    "validate_certificates": true,               // 验证SSL证书
    "allowed_redirect_hosts": ["example.edu.cn"] // 允许重定向的主机
  },
  "ui": {
    "icon": "🏛️",                              // 按钮图标
    "logo_url": "https://example.edu.cn/logo.png", // 机构Logo
    "description": "某某大学统一认证系统",        // 详细描述
    "theme": "primary"                          // 按钮主题
  }
}
```

### 数据访问模式

#### 查询模式
- **按启用状态查询**: `WHERE enabled = true ORDER BY display_order`
- **按协议类型查询**: `WHERE protocol = 'CAS' AND enabled = true`
- **按ID精确查询**: `WHERE id = $1 AND enabled = true`

#### 缓存策略
- **配置缓存**: 5分钟内存缓存，减少数据库查询
- **服务实例缓存**: 基于providerId缓存服务实例
- **缓存失效**: 配置更新时自动清理相关缓存

#### 索引建议
```sql
-- 提高查询性能的索引
CREATE INDEX idx_sso_providers_enabled_order ON sso_providers(enabled, display_order);
CREATE INDEX idx_sso_providers_protocol ON sso_providers(protocol);
CREATE INDEX idx_sso_protocol_templates_protocol ON sso_protocol_templates(protocol);
``` 