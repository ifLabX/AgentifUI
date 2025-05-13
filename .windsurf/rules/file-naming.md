---
trigger: always_on
description: 
globs: 
---
# 文件命名规范

本文档规定了LLM-EduHub项目中各类文件的命名规范，确保项目代码组织一致性和可维护性。

## 基本原则

1. **简洁明确**：文件名应当简短明确，直观反映文件内容和用途
2. **一致性**：同类文件应保持命名风格一致
3. **避免特殊字符**：除了连字符（-）和点（.）外，避免使用特殊字符
4. **使用小写字母**：所有文件名应使用小写字母，包括React组件文件

## 文件类型命名规范

### React组件文件

- 使用**kebab-case**（连字符命名法）
- 单文件组件使用`.tsx`扩展名
- 例如：`button.tsx`, `user-profile.tsx`, `nav-bar.tsx`

### 响应式组件文件命名

对于专门处理响应式布局的组件，推荐以下命名模式：

- **带断点后缀的组件**：明确标明组件适用的屏幕尺寸
  - 例如：`nav-bar-mobile.tsx`, `nav-bar-desktop.tsx`

- **响应式变体组件**：描述组件的响应式变体
  - 例如：`card-vertical.tsx`, `card-horizontal.tsx`

- **通用响应式组件**：使用`responsive`前缀
  - 例如：`responsive-layout.tsx`, `responsive-container.tsx`

- **特例组件目录**：对于复杂的响应式组件，可以创建专门的目录
  ```
  components/navigation/
  ├── nav-bar.tsx         # 主入口组件
  ├── mobile-nav.tsx      # 移动端导航
  ├── desktop-nav.tsx     # 桌面端导航
  └── tablet-nav.tsx      # 平板端导航（如需要）
  ```

当组件需要基于屏幕尺寸有显著不同的实现时，建议拆分为多个文件而不是在单个文件中使用条件渲染，这样可以提高代码的可维护性。

### 工具和辅助函数文件

- 使用**kebab-case**（连字符命名法）
- 通常使用`.ts`扩展名
- 例如：`auth-utils.ts`, `format-date.ts`, `dify-config.ts`

### API路由文件

- 主要使用Next.js的`route.ts`标准命名
- NextAuth.js 核心路由位于 `app/api/auth/[...nextauth]/route.ts`
- 相关辅助文件可使用描述性名称，如`utils.ts`, `validation.ts`

### 静态资源文件

- 使用**kebab-case**（连字符命名法）
- 包含描述性前缀或类别
- 例如：`logo-dark.svg`, `icon-user.png`, `bg-pattern.jpg`

### 类型定义文件

- 主要类型定义文件使用`types.ts`
- 特定领域的类型文件可使用`{domain}-types.ts`格式
- 例如：`api-types.ts`, `auth-types.ts`

### 配置文件

- 使用明确的描述性名称
- 通常采用项目通用格式（如`.config.ts`后缀或使用连字符）
- 例如：`auth.config.ts` (如果将NextAuth配置抽离), `dify-config.ts`

### 测试文件

- 与被测试文件名对应，添加`.test.ts`或`.spec.ts`后缀
- 例如：`button.test.tsx`, `auth-utils.spec.ts`

## 目录命名

- 使用**kebab-case**（连字符命名法）进行多词目录命名
- 使用小写字母
- 例如：`user-settings/`, `api-utils/`, `auth-providers/`

## 特殊命名约定

### Next.js特定文件

- 严格遵循Next.js文件系统约定：
  - `page.tsx`：页面组件
  - `layout.tsx`：布局组件
  - `loading.tsx`：加载状态组件
  - `error.tsx`：错误状态组件
  - `route.ts`：API路由处理函数

### 动态路由和分组

- 动态路由段使用方括号：`[id]`, `[user-id]`
- 通配动态路由使用扩展语法：`[...slug]`
- 路由分组使用圆括号：`(auth)`, `(dashboard)`
- 注意：根目录下的components和lib不使用圆括号，只有app目录下的路由分组才使用

## 实例对照表

| 文件类型 | 命名风格 | 示例 |
|---|---|---|
| React组件 | kebab-case | `button.tsx`, `user-card.tsx` |
| 工具函数 | kebab-case | `format-date.ts`, `auth-utils.ts` |
| API路由 | Next.js约定/NextAuth | `app/api/dify/[...]/route.ts`, `app/api/auth/[...nextauth]/route.ts` |
| 静态资源 | kebab-case | `logo-dark.svg`, `icon-home.png` |
| 类型定义 | 描述性-types | `api-types.ts`, `user-types.ts` |
| 配置文件 | 描述性-config | `dify-config.ts`, `auth.config.ts` |
| 测试文件 | 源文件名+test/spec | `button.test.tsx`, `auth-utils.spec.ts` |

## 建议与提醒

1. 优先考虑文件名的描述性和清晰度，而非简短性
2. 同一目录下避免使用过于相似的名称
3. 文件名应反映其主要职责，避免过于笼统的名称
4. 随着项目发展，定期审查文件命名，确保一致性
