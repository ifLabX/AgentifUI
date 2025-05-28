# AgentifUI 字体配置指南

## 🎯 概述

AgentifUI 采用 Claude 风格的中英文字体组合，提供优雅的阅读体验和现代化的界面设计。

## 📝 字体组合

### 主要字体配置

| 用途 | 英文字体 | 中文字体 | Tailwind 类 | 说明 |
|------|----------|----------|-------------|------|
| 界面文字 | Inter | Noto Sans SC | `font-sans` | 现代简洁，适用于界面元素 |
| 阅读内容 | Crimson Pro | Noto Serif SC | `font-serif` | 优雅易读，适用于长文本 |
| 装饰标题 | Playfair Display | Noto Sans SC | `font-display` | 装饰性强，适用于重要标题 |

### 字体特点

- **Inter + Noto Sans SC**: 现代无衬线字体，清晰易读，适合界面元素
- **Crimson Pro + Noto Serif SC**: 优雅衬线字体，提供舒适的阅读体验
- **Playfair Display**: 装饰性衬线字体，适合标题和特殊场合

## 🚀 使用方法

### 基础用法

```tsx
// 默认界面字体 (Inter + Noto Sans SC)
<div className="font-sans">
  Interface Text 界面文字
</div>

// 阅读字体 (Crimson Pro + Noto Serif SC)
<div className="font-serif">
  Reading content 阅读内容长文本
</div>

// 装饰标题字体 (Playfair Display + Noto Sans SC)
<h1 className="font-display">
  Display Title 装饰标题
</h1>
```

### 响应式字体大小

```tsx
// 响应式标题
<h1 className="font-display text-2xl md:text-3xl lg:text-4xl">
  响应式标题
</h1>

// 响应式正文
<p className="font-serif text-base md:text-lg">
  响应式正文内容
</p>
```

### 字重变化

```tsx
// 不同字重的 Sans 字体
<p className="font-sans font-light">轻字重文字</p>
<p className="font-sans font-normal">正常字重文字</p>
<p className="font-sans font-medium">中等字重文字</p>
<p className="font-sans font-semibold">半粗字重文字</p>
<p className="font-sans font-bold">粗字重文字</p>

// 不同字重的 Serif 字体
<p className="font-serif font-normal">正常衬线字体</p>
<p className="font-serif font-medium">中等衬线字体</p>
<p className="font-serif font-bold">粗体衬线字体</p>
```

## 🔧 技术实现

### 1. Next.js 字体配置 (`app/layout.tsx`)

```tsx
import { Inter, Crimson_Pro, Playfair_Display, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

// ... 其他字体配置
```

### 2. Tailwind CSS 配置 (`tailwind.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)', 
          'var(--font-noto-sans)', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'system-ui', 
          'sans-serif'
        ],
        serif: [
          'var(--font-crimson)', 
          'var(--font-noto-serif)', 
          'Georgia', 
          'serif'
        ], 
        display: [
          'var(--font-playfair)', 
          'var(--font-noto-sans)', 
          'serif'
        ],
      },
    },
  },
}
```

### 3. 全局 CSS 强制应用 (`app/globals.css`)

```css
@layer base {
  * {
    font-family: var(--font-inter), var(--font-noto-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
  }
  
  .font-serif, 
  .prose,
  .markdown-content,
  article {
    font-family: var(--font-crimson), var(--font-noto-serif), Georgia, serif !important;
  }
  
  .font-display,
  h1.display,
  .title-display {
    font-family: var(--font-playfair), var(--font-noto-sans), serif !important;
  }
}
```

## 🧪 测试和验证

### 1. 访问字体测试页面

访问 `/font-test` 页面查看所有字体效果的完整展示。

### 2. 浏览器控制台检查

在浏览器控制台中运行以下脚本：

```javascript
// 复制 scripts/check-fonts.js 中的内容到控制台运行
```

### 3. 开发者工具检查

1. 打开浏览器开发者工具
2. 切换到 Network 标签页
3. 刷新页面
4. 筛选 "Font" 类型的请求
5. 确认以下字体文件已加载：
   - Inter
   - Noto Sans SC
   - Crimson Pro
   - Noto Serif SC
   - Playfair Display

## 📱 响应式考虑

### 移动端优化

- 字体在小屏幕上保持良好的可读性
- 使用 `font-display: swap` 确保快速渲染
- 中文字体优先级确保中文字符正确显示

### 性能优化

- 使用 Google Fonts 的 CDN 加速
- 字体预加载提高首屏渲染速度
- 仅加载必要的字重，减少文件大小

## 🎨 设计原则

### 层次结构

1. **标题**: 使用 `font-display` 创建视觉焦点
2. **正文**: 使用 `font-serif` 提供舒适阅读体验
3. **界面**: 使用 `font-sans` 保持现代简洁

### 中英文混排

- 英文使用专业的西文字体
- 中文使用对应风格的中文字体
- 字体回退确保兼容性

## 🔍 故障排除

### 字体未加载

1. 检查网络连接
2. 确认 Google Fonts 可访问
3. 清除浏览器缓存
4. 检查控制台错误信息

### 字体显示异常

1. 确认 CSS 变量正确定义
2. 检查 Tailwind 配置
3. 验证字体文件完整性
4. 使用浏览器开发者工具检查计算样式

### 性能问题

1. 检查字体文件大小
2. 优化字重选择
3. 考虑字体子集化
4. 使用字体预加载

## 📚 参考资源

- [Google Fonts](https://fonts.google.com/)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Tailwind CSS Typography](https://tailwindcss.com/docs/font-family)
- [Web Font Loading Best Practices](https://web.dev/font-best-practices/)

---

通过遵循这个指南，你可以充分利用 AgentifUI 的字体系统，创建美观且易读的用户界面。 