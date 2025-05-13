---
trigger: always_on
description: 
globs: 
---
# Tailwind CSS 响应式开发规范

本文档提供 LLM-EduHub 项目使用 Tailwind CSS 进行响应式开发的规范和最佳实践。

## 基本原则

1. **移动优先设计**：始终先设计移动端界面，再向上拓展到更大屏幕
2. **一致性**：保持响应式断点使用的一致性
3. **语义化**：使用有意义的类名组合，提高可读性
4. **组件化**：将复杂UI拆分为可重用的响应式组件

## Tailwind CSS 断点

项目使用以下标准 Tailwind CSS 断点：

```
默认 (base): < 640px  - 移动设备（竖屏）
sm: 640px  - 小型设备（如手机横屏）
md: 768px  - 中型设备（如平板）
lg: 1024px - 大型设备（如笔记本）
xl: 1280px - 特大型设备（如台式机）
2xl: 1536px - 超大型设备
```

## 响应式类命名模式

### 布局

```html
<!-- 响应式容器 -->
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <!-- 内容 -->
</div>

<!-- 响应式Flex布局 -->
<div className="flex flex-col md:flex-row">
  <!-- 列 -->
</div>

<!-- 响应式Grid布局 -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  <!-- 网格项 -->
</div>
```

### 尺寸与间距

```html
<!-- 响应式宽度 -->
<div className="w-full md:w-1/2 lg:w-1/3">
  <!-- 内容 -->
</div>

<!-- 响应式间距 -->
<div className="p-4 md:p-6 lg:p-8">
  <!-- 内容 -->
</div>

<!-- 响应式边距 -->
<div className="mt-4 md:mt-6 lg:mt-8">
  <!-- 内容 -->
</div>
```

### 排版

```html
<!-- 响应式文本大小 -->
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  标题
</h1>

<!-- 响应式文本对齐 -->
<p className="text-center md:text-left">
  段落内容
</p>
```

### 显示与隐藏

```html
<!-- 仅在移动端显示 -->
<div className="block md:hidden">
  <!-- 移动端内容 -->
</div>

<!-- 仅在桌面端显示 -->
<div className="hidden md:block">
  <!-- 桌面端内容 -->
</div>
```

## 常见响应式模式

### 1. 响应式导航

```tsx
// 响应式导航示例
<nav className="bg-white shadow">
  {/* 导航容器 */}
  <div className="container mx-auto px-4">
    <div className="flex justify-between h-16">
      {/* Logo */}
      <div className="flex-shrink-0 flex items-center">
        <span className="text-xl font-bold">Logo</span>
      </div>
      
      {/* 桌面导航链接 - 在移动端隐藏 */}
      <div className="hidden md:flex space-x-8 items-center">
        <a href="#" className="text-gray-900">首页</a>
        <a href="#" className="text-gray-900">关于</a>
        <a href="#" className="text-gray-900">功能</a>
        <a href="#" className="text-gray-900">联系我们</a>
      </div>
      
      {/* 移动端菜单按钮 - 在桌面端隐藏 */}
      <div className="md:hidden flex items-center">
        <button className="text-gray-500">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  {/* 移动端菜单 - 默认隐藏，通过状态控制显示 */}
  {isMobileMenuOpen && (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1">
        <a href="#" className="block px-3 py-2 text-gray-900">首页</a>
        <a href="#" className="block px-3 py-2 text-gray-900">关于</a>
        <a href="#" className="block px-3 py-2 text-gray-900">功能</a>
        <a href="#" className="block px-3 py-2 text-gray-900">联系我们</a>
      </div>
    </div>
  )}
</nav>
```

### 2. 响应式卡片网格

```tsx
// 响应式卡片网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
      <img 
        src={item.image} 
        alt={item.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold">{item.title}</h3>
        <p className="mt-2 text-gray-600">{item.description}</p>
      </div>
    </div>
  ))}
</div>
```

### 3. 响应式表单

```tsx
// 响应式表单
<form className="space-y-6 max-w-lg mx-auto">
  {/* 响应式输入字段布局 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700">名字</label>
      <input
        type="text"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">姓氏</label>
      <input
        type="text"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      />
    </div>
  </div>
  
  {/* 全宽度字段 */}
  <div>
    <label className="block text-sm font-medium text-gray-700">邮箱</label>
    <input
      type="email"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    />
  </div>
  
  {/* 响应式按钮组 */}
  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-end">
    <button
      type="button"
      className="py-2 px-4 border border-gray-300 rounded-md text-gray-700"
    >
      取消
    </button>
    <button
      type="submit"
      className="py-2 px-4 bg-blue-600 text-white rounded-md"
    >
      提交
    </button>
  </div>
</form>
```

## 自定义函数与工具

### 1. 类名合并工具

使用`cn`工具函数合并Tailwind类名：

```typescript
// app/(lib)/utils.ts
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// 合并类名并解决Tailwind类冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

使用示例：

```tsx
import { cn } from '@lib/utils';

function Button({ className, variant = 'primary', ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md",
        variant === 'primary' && "bg-blue-600 text-white",
        variant === 'secondary' && "bg-gray-200 text-gray-800",
        className
      )}
      {...props}
    />
  );
}
```

### 2. 响应式钩子

```typescript
// app/(lib)/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

使用示例：

```tsx
import { useMediaQuery } from '@lib/hooks/useMediaQuery';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

## 最佳实践

1. **避免硬编码断点值**：
   - 使用Tailwind的断点前缀（sm, md, lg, xl）
   - 不要在媒体查询中硬编码像素值

2. **有限使用自定义MediaQuery**：
   - 尽可能使用Tailwind类实现响应式设计
   - 只在需要JavaScript控制时使用媒体查询钩子

3. **测试所有断点**：
   - 在开发过程中测试所有关键断点
   - 使用浏览器开发工具的响应式设计模式

4. **保持一致的方向**：
   - 使用移动优先策略时，从小屏幕向大屏幕方向扩展
   - 避免混合使用不同方向的媒体查询

5. **避免过度使用响应式类**：
   - 组合使用基础类和少量响应式类
   - 提取重复的响应式模式为组件

通过遵循这些响应式开发规范，可以确保LLM-EduHub在各种设备上提供一致且优质的用户体验。
