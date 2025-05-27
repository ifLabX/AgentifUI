# 欢迎界面智能布局系统

## 概述

欢迎界面智能布局系统是一个自适应的组件定位解决方案，能够：

- **防止组件遮挡**：确保欢迎文字、提示按钮和输入框之间保持合适的间距
- **自适应布局**：根据屏幕尺寸和内容长度自动调整组件位置
- **响应式设计**：在不同设备上提供最佳的用户体验
- **易于配置**：通过配置文件轻松调整布局参数

## 系统架构

### 核心组件

1. **`useWelcomeLayout` Hook** (`lib/hooks/use-welcome-layout.ts`)
   - 计算各组件的智能位置
   - 检测是否需要紧凑布局
   - 监听视口变化并重新计算

2. **布局配置** (`lib/config/welcome-layout.ts`)
   - 定义布局参数和间距规则
   - 提供便捷的调整函数
   - 支持响应式配置

3. **组件集成**
   - `ChatContainer`：输入框容器
   - `WelcomeScreen`：欢迎文字组件
   - `PromptContainer`：提示按钮容器

### 工作原理

1. **基准定位**：以输入框为基准点，其他组件相对定位
2. **间距计算**：确保各组件之间的最小间距
3. **边界检测**：防止组件超出视口边界
4. **紧凑模式**：当空间不足时自动启用紧凑布局

## 使用方法

### 基本使用

```tsx
import { useWelcomeLayout } from '@lib/hooks/use-welcome-layout';

function MyComponent() {
  const { 
    input, 
    welcomeText, 
    promptContainer, 
    needsCompactLayout 
  } = useWelcomeLayout();
  
  return (
    <div style={welcomeText}>
      {/* 欢迎文字内容 */}
    </div>
  );
}
```

### 配置调整

#### 使用预设配置

```tsx
import { 
  moveWelcomeTextCloserToInput,
  moveInputHigher,
  createCompactLayout 
} from '@lib/config/welcome-layout';

// 让欢迎文字更靠近输入框
const config1 = moveWelcomeTextCloserToInput(30);

// 让输入框位置更高
const config2 = moveInputHigher(40);

// 使用紧凑布局
const config3 = createCompactLayout();
```

#### 自定义配置

```tsx
import { DEFAULT_WELCOME_LAYOUT } from '@lib/config/welcome-layout';

const customConfig = {
  ...DEFAULT_WELCOME_LAYOUT,
  inputOffsetFromCenter: 100, // 输入框向下偏移100px
  minSpacing: {
    welcomeTextToInput: 80, // 欢迎文字到输入框80px间距
    promptToInput: 50, // 提示按钮到输入框50px间距
    welcomeTextToPrompt: 40, // 欢迎文字到提示按钮40px间距
  },
};
```

## 配置参数说明

### 基本参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `inputOffsetFromCenter` | number | 80 | 输入框相对于视口中心的偏移（像素） |
| `compactLayoutThreshold` | number | 0.9 | 紧凑布局触发阈值（视口高度比例） |

### 间距配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `welcomeTextToInput` | number | 60 | 欢迎文字到输入框的最小距离 |
| `promptToInput` | number | 40 | 提示按钮到输入框的最小距离 |
| `welcomeTextToPrompt` | number | 30 | 欢迎文字到提示按钮的最小距离 |

### 高度估算

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `welcomeText` | number | 120 | 欢迎文字区域估算高度 |
| `promptContainer` | number | 60 | 提示容器估算高度 |
| `inputContainer` | number | 80 | 输入框容器基础高度 |

## 便捷调整函数

### 位置调整

```tsx
// 让欢迎文字更靠近输入框（减少20px间距）
moveWelcomeTextCloserToInput(20)

// 让提示按钮更靠近输入框（减少15px间距）
movePromptCloserToInput(15)

// 让输入框位置更高（向上移动20px）
moveInputHigher(20)

// 让输入框位置更低（向下移动20px）
moveInputLower(20)
```

### 预设布局

```tsx
// 紧凑布局（适用于小屏幕）
createCompactLayout()

// 宽松布局（适用于大屏幕）
createSpacedLayout()

// 响应式布局（自动根据屏幕尺寸选择）
getResponsiveLayout()
```

## 响应式行为

### 自动适配

系统会根据屏幕尺寸自动选择合适的布局：

- **小屏幕** (< 700px 高度或 < 640px 宽度)：使用紧凑布局
- **大屏幕** (> 900px 高度且 > 1200px 宽度)：使用宽松布局
- **中等屏幕**：使用默认布局

### 紧凑模式特性

当启用紧凑模式时：

- 减少组件间距
- 缩小文字和按钮尺寸
- 调整组件位置以适应小屏幕

## 常见问题

### Q: 如何调整欢迎文字的位置？

A: 使用 `moveWelcomeTextCloserToInput()` 或 `moveInputHigher()` 函数：

```tsx
// 方法1：让欢迎文字更靠近输入框
const config = moveWelcomeTextCloserToInput(30);

// 方法2：让输入框位置更高
const config = moveInputHigher(40);
```

### Q: 如何防止长文本被输入框遮挡？

A: 系统会自动检测并调整：

1. 根据内容长度估算组件高度
2. 计算所需的总空间
3. 当空间不足时自动启用紧凑布局
4. 确保最小间距不被违反

### Q: 如何为特定屏幕尺寸优化布局？

A: 使用响应式配置或自定义配置：

```tsx
// 使用响应式配置（推荐）
const config = getResponsiveLayout();

// 或者根据条件自定义
const config = window.innerHeight < 700 
  ? createCompactLayout() 
  : createSpacedLayout();
```

### Q: 如何调试布局问题？

A: 检查以下几点：

1. 确认 `useWelcomeLayout` Hook 被正确调用
2. 检查组件是否正确应用了返回的样式
3. 验证配置参数是否合理
4. 使用浏览器开发工具检查计算后的位置

## 最佳实践

1. **使用响应式配置**：优先使用 `getResponsiveLayout()` 而不是固定配置
2. **适度调整**：避免过度自定义，保持用户体验的一致性
3. **测试多屏幕**：在不同屏幕尺寸下测试布局效果
4. **考虑内容长度**：为动态内容预留足够的空间
5. **保持可访问性**：确保所有组件都能被正确访问和操作

## 添加新组件到欢迎界面

### 快速添加常见组件

系统提供了几个便捷函数来快速添加常见组件：

```tsx
import { 
  addNotificationComponent,
  addActionButtons,
  addStatusIndicator 
} from '@lib/config/welcome-layout';

// 添加通知组件（在欢迎文字上方）
const configWithNotification = addNotificationComponent(40);

// 添加操作按钮组（在提示按钮下方）
const configWithActions = addActionButtons(50);

// 添加状态指示器（在输入框上方）
const configWithStatus = addStatusIndicator(30);
```

### 自定义添加新组件

使用 `addComponent` 函数添加完全自定义的组件：

```tsx
import { addComponent } from '@lib/config/welcome-layout';

// 添加自定义组件
const customConfig = addComponent('myCustomComponent', {
  height: 60, // 组件高度
  spacing: { 
    myComponentToInput: 25, // 到输入框的间距
    myComponentToOther: 15  // 到其他组件的间距
  },
  positioning: 'below-input', // 位置：above-welcome | below-input | above-input | below-prompt | custom
  priority: 4, // 优先级（数字越小优先级越高）
  customOffset: 100 // 自定义偏移（仅当positioning为custom时使用）
});
```

### 组件定位选项

- `above-welcome`: 在欢迎文字上方
- `below-input`: 在输入框下方
- `above-input`: 在输入框上方
- `below-prompt`: 在提示按钮下方
- `custom`: 自定义位置（需要提供customOffset）

### 在组件中使用新布局

```tsx
import { useWelcomeLayout } from '@lib/hooks/use-welcome-layout';

function MyNewComponent() {
  const { extensions } = useWelcomeLayout();
  
  // 获取自定义组件的位置
  const myComponentPosition = extensions.myCustomComponent;
  
  if (!myComponentPosition) return null;
  
  return (
    <div 
      className="absolute left-1/2"
      style={{
        top: myComponentPosition.top,
        transform: myComponentPosition.transform,
        zIndex: myComponentPosition.zIndex
      }}
    >
      {/* 组件内容 */}
    </div>
  );
}
```

### 组合多个组件

```tsx
import { 
  addNotificationComponent,
  addActionButtons,
  addComponent 
} from '@lib/config/welcome-layout';

// 链式添加多个组件
let config = addNotificationComponent(40);
config = addActionButtons(50, config); // 传入之前的配置作为基础
config = addComponent('customWidget', {
  height: 35,
  spacing: { widgetToPrompt: 20 },
  positioning: 'above-input',
  priority: 2
}, config);
```

## 文字尺寸说明

### 主标题尺寸
- **正常模式**: `text-2xl` (24px)
- **紧凑模式**: `text-xl` (20px)

### 副标题尺寸
- **正常模式**: `text-sm` (14px)
- **紧凑模式**: `text-xs` (12px)

### Skeleton宽度
- **正常模式**: `w-96` (384px) - 更宽，避免长文本换行
- **紧凑模式**: `w-80` (320px) - 适应小屏幕

### 主标题最大宽度
- **正常模式**: `max-w-2xl` (672px) - 支持较长的动态开场白
- **紧凑模式**: `max-w-sm` (384px) - 适应小屏幕

## 移动端优化

系统会在小屏幕设备上自动：

1. **启用紧凑布局** (< 700px 高度或 < 640px 宽度)
2. **减小文字尺寸** (主标题xl，副标题xs)
3. **调整间距** (确保副标题不被遮挡)
4. **优化输入框位置** (适中偏移，确保内容可见)

## 更新日志

### v1.1.0
- 修复副标题尺寸过大问题
- 优化skeleton宽度与输入框匹配
- 改进移动端布局，确保副标题可见
- 添加新组件管理系统
- 提供便捷的组件添加函数
- 支持组件优先级和自定义定位

### v1.1.1
- 修复主标题最大宽度问题，避免过短换行
- 将整体布局上移，优化视觉平衡
- 动态调整欢迎文字容器最大宽度
- 优化skeleton宽度，更好支持长文本

### v1.0.0
- 初始版本
- 支持基本的智能布局
- 提供配置调整函数
- 实现响应式适配 