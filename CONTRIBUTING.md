# if-agent-ui 开发贡献指南

这篇文档将指导你如何设置if-agent-ui的开发环境，包括依赖安装和运行应用程序的步骤。

## 前置要求

开始前，请确保你的系统上已安装：

- Node.js 18+
- npm 9+
- Git

## 环境设置步骤

### 1. 克隆代码库

```bash
# 克隆代码库
git clone [https://github.com/lyzno1/if-agent-ui.git](https://github.com/lyzno1/if-agent-ui.git)
cd if-agent-ui

# 安装依赖
npm install
```

### 2\. 设置环境变量

创建 `.env.local` 文件（该文件不会被Git跟踪）：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件。你需要填入认证和 API 所需的环境变量。参考 `.env.example` 获取所需变量列表，**特别是 Supabase 相关配置**。

```ini
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key # Supabase 匿名密钥
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # 服务角色密钥（仅服务器端使用）

# (可选) OAuth Provider 配置
# 这些在 Supabase 控制台中配置

# Dify配置
DIFY_API_KEY=your_dify_api_key
DIFY_API_URL=https://api.dify.ai

# 网站URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3\. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用程序。

## 代码贡献工作流

### 分支管理

1.  从`main`分支创建功能分支

```bash
git checkout main
git pull
git checkout -b feature/your-feature-name
```

2.  提交你的更改

```bash
git add .
git commit -m "feat(scope): 你的提交信息"
```

3.  推送到远程仓库

```bash
git push origin feature/your-feature-name
```

4.  创建合并请求(Pull Request)

### 提交消息规范

我们使用约定式提交(Conventional Commits)规范：

  - `feat:` 新功能
  - `fix:` 修复bug
  - `docs:` 文档更改
  - `style:` 代码风格调整（不影响功能）
  - `refactor:` 代码重构
  - `perf:` 性能优化
  - `test:` 添加测试
  - `chore:` 构建过程或工具变动

例如：

```
feat(auth): 添加Google Workspace SSO认证支持
```

## 常见问题解答

### Q: 如何在开发中添加新的SSO提供商？

A: 在 Supabase 控制台的认证设置中添加相应的 OAuth 提供商(如 Google, GitHub)，并配置所需的 Client ID 和 Client Secret。然后在应用中使用 Supabase Auth 的 API 进行认证。

## 资源链接

  - [Next.js文档](https://nextjs.org/docs)
  - [Supabase Auth 文档](https://supabase.com/docs/guides/auth)

```