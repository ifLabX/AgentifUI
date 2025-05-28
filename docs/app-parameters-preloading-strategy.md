# 应用参数预加载策略使用文档

## 概述

AgentifUI 实现了智能的应用参数预加载策略，旨在提升用户体验，减少页面跳转和应用切换时的等待时间。本文档详细说明了预加载策略的工作原理、配置方法和使用指南。

## 核心特性

### 1. 分层预加载策略
- **关键应用**：当前应用 + 常用模型 + 模型类型应用，立即并行加载
- **其他应用**：应用市场应用等，延迟1秒后台加载
- **智能分类**：基于应用元数据配置和名称启发式分析

### 2. 智能激活条件
- **登录状态检查**：只有登录用户才触发预加载
- **页面检查**：只在 `/chat` 和 `/app` 页面激活预加载
- **非阻塞加载**：使用 `setTimeout(0)` 确保不阻塞页面跳转

### 3. 缓存机制
- **5分钟缓存**：应用参数缓存5分钟，避免重复请求
- **批量缓存**：统一管理所有应用的参数缓存
- **智能失效**：过期缓存自动清理

## 配置指南

### 应用元数据配置

在管理界面（`/admin/api-config`）为每个应用配置元数据：

#### 4个模型类型应用配置示例
```typescript
// GPT-4 模型
{
  app_type: "model",
  model_type: "gpt-4",
  is_common_model: true,  // 标记为常用模型
  is_marketplace_app: false,
  tags: ["对话", "通用", "智能"],
  icon_url: "https://example.com/gpt4-icon.png",
  brief_description: "GPT-4 通用对话模型"
}

// Claude 模型
{
  app_type: "model", 
  model_type: "claude",
  is_common_model: true,  // 标记为常用模型
  is_marketplace_app: false,
  tags: ["对话", "分析", "写作"],
  icon_url: "https://example.com/claude-icon.png",
  brief_description: "Claude 智能对话助手"
}

// Gemini 模型
{
  app_type: "model",
  model_type: "gemini", 
  is_common_model: false, // 非常用模型，但仍是关键应用
  is_marketplace_app: false,
  tags: ["对话", "多模态"],
  icon_url: "https://example.com/gemini-icon.png",
  brief_description: "Gemini 多模态模型"
}

// 本地模型
{
  app_type: "model",
  model_type: "local-llm",
  is_common_model: false,
  is_marketplace_app: false, 
  tags: ["本地", "私有"],
  icon_url: "https://example.com/local-icon.png",
  brief_description: "本地部署模型"
}
```

#### 10个应用市场应用配置示例
```typescript
// 翻译助手
{
  app_type: "marketplace",
  model_type: "",
  is_common_model: false,
  is_marketplace_app: true,
  tags: ["翻译", "工具"],
  icon_url: "https://example.com/translate-icon.png", 
  brief_description: "多语言翻译助手"
}

// 代码生成器
{
  app_type: "marketplace",
  model_type: "",
  is_common_model: false,
  is_marketplace_app: true,
  tags: ["代码", "开发", "生成"],
  icon_url: "https://example.com/code-icon.png",
  brief_description: "智能代码生成工具"
}

// 文档写作助手
{
  app_type: "marketplace", 
  model_type: "",
  is_common_model: false,
  is_marketplace_app: true,
  tags: ["写作", "文档", "助手"],
  icon_url: "https://example.com/doc-icon.png",
  brief_description: "专业文档写作助手"
}

// ... 其他7个应用市场应用类似配置
```

### 加载策略详解

基于上述配置，预加载策略的工作流程：

#### 第一层：关键应用（立即加载）
1. **当前应用**：用户正在使用的应用，最高优先级
2. **常用模型**：`is_common_model: true` 的应用（如 GPT-4、Claude）
3. **模型类型应用**：`app_type: "model"` 的应用（包括 Gemini、本地模型）

```typescript
// 关键应用示例（立即并行加载）
criticalApps = [
  "current-app-id",     // 当前应用
  "gpt-4-app-id",       // 常用模型
  "claude-app-id",      // 常用模型  
  "gemini-app-id",      // 模型类型
  "local-llm-app-id"    // 模型类型
]
```

#### 第二层：其他应用（延迟1秒加载）
1. **应用市场应用**：`app_type: "marketplace"` 或 `is_marketplace_app: true`
2. **其他未分类应用**

```typescript
// 其他应用示例（延迟后台加载）
otherApps = [
  "translate-app-id",   // 应用市场应用
  "code-gen-app-id",    // 应用市场应用
  "doc-writer-app-id",  // 应用市场应用
  // ... 其他7个应用市场应用
]
```

### 无配置时的智能分类

如果应用没有配置元数据，系统会根据应用名称进行启发式分类：

```typescript
// 模型关键词
const modelKeywords = ['gpt', 'claude', 'gemini', 'llama', 'qwen', '通义', '模型', 'model', 'chat', '对话'];

// 应用市场关键词  
const marketplaceKeywords = ['翻译', 'translate', '代码', 'code', '助手', 'assistant', '工具', 'tool', '生成', 'generate'];

// 分类逻辑
if (isLikelyModel && !isLikelyMarketplace) {
  // 归为关键应用
} else if (isLikelyMarketplace) {
  // 归为其他应用
} else {
  // 默认归为关键应用（保守策略）
}
```

## 使用指南

### 1. 自动预加载（推荐）

预加载器已集成到 `ClientLayout` 中，会自动工作：

```typescript
// app/layouts/client-layout.tsx
export default function ClientLayout({ children }: ClientLayoutProps) {
  // 🎯 自动预加载：检测登录状态和页面类型
  useAppParametersPreloader();
  
  return (
    <div className={fontClasses}>
      {children}
    </div>
  );
}
```

### 2. 手动控制预加载

在特定组件中手动控制预加载：

```typescript
import { useAppParametersPreloader } from '@lib/hooks/use-app-parameters-preloader';

function MyComponent() {
  const {
    // 状态
    isPreloading,           // 是否正在预加载
    preloadError,           // 预加载错误
    isActive,               // 预加载是否激活
    isCriticalAppsLoaded,   // 关键应用是否加载完成
    
    // 进度信息
    progress: {
      loaded,               // 已加载应用数
      total,                // 总应用数
      percentage,           // 加载百分比
      criticalLoaded,       // 已加载关键应用数
      criticalTotal,        // 总关键应用数
      criticalCompleted     // 关键应用是否全部完成
    },
    
    // 操作方法
    triggerPreload,         // 手动触发预加载
    shouldPreload,          // 是否应该预加载
    
    // 查询方法
    isAppParametersCached,  // 检查应用参数是否已缓存
    getCachedAppParameters, // 获取缓存的应用参数
  } = useAppParametersPreloader();

  // 手动触发预加载
  const handlePreload = () => {
    if (shouldPreload) {
      triggerPreload();
    }
  };

  return (
    <div>
      {isPreloading && <div>预加载中... {percentage}%</div>}
      {isCriticalAppsLoaded && <div>关键应用加载完成</div>}
      <button onClick={handlePreload}>手动预加载</button>
    </div>
  );
}
```

### 3. 应用参数获取

在组件中获取应用参数：

```typescript
import { useAppParameters } from '@lib/hooks/use-app-parameters';
import { useCurrentApp } from '@lib/hooks/use-current-app';

function WelcomeScreen() {
  const { currentAppId } = useCurrentApp();
  const { 
    parameters,      // 应用参数
    isLoading,       // 是否加载中
    error,           // 错误信息
    refetch          // 重新获取
  } = useAppParameters(currentAppId);

  // 🎯 关键：确保等待当前app参数加载完成
  if (currentAppId && isLoading) {
    return <div>加载中...</div>;
  }

  // 🎯 关键：检查是否有参数但还未加载
  if (currentAppId && !parameters && !error) {
    return <div>等待参数加载...</div>;
  }

  return (
    <div>
      {parameters?.opening_statement || '默认欢迎文字'}
    </div>
  );
}
```

## 后续路由集成指南

### `/app/[name]` 路由集成

当实现 `/app/[name]` 路由时，按以下步骤集成预加载策略：

#### 1. 页面组件实现

```typescript
// app/app/[name]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useAppParameters } from '@lib/hooks/use-app-parameters';
import { useEffect } from 'react';

export default function AppPage() {
  const params = useParams();
  const appName = params.name as string;
  
  const { 
    currentAppId, 
    switchToApp,
    validateAndRefreshConfig 
  } = useCurrentApp();
  
  const { 
    parameters, 
    isLoading, 
    error 
  } = useAppParameters(currentAppId);

  // 🎯 关键：应用切换逻辑
  useEffect(() => {
    if (appName && appName !== currentAppId) {
      // 切换到指定应用
      switchToApp(appName);
      
      // 验证应用配置
      validateAndRefreshConfig();
    }
  }, [appName, currentAppId, switchToApp, validateAndRefreshConfig]);

  // 🎯 等待应用切换和参数加载
  if (isLoading || (appName !== currentAppId)) {
    return <div>切换应用中...</div>;
  }

  if (error) {
    return <div>加载失败: {error}</div>;
  }

  return (
    <div>
      <h1>{parameters?.name || appName}</h1>
      <p>{parameters?.opening_statement}</p>
      {/* 应用界面 */}
    </div>
  );
}
```

#### 2. 预加载策略更新

更新预加载器以支持 `/app` 路由：

```typescript
// lib/hooks/use-app-parameters-preloader.ts
const isAppRelatedPage = useCallback(() => {
  if (!pathname) return false;
  
  const appPages = ['/chat', '/app']; // 已包含 /app 路由
  return appPages.some(page => pathname.startsWith(page));
}, [pathname]);
```

#### 3. 应用切换优化

```typescript
// lib/stores/current-app-store.ts
const switchToApp = useCallback(async (appId: string) => {
  try {
    setIsValidating(true);
    
    // 🎯 利用预加载缓存快速切换
    const cachedParameters = getCachedAppParameters(appId);
    if (cachedParameters) {
      console.log('[CurrentApp] 使用预加载缓存快速切换应用:', appId);
      setCurrentAppId(appId);
      return;
    }
    
    // 如果没有缓存，正常切换流程
    setCurrentAppId(appId);
    await validateAndRefreshConfig();
    
  } catch (error) {
    console.error('[CurrentApp] 切换应用失败:', error);
  } finally {
    setIsValidating(false);
  }
}, [setCurrentAppId, validateAndRefreshConfig, getCachedAppParameters]);
```

### 是否需要调用 Hooks？

**答案：基本不需要额外调用预加载 Hooks**

1. **自动预加载**：`ClientLayout` 中的 `useAppParametersPreloader()` 已经处理了所有预加载逻辑

2. **应用切换**：只需要调用 `useCurrentApp()` 的 `switchToApp()` 方法

3. **参数获取**：使用 `useAppParameters(currentAppId)` 即可，它会自动利用预加载缓存

#### 典型的页面组件模式

```typescript
function AppPage() {
  // ✅ 只需要这两个 hooks
  const { currentAppId, switchToApp } = useCurrentApp();
  const { parameters, isLoading, error } = useAppParameters(currentAppId);
  
  // ❌ 不需要手动调用预加载器
  // const preloader = useAppParametersPreloader();
  
  // 应用切换逻辑
  useEffect(() => {
    if (targetAppId !== currentAppId) {
      switchToApp(targetAppId);
    }
  }, [targetAppId, currentAppId, switchToApp]);

  // 渲染逻辑
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  return <AppContent parameters={parameters} />;
}
```

## 最佳实践

### 1. 配置建议

- **常用模型**：将用户最常用的2-3个对话模型标记为 `is_common_model: true`
- **应用分类**：明确区分模型类型和应用市场类型
- **标签使用**：使用有意义的标签便于搜索和分类

### 2. 性能优化

- **批量加载**：关键应用并行加载，最大化性能
- **延迟加载**：非关键应用延迟加载，避免阻塞
- **缓存利用**：充分利用5分钟缓存，减少重复请求

### 3. 用户体验

- **非阻塞**：页面跳转不等待预加载完成
- **渐进式**：关键应用优先，其他应用后台加载
- **容错性**：单个应用失败不影响整体体验

### 4. 监控和调试

```typescript
// 开发环境下监控预加载状态
if (process.env.NODE_ENV === 'development') {
  const { progress, isActive, isCriticalAppsLoaded } = useAppParametersPreloader();
  
  console.log('[Preloader Debug]', {
    isActive,
    isCriticalAppsLoaded,
    progress
  });
}
```

## 故障排除

### 常见问题

1. **应用参数加载失败**
   - 检查应用配置是否正确
   - 验证 API 密钥是否有效
   - 查看网络连接状态

2. **预加载不生效**
   - 确认用户已登录
   - 检查是否在支持的页面（`/chat`, `/app`）
   - 查看控制台日志

3. **应用切换缓慢**
   - 检查应用是否已预加载
   - 验证应用分类配置
   - 考虑将应用标记为常用模型

### 调试工具

```typescript
// 检查应用参数缓存状态
const { isAppParametersCached, getCachedAppParameters } = useAppParametersPreloader();

console.log('App cached:', isAppParametersCached('your-app-id'));
console.log('Cached parameters:', getCachedAppParameters('your-app-id'));
```

## 总结

AgentifUI 的应用参数预加载策略通过智能分层、缓存机制和非阻塞加载，显著提升了用户体验。正确配置应用元数据并遵循最佳实践，可以确保系统高效运行。

对于后续的 `/app/[name]` 路由集成，只需要使用现有的 `useCurrentApp()` 和 `useAppParameters()` hooks，预加载策略会自动工作，无需额外的手动干预。 