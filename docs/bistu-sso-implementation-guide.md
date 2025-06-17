# 北京信息科技大学SSO实施指南

基于技术方案文档 `bistu-sso-integration-guide.md` 的具体实施步骤。

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install fast-xml-parser
```

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# ⚠️ 必须配置 - 请替换为您的实际域名
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 开发环境
# NEXT_PUBLIC_APP_URL=https://your-domain.com  # 生产环境

# ⚠️ 必须配置 - 会话加密密钥
SESSION_SECRET=your-secret-key-here

# 可选配置
BISTU_SSO_BASE_URL=https://sso.bistu.edu.cn
BISTU_CAS_VERSION=2.0
```

### 3. 运行数据库迁移

```bash
# 应用SSO支持迁移
npx supabase db push
```

### 4. 验证集成

1. 启动开发服务器：`pnpm run dev`
2. 访问登录页面，应该能看到"北京信息科技大学统一认证"按钮
3. 点击按钮测试重定向到CAS服务器

## 📁 已创建的文件

### 后端实现

- `supabase/migrations/20250108000000_add_bistu_sso_support.sql` - 数据库迁移
- `lib/services/sso/bistu-cas-service.ts` - CAS服务实现
- `lib/services/user/sso-user-service.ts` - 用户管理服务
- `app/api/sso/bistu/login/route.ts` - 登录入口API
- `app/api/sso/bistu/callback/route.ts` - 回调处理API
- `app/api/sso/bistu/logout/route.ts` - 注销处理API

### 前端实现

- `components/auth/bistu-sso-button.tsx` - SSO登录按钮组件
- `components/auth/login-form.tsx` - 已集成SSO按钮的登录表单

### 配置和文档

- `docs/bistu-sso-environment-setup.md` - 环境配置指南
- `docs/bistu-sso-integration-guide.md` - 技术方案文档

## ⚠️ 需要您配置的内容

### 1. 环境变量配置

在 `.env.local` 中设置：

```bash
# 🔧 必须修改：您的应用URL
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com

# 🔧 必须修改：生成强随机密钥
SESSION_SECRET=生成的强随机密钥
```

生成密钥命令：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 学工号格式验证

如果北信的学工号格式不是10位数字，请修改：

**文件**: `lib/services/sso/bistu-cas-service.ts`
**行数**: 约第267行

```typescript
// TODO: 请根据实际的学工号格式调整此正则表达式
const pattern = /^\d{10}$/;  // 修改为实际格式
```

**文件**: `lib/services/user/sso-user-service.ts`
**行数**: 约第315行

```typescript
// TODO: 请根据实际的学工号格式调整此正则表达式
const pattern = /^\d{10}$/;  // 修改为实际格式
```

### 3. 允许的重定向URL列表

**文件**: `app/api/sso/bistu/login/route.ts`
**行数**: 约第18行

```typescript
// 🔧 根据需要添加允许的重定向路径
const allowedReturnUrls = [
  '/chat',
  '/dashboard', 
  '/settings',
  '/apps',
  '/', // 首页
  // 添加您需要的其他路径
];
```

### 4. 会话Cookie配置

如果需要更安全的会话管理，请修改：

**文件**: `app/api/sso/bistu/callback/route.ts`
**行数**: 约第124行

```typescript
// TODO: 在生产环境中应该加密这个cookie
response.cookies.set('sso_session', JSON.stringify(sessionData), {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24, // 24小时
  path: '/',
});
```

## 🧪 测试步骤

### 开发环境测试

1. **启动开发服务器**
   ```bash
   pnpm run dev
   ```

2. **访问登录页面**
   - 打开 `http://localhost:3000/login`
   - 确认能看到北信SSO登录按钮

3. **测试SSO重定向**
   - 点击"使用北信统一认证登录"按钮
   - 应该重定向到 `https://sso.bistu.edu.cn/login`

4. **测试回调处理**
   - 在CAS服务器完成登录后
   - 应该重定向回应用并创建用户

### 生产环境测试

1. **部署前检查**
   - 确认 `NEXT_PUBLIC_APP_URL` 配置正确
   - 确认HTTPS证书配置
   - 确认数据库迁移已应用

2. **功能测试**
   - 测试首次登录（应创建新用户）
   - 测试再次登录（应识别现有用户）
   - 测试注销功能

## 🔍 调试信息

### 查看日志

SSO过程中的关键日志：

```bash
# 登录入口
SSO login initiated, return URL: /chat
Redirecting to CAS login: https://sso.bistu.edu.cn/login?service=***

# 回调处理
SSO callback received - ticket: present, returnUrl: /chat
Validating ticket with service URL: https://your-app.com/api/sso/bistu/callback
Ticket validation successful for employee: 2021011221
SSO login successful - User: username, Employee: 2021011221
```

### 常见错误及解决方案

1. **"NEXT_PUBLIC_APP_URL environment variable is required"**
   - 检查环境变量是否正确配置

2. **"Ticket validation failed"**
   - 检查service URL是否与登录时一致
   - 检查网络连接到CAS服务器

3. **"User creation failed"**
   - 检查数据库连接
   - 检查迁移是否正确应用

## 📝 自定义指南

### 修改登录按钮样式

编辑 `components/auth/bistu-sso-button.tsx`：

```typescript
// 修改按钮颜色
"bg-blue-600 hover:bg-blue-700 text-white",

// 修改按钮文本
children || '使用北信统一认证登录'
```

### 添加额外的用户信息

如果CAS返回更多用户属性，修改：

**文件**: `lib/services/sso/bistu-cas-service.ts`
**函数**: `parseValidationResponse`

```typescript
// 添加更多属性解析
const userInfo = {
  username,
  employeeNumber,
  realName: attributes['cas:realName'], // 添加真实姓名
  department: attributes['cas:department'], // 添加部门
  // ... 其他属性
}
```

### 集成现有认证系统

如果需要与Supabase Auth集成，可以：

1. 在用户创建时同时创建 `auth.users` 记录
2. 使用 `supabase.auth.signInWithSSO()` 方法
3. 维护SSO用户与Supabase用户的映射关系

## 🚀 部署建议

### 生产环境配置

1. **使用HTTPS**
   - 配置SSL证书
   - 确保所有CAS通信使用HTTPS

2. **会话安全**
   - 使用强随机的 `SESSION_SECRET`
   - 考虑使用Redis存储会话

3. **监控和日志**
   - 监控SSO登录成功率
   - 记录安全相关事件

4. **备份和恢复**
   - 定期备份用户数据
   - 准备故障恢复方案

## 📞 技术支持

如果遇到问题：

1. 检查环境变量配置
2. 查看服务器日志
3. 验证网络连接
4. 参考技术方案文档进行排查

## 🎯 下一步优化

1. **安全增强**
   - 实现JWT会话管理
   - 添加CSRF保护
   - 集成审计日志

2. **用户体验**
   - 添加加载动画
   - 优化错误提示
   - 支持记住登录状态

3. **管理功能**
   - SSO用户管理界面
   - 统计和分析面板
   - 批量用户操作 