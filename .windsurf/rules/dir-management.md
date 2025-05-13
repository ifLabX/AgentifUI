---
trigger: always_on
description: 
globs: 
---
# Directory Structure Management

This document outlines the directory structure of the LLM-EduHub project and provides guidelines for maintaining and updating the directory organization.

## Project Overview

LLM-EduHub is a Next.js application using the App Router pattern. The directory structure follows Next.js 13+ conventions with some custom organization patterns for better code separation.

## Root Directory Structure

```
llm-eduhub/
  ├── .cursor/            # Cursor IDE configuration files
  │   └── rules/          # Project-specific rules and documentation
  ├── .next/              # Next.js build output
  ├── .vscode/            # VSCode configuration files
  ├── app/                # Application source code (App Router pattern)
  │   ├── api/            # API routes
  │   │   ├── auth/       # NextAuth.js core authentication routes ([...nextauth])
  │   │   └── dify/       # Dify API integration
  │   │       └── [appId]/[...slug]/ # Dynamic route handling
  │   ├── about/          # About page route
  │   ├── chat/           # Chat page route
  │   │   └── [conversationId]/ # Specific conversation route
  │   ├── login/          # Login page route
  │   ├── register/       # Register page route
  │   └── page.tsx        # Home page route
  ├── components/         # Component directory
  │   ├── ui/             # Generic UI components
  │   ├── auth/           # Authentication related components (e.g., Login Button)
  │   ├── chat/           # Chat related components
  │   │   └── messages/   # Message components
  │   ├── chat-input/     # Chat input components
  │   │   ├── index.tsx   # Main chat input component
  │   │   └── button.tsx  # Chat button component
  │   ├── home/           # Home page related components
  │   ├── mobile/         # Mobile-specific components
  │   │   └── mobile-nav-button.tsx # Mobile navigation button
  │   └── sidebar/        # Sidebar components
  │       ├── index.tsx   # Main sidebar component
  │       ├── sidebar-container.tsx # Sidebar container
  │       ├── sidebar-header.tsx # Sidebar header
  │       ├── sidebar-content.tsx # Sidebar content
  │       ├── sidebar-footer.tsx # Sidebar footer
  │       ├── sidebar-button.tsx # Sidebar button
  │       ├── sidebar-chat-list.tsx # Chat list
  │       ├── sidebar-app-list.tsx # App list
  │       ├── sidebar-backdrop.tsx # Mobile background mask
  │       └── sidebar-chat-icon.tsx # Chat icon
  ├── lib/                # Utilities, hooks, and configuration
  │   ├── config/         # Configuration files (e.g., dify-config.ts)
  │   ├── hooks/          # Custom React hooks
  │   │   ├── use-chat-interface.ts  # Chat interface logic
  │   │   ├── use-chat-width.ts      # Unified width management
  │   │   ├── use-chat-scroll.ts     # Chat scrolling management
  │   │   ├── use-chat-bottom-spacing.ts # Bottom spacing management
  │   │   ├── use-chat-state-sync.ts # State synchronization
  │   │   ├── use-input-focus.ts     # Input focus management
  │   │   ├── use-input-height-reset.ts # Input height reset
  │   │   ├── use-mobile.ts          # Mobile device detection
  │   │   ├── use-prompt-template-interaction.ts # Prompt template interaction
  │   │   ├── use-theme.ts           # Theme management
  │   │   └── use-welcome-screen.ts  # Welcome screen management
  │   ├── services/       # Service integrations
  │   │   └── dify/       # Dify service integration
  │   ├── stores/         # State management
  │   │   ├── chat-store.ts          # Chat state
  │   │   ├── chat-input-store.ts    # Chat input state
  │   │   ├── chat-scroll-store.ts   # Chat scroll state
  │   │   ├── chat-layout-store.ts   # Chat layout state
  │   │   ├── sidebar-store.ts       # Sidebar state
  │   │   ├── theme-store.ts         # Theme state
  │   │   └── ui/                    # UI-related state
  │   │       ├── dropdown-store.ts      # Dropdown state
  │   │       ├── prompt-panel-store.ts  # Prompt panel state
  │   │       ├── prompt-template-store.ts # Prompt template state
  │   │       └── tooltip-store.ts       # Tooltip state
  │   └── utils/          # Utility functions
  ├── public/             # Static assets
  ├── scripts/            # Utility scripts for development, deployment, etc.
  │   ├── test_dify_proxy_advanced.py # Advanced Dify proxy test script
  │   └── test_dify_proxy_streaming.py # Dify streaming proxy test script
  ├── styles/             # Global styles
  ├── templates/          # Template files
  ├── .env.local          # Local environment variables (expects NEXTAUTH_SECRET etc.)
  ├── .gitignore          # Git ignore configuration
  ├── CONTRIBUTING.md     # Contribution guidelines (updated for NextAuth.js)
  ├── eslint.config.mjs   # ESLint configuration
  ├── middleware.ts       # Next.js middleware (pending NextAuth.js integration)
  ├── next-env.d.ts       # Next.js TypeScript declarations
  ├── next.config.ts      # Next.js configuration
  ├── package-lock.json   # Dependency lock file
  ├── package.json        # Project dependencies and scripts
  ├── postcss.config.mjs  # PostCSS configuration
  ├── README.md           # Project documentation
  ├── tailwind.config.js  # Tailwind configuration
  └── tsconfig.json       # TypeScript configuration
```

## App Directory Structure

The `app/` directory follows Next.js App Router conventions with organizational grouping:

```
app/
  ├── api/
  │   ├── auth/          # NextAuth.js core authentication routes
  │   │   └── [...nextauth]/ # Handles sign in, sign out, session, callbacks etc.
  │   │       └── route.ts   # NextAuth.js handler
  │   ├── dify/          # Dify API integration
  │   │   └── [appId]/[...slug]/ # Dynamic route handling
  │   └── ...            # Other business API routes
  ├── about/
  │   └── page.tsx       # Route for /about
  ├── chat/
  │   ├── page.tsx       # Route for /chat
  │   └── [conversationId]/ # Dynamic route for specific conversations
  │       └── page.tsx   # Route for /chat/[conversationId]
  ├── login/
  │   └── page.tsx       # Route for /login
  ├── register/
  │   └── page.tsx       # Route for /register
  └── page.tsx           # Route for / (home)
```

## Components Directory Structure

```
components/
  ├── ui/               # Generic UI components (e.g., Button.tsx)
  ├── auth/             # Authentication related components
  ├── chat/             # Chat related components
  │   ├── chat-loader.tsx       # Message list renderer
  │   ├── chat-input-backdrop.tsx # Input background layer
  │   ├── welcome-screen.tsx    # Welcome screen component
  │   └── messages/            # Message components
  ├── chat-input/       # Chat input components
  │   ├── index.tsx     # Main chat input component
  │   └── button.tsx    # Chat button component
  ├── home/             # Home page related components
  ├── mobile/           # Mobile-specific components
  │   └── mobile-nav-button.tsx # Mobile navigation button
  └── sidebar/          # Sidebar components
      ├── index.tsx             # Main sidebar component
      ├── sidebar-container.tsx # Sidebar container
      ├── sidebar-header.tsx    # Sidebar header
      ├── sidebar-content.tsx   # Sidebar content
      ├── sidebar-footer.tsx    # Sidebar footer
      ├── sidebar-button.tsx    # Sidebar button
      ├── sidebar-chat-list.tsx # Chat list
      ├── sidebar-app-list.tsx  # App list
      ├── sidebar-backdrop.tsx  # Mobile background mask
      └── sidebar-chat-icon.tsx # Chat icon
```

## Lib Directory Structure

```
lib/
  ├── config/           # Configuration files
  ├── hooks/            # Custom React hooks
  │   ├── use-chat-interface.ts       # Chat interface logic
  │   ├── use-chat-width.ts           # Unified width management
  │   ├── use-chat-scroll.ts          # Chat scrolling management
  │   ├── use-chat-bottom-spacing.ts  # Bottom spacing management
  │   ├── use-chat-state-sync.ts      # State synchronization
  │   ├── use-input-focus.ts          # Input focus management
  │   ├── use-input-height-reset.ts   # Input height reset
  │   ├── use-mobile.ts               # Mobile device detection
  │   ├── use-prompt-template-interaction.ts # Prompt template interaction
  │   ├── use-theme.ts                # Theme management
  │   └── use-welcome-screen.ts       # Welcome screen management
  ├── services/         # Service integrations
  │   └── dify/         # Dify service integration
  ├── stores/           # State management
  │   ├── chat-store.ts          # Chat state
  │   ├── chat-input-store.ts    # Chat input state
  │   ├── chat-scroll-store.ts   # Chat scroll state
  │   ├── chat-layout-store.ts   # Chat layout state
  │   ├── sidebar-store.ts       # Sidebar state
  │   ├── theme-store.ts         # Theme state
  │   └── ui/                    # UI-related state
  │       ├── dropdown-store.ts      # Dropdown state
  │       ├── prompt-panel-store.ts  # Prompt panel state
  │       ├── prompt-template-store.ts # Prompt template state
  │       └── tooltip-store.ts       # Tooltip state
  └── utils/            # Utility functions
```

## Naming Conventions

1. **Directories**:
   - Use kebab-case for multi-word directory names (e.g., `user-settings/`)
   - Wrap grouping directories in parentheses within app route folders (e.g., `(auth)`, `(dashboard)`) 
   - Route directories should match the URL path (e.g., `login/`)
   - Use square brackets for dynamic route segments (e.g., `[appId]/`)
   - Use spread syntax for catch-all routes (e.g., `[...slug]/`)

2. **Files**:
   - Route entry points MUST be named `page.tsx`.
   - Use kebab-case for React components (e.g., `button.tsx`, `login-form.tsx`).
   - Use camelCase for utility files (e.g., `difyConfig.ts`, `authUtils.ts`).
   - Use kebab-case for static assets (e.g., `logo-dark.png`).
   - Always include appropriate file extensions.

## Directory Management Guidelines

When modifying the project structure, please follow these guidelines:

1. **Adding New Directories**:
   - Components go under `components/`, organized by feature/type (e.g., `components/auth/`).
   - Utilities go under `lib/`, organized by type (e.g., `lib/utils/`).
   - New page routes are created directly under `app/` (e.g., `app/settings/page.tsx` for `/settings`).

2. **Adding New Files**:
   - Follow the established naming conventions.
   - Place files in the appropriate directory based on their purpose.
   - Components related to a specific feature should reside in a dedicated subdirectory within `components/`.

3. **Updating This Document**:
   - When adding, removing, or reorganizing directories or routes, update this document.
   - Include a brief explanation of the purpose of new directories/routes.
   - Keep the directory tree representations up-to-date.

4. **Special Considerations**:
   - Grouped directories (with parentheses) in app routes do not affect the URL path.
   - `middleware.ts` controls access to routes (public vs. protected). Ensure public routes are correctly listed.
   - API routes should be organized by service or functionality domain within `app/api/`.

## Path Aliases

The project uses TypeScript path aliases defined in `tsconfig.json` for cleaner imports:

- `@/` - Points to the root directory
- `@lib/*` - Points to the `lib/*` directory
- `@components/*` - Points to the `components/*` directory

Always use path aliases instead of relative imports when crossing major directory boundaries (e.g., importing from `lib` into `components`).

## Update Process

When making structural changes to the project:

1. Plan your directory/route changes.
2. Implement the changes following the conventions above.
3. Update `middleware.ts` if route accessibility changes (public/protected).
4. Update this document (`dir-management.mdc`) to reflect the new structure.
5. Commit the updated document along with your code changes using the standard commit format.

By maintaining this document, we ensure that all team members understand the project structure and can contribute effectively.

## Directory Naming

1. **Special Directories**:
   - `components/`: Contains all React components, organized by feature/type.
   - `lib/`: Contains utility functions, configuration, hooks, etc.
   - `app/api/`: Contains backend API routes. Part of the route (`/api/...`).
   - `public/`: Contains static assets served directly.

## Import Path

1. **Path Aliases**:
   - Project uses the following path aliases for cleaner imports:
   ```json
   {
     "paths": {
       "@/*": ["./*"],
       "@lib/*": ["./lib/*"],
       "@components/*": ["./components/*"]
     }
   }
   ```

2. **Import Rules**:
   - Use path aliases instead of relative paths for cross-directory imports.
   - Component imports use `@components/` (e.g., `@components/ui/button`, `@components/auth/login-form`).
   - Utility imports use `@lib/` (e.g., `@lib/utils`).
   - Importing files within the same top-level directory (e.g., two components within `components/auth/`) can use relative paths if preferred, but aliases are generally recommended for clarity.

   Example:
   ```typescript
   // ✅ Correct import method
   import { Button } from '@components/ui/button';
   import { cn } from '@lib/utils';
   import { Home } from '@components/home/home';
   import { LoginForm } from '@components/auth/login-form';

   // ❌ Avoid using deep relative paths like this
   // import Button from '../../../../components/ui/button';
   ```

3. **Import Order**:
   - Third-party library imports (e.g., `react`, `next`, `framer-motion`)
   - Path aliases imports (`@components/`, `@lib/`)
   - Relative imports (if necessary)
   - Style imports (if applicable)

## API Directory Structure

```
app/
  ├── api/
  │   ├── auth/          # Authentication-related API routes
  │   │   ├── identify/  # User identification API
  │   │   │   └── route.ts # Route handler
  │   │   └── sso/       # Single sign-on API
  │   │       └── initiate/ # SSO initiation
  │   │           └── route.ts # Route handler
  │   ├── dify/          # Dify API integration
  │   │   └── [appId]/[...slug]/ # Dynamic route handling
  │   │       └── route.ts # Route handler
  │   └── ...
  └── ...
```

## Best Practices

1. **Component Organization**:
   - Generic, reusable UI components go in `components/ui/`.
   - Components specific to a feature/page go in dedicated subdirectories (e.g., `components/auth/`, `components/chat/`).
   - Page components (like `Home.tsx`) reside in feature-specific directories (e.g., `components/home/`).

2. **Import Practices**:
   - Prefer path aliases over relative paths for clarity and easier refactoring.
   - Keep import paths consistent.

3. **File Location**:
   - Component-related type definitions can reside within the component file or a nearby `types.ts` file if complex.
   - Shared type definitions go in `lib/types/`.
   - Utility functions go in `lib/utils/`.

4. **Directory Grouping**:
   - Use parentheses `()` to group related code without affecting the URL structure in app directory (e.g., `(auth)`, `(dashboard)`).

5. **响应式开发规范**:
   - 所有组件必须使用Tailwind CSS进行响应式设计
   - 遵循移动优先(Mobile-First)的开发方法
   - 组织结构应支持不同屏幕尺寸下的组件复用

## 响应式开发指南

为确保项目在各种设备上具有良好的用户体验，所有前端组件必须遵循以下响应式开发规范：

### 统一宽度管理

所有聊天相关组件应使用 `useChatWidth` Hook 来保持一致的宽度：

```typescript
// 使用示例
const { widthClass, paddingClass } = useChatWidth()

return (
  <div className={cn(
    "w-full mx-auto",
    widthClass,
    paddingClass
  )}>
    {/* 组件内容 */}
  </div>
)
```

### Tailwind CSS断点使用

```
sm: 640px   - 小型设备（如手机横屏）
md: 768px   - 中型设备（如平板）
lg: 1024px  - 大型设备（如笔记本）
xl: 1280px  - 特大型设备（如台式机）
2xl: 1536px - 超大型设备
```

### 响应式开发原则

1. **移动优先设计**:
   - 始终先为移动设备设计界面
   - 使用媒体查询扩展到更大屏幕
   - 示例: `className="text-sm md:text-base lg:text-lg"`

2. **弹性布局**:
   - 使用Flexbox和Grid进行页面布局
   - 适当使用`flex-col`和`flex-row`在不同屏幕尺寸间切换
   - 示例: `className="flex flex-col md:flex-row"`

3. **响应式间距和尺寸**:
   - 使用响应式间距和尺寸类
   - 示例: `className="p-4 md:p-6 lg:p-8"`

4. **内容适应**:
   - 长文本在小屏幕上应适当截断或重排
   - 图片应适当缩放并保持比例
   - 示例: `className="w-full max-w-md lg:max-w-lg"`

5. **组件组织**:
   - 复杂组件应拆分为子组件，便于在不同屏幕尺寸下重组
   - 使用条件渲染为不同屏幕尺寸提供不同UI方案

### 聊天组件响应式示例

```tsx
// components/chat/chat-loader.tsx
export const ChatLoader = ({ messages }: ChatLoaderProps) => {
  const { widthClass, paddingClass } = useChatWidth()
  
  return (
    <div className={cn(
      "w-full mx-auto",
      widthClass,
      paddingClass,
      "overflow-y-auto pb-32"
    )}>
      {/* 消息列表 */}
    </div>
  )
}
```

遵循这些响应式开发规范可确保应用在各种设备上都有一致且良好的用户体验。

Following these guidelines ensures code consistency and maintainability. Please refer to this document when adding new files or modifying directory structure.


