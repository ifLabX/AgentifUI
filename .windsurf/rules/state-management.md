---
trigger: manual
description:
globs:
---
# 状态管理指南

本文档描述了 if-agent-ui 项目中使用的状态管理方案，特别是使用 Zustand 进行状态管理的模式。

## 状态管理技术栈

项目使用 [Zustand](https://github.com/pmndrs/zustand) 作为主要的状态管理解决方案，这是一个轻量级的状态管理库，具有以下特点：

- 基于 hooks 的简洁 API
- 不需要 Provider 包装
- 支持状态分片和选择性订阅
- 支持中间件（例如，持久化、devtools）

## Store 组织结构

Store 文件存放在 `lib/stores/` 目录中，根据功能域进行组织:

```
lib/stores/
├── chat-input-store.ts    # 聊天输入相关状态
├── chat-layout-store.ts   # 聊天布局相关状态
├── sidebar-store.ts       # 侧边栏状态
├── theme-store.ts         # 主题相关状态
└── ui/                    # UI相关状态的子目录
    └── prompt-panel-store.ts  # 提示面板状态
```

## Store 实现模式

### 基本 Store 模式

```typescript
import { create } from 'zustand';

interface StateType {
  // 状态属性
  someState: string;
  // 操作方法
  setSomeState: (value: string) => void;
}

export const useMyStore = create<StateType>((set) => ({
  // 初始状态
  someState: 'initial value',
  // 更新方法
  setSomeState: (value) => set({ someState: value }),
}));
```

### 常量导出模式

对于需要在多个组件中共享的常量值，store 文件中通常会导出这些常量:

```typescript
// 在 store 文件中定义和导出常量
export const SOME_CONSTANT = 'value';

// 然后在 store 和组件中都可以使用
```

## 聊天布局状态管理

聊天布局状态 ([lib/stores/chat-layout-store.ts](mdc:lib/stores/chat-layout-store.ts)) 是一个典型示例:

```typescript
import { create } from 'zustand';

interface ChatLayoutState {
  inputHeight: number; // 存储输入框的实际高度
  setInputHeight: (height: number) => void;
  resetInputHeight: () => void;
}

const INITIAL_INPUT_HEIGHT = 48; 

export const useChatLayoutStore = create<ChatLayoutState>((set) => ({
  inputHeight: INITIAL_INPUT_HEIGHT, // 初始高度
  setInputHeight: (height) => set({ inputHeight: height }),
  resetInputHeight: () => set({ inputHeight: INITIAL_INPUT_HEIGHT }),
}));

export { INITIAL_INPUT_HEIGHT };
```

该 store:
- 跟踪输入框高度 (`inputHeight`)
- 提供更新方法 (`setInputHeight`)
- 提供重置方法 (`resetInputHeight`)
- 导出初始常量值 (`INITIAL_INPUT_HEIGHT`)

## 在组件中使用 Store

以 `ChatInput` 组件为例：

```tsx
import { useChatLayoutStore, INITIAL_INPUT_HEIGHT } from '@lib/stores/chat-layout-store';

const Component = () => {
  // 获取状态和方法
  const { inputHeight, setInputHeight } = useChatLayoutStore();
  
  // 使用状态
  useEffect(() => {
    // 在合适的时机更新状态
    setInputHeight(newHeight);
    
    // 清理函数
    return () => resetInputHeight();
  }, [setInputHeight, resetInputHeight]);
  
  return (
    // 根据状态渲染UI
    <div style={{ height: `${inputHeight}px` }}>
      {/* 组件内容 */}
    </div>
  );
};
```

## 最佳实践

1. **状态分割**: 将不相关的状态分割到不同的 store 中
2. **选择性订阅**: 只订阅组件所需的状态片段，减少不必要的重渲染
3. **导出常量**: 将与 store 相关的常量从 store 文件中导出，确保一致性
4. **使用 useCallback**: 对于传递给子组件的更新函数，使用 useCallback 包装以减少不必要的重渲染
5. **清理函数**: 在组件卸载时重置相关状态
