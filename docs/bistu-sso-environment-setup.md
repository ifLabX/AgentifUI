# 北京信息科技大学SSO环境配置指南

## 环境变量配置

在项目根目录的 `.env.local` 文件中添加以下配置：

```bash
# --- BEGIN COMMENT ---
# 北京信息科技大学SSO配置
# ⚠️ 重要：以下配置需要根据您的实际环境进行调整
# --- END COMMENT ---

# 北信CAS服务器地址（通常不需要修改）
BISTU_SSO_BASE_URL=https://sso.bistu.edu.cn

# 当前应用的完整URL（用于构建回调地址）
# ⚠️ 必须配置：请替换为您的实际域名
NEXT_PUBLIC_APP_URL=https://your-domain.com

# CAS协议版本（可选，默认2.0）
BISTU_CAS_VERSION=2.0

# 会话加密密钥（生产环境必须配置）
# ⚠️ 生产环境请使用强随机密钥
SESSION_SECRET=your-super-secret-session-key-here-change-in-production
```

## 配置说明

### 必须配置的变量

1. **NEXT_PUBLIC_APP_URL**
   - 当前应用的完整URL
   - 开发环境示例：`http://localhost:3000`
   - 生产环境示例：`https://your-app.com`
   - 用于构建CAS回调地址

2. **SESSION_SECRET**
   - 用于加密会话数据的密钥
   - 生产环境必须使用强随机密钥
   - 长度建议32位以上

### 可选配置的变量

1. **BISTU_SSO_BASE_URL**
   - 北信CAS服务器地址
   - 默认值：`https://sso.bistu.edu.cn`
   - 通常不需要修改

2. **BISTU_CAS_VERSION**
   - CAS协议版本
   - 默认值：`2.0`
   - 可选值：`2.0` 或 `3.0`

## 部署配置检查清单

### 开发环境

- [ ] 设置 `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] 设置 `SESSION_SECRET`（开发用）
- [ ] 运行数据库迁移
- [ ] 安装依赖 `pnpm install`

### 生产环境

- [ ] 设置正确的 `NEXT_PUBLIC_APP_URL`
- [ ] 设置强随机的 `SESSION_SECRET`
- [ ] 确保HTTPS配置正确
- [ ] 运行数据库迁移
- [ ] 测试SSO登录流程

## 安全注意事项

1. **HTTPS要求**
   - 生产环境必须使用HTTPS
   - CAS协议要求安全连接

2. **会话安全**
   - `SESSION_SECRET` 必须保密
   - 定期更换会话密钥

3. **域名配置**
   - 确保回调URL正确配置
   - 避免开放重定向漏洞

## 常见问题

### Q: 如何生成安全的SESSION_SECRET？

```bash
# 使用Node.js生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用openssl
openssl rand -hex 32
```

### Q: 开发环境如何测试SSO？

开发环境需要：
1. 配置正确的回调URL
2. 确保网络可以访问北信CAS服务器
3. 使用有效的学工号测试

### Q: 生产环境部署注意事项？

1. 使用HTTPS
2. 配置正确的域名
3. 确保数据库连接正常
4. 测试完整的登录流程 