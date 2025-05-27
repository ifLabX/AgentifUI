# 重置密码功能指南

本文档介绍AgentifUI项目中重置密码功能的使用方法和技术实现。

## 🌟 功能概述

重置密码功能允许用户通过邮箱验证来重新设置账户密码，提供完整的密码找回流程。

### 主要特性

- ✅ 安全的邮箱验证机制
- ✅ 响应式设计，支持移动端
- ✅ 深色/浅色主题支持
- ✅ 完整的错误处理和用户反馈
- ✅ 密码强度验证
- ✅ 自动跳转和状态管理

## 🚀 用户使用流程

### 1. 访问忘记密码页面

从登录页面点击"忘记密码？"链接：
```
https://your-domain.com/login → 点击"忘记密码？" → https://your-domain.com/forgot-password
```

### 2. 输入邮箱地址

在忘记密码页面输入注册时使用的邮箱地址。

### 3. 检查邮箱

系统会发送包含重置链接的邮件到指定邮箱。邮件内容包括：
- 重置密码的专用链接
- 链接有效期（1小时）
- 安全提示信息

### 4. 点击重置链接

点击邮件中的重置链接，会自动跳转到重置密码页面：
```
https://your-domain.com/reset-password?access_token=...&refresh_token=...
```

### 5. 设置新密码

在重置密码页面：
- 输入新密码（至少6位）
- 确认新密码
- 点击"更新密码"按钮

### 6. 完成重置

重置成功后会自动跳转到登录页面，显示成功提示。

## 🛠️ 技术实现

### 页面结构

```
app/
├── forgot-password/
│   └── page.tsx                 # 忘记密码页面
├── reset-password/
│   └── page.tsx                 # 重置密码页面
└── login/
    └── page.tsx                 # 登录页面（含成功提示）

components/auth/
├── forgot-password-form.tsx     # 忘记密码表单
├── reset-password-form.tsx      # 重置密码表单
└── login-form.tsx               # 登录表单（含忘记密码链接）
```

### 核心API调用

#### 发送重置邮件
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

#### 验证并设置会话
```typescript
const { error: sessionError } = await supabase.auth.setSession({
  access_token,
  refresh_token: refresh_token || '',
});
```

#### 更新密码
```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

### 状态管理

重置密码表单包含以下状态：
- `isTokenValid`: token验证状态（null | true | false）
- `isLoading`: 加载状态
- `error`: 错误信息
- `isSuccess`: 成功状态
- `showPassword`: 密码可见性

### 错误处理

系统处理以下常见错误情况：
- 无效邮箱格式
- 邮件发送频率限制
- 重置链接过期
- 密码强度不够
- 会话过期

## 🧪 测试指南

### 使用测试脚本

项目提供了专门的测试脚本：

```bash
# 运行重置密码测试工具
node scripts/test_reset_password.js
```

测试脚本功能：
1. 检查Auth配置
2. 注册测试账户
3. 发送重置密码邮件
4. 完整测试流程

### 手动测试步骤

1. **准备测试环境**
   ```bash
   npm run dev
   ```

2. **创建测试账户**
   - 访问 `http://localhost:3000/register`
   - 使用真实邮箱注册（用于接收重置邮件）

3. **测试忘记密码流程**
   - 访问 `http://localhost:3000/login`
   - 点击"忘记密码？"
   - 输入注册邮箱
   - 查看邮箱是否收到重置邮件

4. **测试重置密码流程**
   - 点击邮件中的重置链接
   - 验证页面是否正确加载
   - 输入新密码
   - 验证是否重置成功

5. **验证新密码**
   - 返回登录页面
   - 使用新密码登录
   - 确认登录成功

## ⚙️ 配置说明

### Supabase配置

确保在Supabase控制台中正确配置：

1. **邮件模板**
   - 重置密码邮件模板
   - 重定向URL设置

2. **认证设置**
   ```
   Site URL: http://localhost:3000 (开发环境)
   Additional Redirect URLs: https://your-domain.com (生产环境)
   ```

3. **速率限制**
   ```
   Email sent per hour: 3 (建议值)
   Token verifications per hour: 30
   ```

### 环境变量

确保设置以下环境变量：
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🎨 UI/UX特性

### 响应式设计

- **移动端优化**: 触摸友好的按钮和输入框
- **断点适应**: 
  - `< 640px`: 移动设备布局
  - `≥ 768px`: 平板和桌面布局

### 视觉反馈

- **加载状态**: 按钮loading状态，骨架屏
- **错误提示**: 红色边框提示，详细错误信息
- **成功反馈**: 绿色图标，自动跳转倒计时
- **进度指示**: 多步骤流程的视觉引导

### 可访问性

- **语义化HTML**: 正确的标签和结构
- **键盘导航**: 支持Tab键导航
- **屏幕阅读器**: ARIA标签支持
- **对比度**: 符合WCAG标准的颜色对比

## 🔒 安全考虑

### 客户端安全

- 密码输入框默认隐藏，可切换显示
- 表单验证防止XSS攻击
- 敏感信息不存储在localStorage

### 服务端安全

- 重置token有时效性（1小时）
- 邮件发送频率限制
- 会话token验证

### 最佳实践

- 使用HTTPS传输（生产环境）
- 定期清理过期token
- 监控异常重置请求

## 🐛 常见问题

### Q: 收不到重置邮件怎么办？
A: 
1. 检查垃圾邮件文件夹
2. 确认邮箱地址正确
3. 等待几分钟后重试
4. 联系管理员检查邮件配置

### Q: 重置链接提示无效？
A: 
1. 检查链接是否完整
2. 确认链接未过期（1小时）
3. 重新申请重置密码

### Q: 新密码设置失败？
A:
1. 确认密码长度至少6位
2. 检查两次输入是否一致
3. 尝试使用更复杂的密码

## 📞 技术支持

如遇到技术问题，请：
1. 查看浏览器控制台错误信息
2. 运行测试脚本诊断问题
3. 检查Supabase控制台日志
4. 联系开发团队

---

*最后更新: 2024年12月* 