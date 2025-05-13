---
trigger: always_on
description: 
globs: 
---
# Commenting Guidelines

This document outlines the rules for writing comments in this project's codebase. Consistent commenting improves code readability and maintainability.

## Language

-   **All comments MUST be written in Simplified Chinese (中文).** This ensures consistency and clarity for all team members.

## Format and Structure

-   **Clarity is Key:** Write comments that explain the *why* behind the code, not just *what* the code does (unless the 'what' is particularly complex or non-obvious).
-   **Keep it Concise:** Be brief and to the point. Avoid overly long or rambling comments.

## Adding or Modifying Comments

-   **Use Separators for Significant Changes:** When adding a new block of comments or making substantial modifications to existing ones, use triple hyphens (`---`) before and after the comment block to clearly delineate the change. This helps during code reviews to identify where comments have been added or altered significantly.

    Example of adding a new comment block:

    ```typescript
    // --- BEGIN COMMENT ---
    // 这里是一段重要的中文注释，解释了下面复杂逻辑的原因。
    // 它涵盖了边界情况 X 和 Y。
    // --- END COMMENT ---
    function complexCalculation(a, b) {
      // ... implementation ...
    }
    ```

    Example of modifying an existing comment:

    ```typescript
    // --- BEGIN MODIFIED COMMENT ---
    // 原注释已被更新，以反映新的需求 Z。
    // --- END MODIFIED COMMENT ---
    // ~~ 原来的旧注释 ~~
    ```

-   **Minor Fixes:** For simple typo corrections or very minor clarifications within an existing comment, the `---` separators are not strictly required, but use your judgment.

## Placement

-   Place comments on the line *before* the code they refer to, or sometimes at the end of a line for very short explanations.
-   Comment functions, complex logic blocks, and non-obvious parts of the code.

## Goal

The primary goal of these commenting guidelines is to make the codebase easier to understand and maintain for everyone involved. Use comments thoughtfully to enhance code clarity.

## 响应式Tailwind CSS类的注释规范

使用Tailwind CSS进行响应式开发时，应遵循以下注释规范：

### Tailwind类分组注释

对于复杂的Tailwind类名组合，应按功能分组并添加注释：

```tsx
<div 
  className={cn(
    // 基础样式
    "bg-white rounded-lg shadow-md",
    
    // 响应式布局
    "flex flex-col md:flex-row lg:items-center",
    
    // 响应式间距
    "p-4 md:p-6 lg:p-8",
    
    // 响应式尺寸
    "w-full max-w-sm md:max-w-md lg:max-w-lg",
    
    // 条件样式
    isActive && "border-blue-500 border-2",
    
    // 自定义类名
    className
  )}
>
  {/* 内容 */}
</div>
```

### 响应式断点注释

当使用复杂的响应式类组合时，添加断点注释说明不同屏幕尺寸下的行为：

```tsx
{/* --- 响应式导航栏 --- */}
{/* 移动端：垂直菜单，隐藏在汉堡菜单后 */}
{/* 平板及以上：水平排列，直接显示 */}
<nav className="
  flex flex-col md:flex-row 
  fixed md:relative 
  w-full md:w-auto
">
  {/* 导航链接 */}
</nav>
```

### 条件渲染注释

对于基于屏幕尺寸的条件渲染，添加清晰的注释说明：

```tsx
{/* --- 仅在移动端显示的组件 --- */}
{isMobileView && (
  <MobileNavigation />
)}

{/* --- 仅在桌面端显示的组件 --- */}
{!isMobileView && (
  <DesktopNavigation />
)}
```

### 复杂响应式逻辑注释

对于复杂的响应式布局逻辑，添加详细注释说明：

```tsx
{/* 
  --- 布局逻辑说明 ---
  小屏幕：单列垂直排列，图片在上，文字在下
  中等屏幕：双列水平排列，图片在左，文字在右
  大屏幕：保持双列，但增加间距和内边距
*/}
```

遵循这些注释规范将使响应式设计的意图更加清晰，提高代码可读性和可维护性。

