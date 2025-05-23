# 数据库优化后的使用示例

本文档展示了如何使用优化后的数据库接口，包括新的Result类型、缓存服务、实时订阅等功能。

## 1. Result类型的使用

### 基本用法

```typescript
import { getCurrentUserProfile, Result } from '@lib/db';
import { Profile } from '@lib/types/database';

// 获取当前用户资料 - 新的方式
async function handleGetUserProfile() {
  const result: Result<Profile | null> = await getCurrentUserProfile();
  
  if (result.success) {
    // 类型安全的数据访问
    const profile = result.data;
    if (profile) {
      console.log('用户名:', profile.username);
      console.log('角色:', profile.role);
    } else {
      console.log('用户未登录');
    }
  } else {
    // 统一的错误处理
    console.error('获取用户资料失败:', result.error.message);
    // 可以根据错误类型进行不同处理
    if (result.error instanceof DatabaseError) {
      // 数据库相关错误
    } else if (result.error instanceof NetworkError) {
      // 网络相关错误
    }
  }
}
```

### 兼容性用法（逐步迁移）

```typescript
import { getCurrentUserProfileLegacy } from '@lib/db';

// 兼容旧代码的方式
async function handleGetUserProfileLegacy() {
  const profile = await getCurrentUserProfileLegacy();
  if (profile) {
    console.log('用户名:', profile.username);
  } else {
    console.log('获取失败或用户未登录');
  }
}
```

## 2. 统一数据服务的使用

### 直接使用数据服务

```typescript
import { dataService } from '@lib/db';
import { Conversation } from '@lib/types/database';

async function getConversationsWithCache() {
  const result = await dataService.findMany<Conversation>(
    'conversations',
    { user_id: 'user-id', status: 'active' },
    { column: 'updated_at', ascending: false },
    { offset: 0, limit: 20 },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
      subscribe: true,
      subscriptionKey: 'user-conversations:user-id',
      onUpdate: (payload) => {
        console.log('对话数据更新:', payload);
        // 处理实时更新
      }
    }
  );

  if (result.success) {
    const conversations = result.data;
    console.log(`获取到 ${conversations.length} 个对话`);
  } else {
    console.error('获取对话失败:', result.error);
  }
}
```

### 创建和更新数据

```typescript
import { dataService } from '@lib/db';

async function createAndUpdateConversation() {
  // 创建对话
  const createResult = await dataService.create('conversations', {
    user_id: 'user-id',
    title: '新对话',
    status: 'active'
  });

  if (createResult.success) {
    const conversation = createResult.data;
    console.log('创建成功:', conversation.id);

    // 更新对话
    const updateResult = await dataService.update(
      'conversations',
      conversation.id,
      { title: '更新后的标题' }
    );

    if (updateResult.success) {
      console.log('更新成功');
    }
  }
}
```

## 3. 消息服务的使用

### 优化的消息分页

```typescript
import { messageService } from '@lib/db';

async function loadMessagesWithPagination() {
  const result = await messageService.getMessagesPaginated(
    'conversation-id',
    {
      limit: 20,
      direction: 'older',
      includeCount: true,
      cache: true
    }
  );

  if (result.success) {
    const { messages, hasMore, nextCursor, totalCount } = result.data;
    console.log(`加载了 ${messages.length} 条消息，总共 ${totalCount} 条`);
    
    if (hasMore && nextCursor) {
      // 加载更多消息
      const moreResult = await messageService.getMessagesPaginated(
        'conversation-id',
        {
          cursor: nextCursor,
          limit: 20,
          direction: 'older'
        }
      );
    }
  }
}
```

### 保存消息

```typescript
import { messageService } from '@lib/db';

async function saveUserMessage() {
  const result = await messageService.saveMessage({
    conversation_id: 'conversation-id',
    user_id: 'user-id',
    role: 'user',
    content: '用户发送的消息',
    metadata: { source: 'web' }
  });

  if (result.success) {
    console.log('消息保存成功:', result.data.id);
  } else {
    console.error('消息保存失败:', result.error);
  }
}
```

## 4. 缓存服务的使用

### 手动缓存管理

```typescript
import { cacheService, CacheKeys } from '@lib/db';

// 设置缓存
cacheService.set('custom-key', { data: 'value' }, 10 * 60 * 1000);

// 获取缓存
const cached = await cacheService.get(
  'expensive-operation',
  async () => {
    // 耗时操作
    return await someExpensiveOperation();
  },
  15 * 60 * 1000 // 15分钟TTL
);

// 清除特定缓存
cacheService.delete(CacheKeys.userProfile('user-id'));

// 清除模式匹配的缓存
cacheService.deletePattern('user:*');

// 获取缓存统计
const stats = cacheService.getStats();
console.log('缓存状态:', stats);
```

## 5. 实时订阅的使用

### 手动管理实时订阅

```typescript
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/db';

// 订阅用户对话变化
const unsubscribe = realtimeService.subscribe(
  SubscriptionKeys.userConversations('user-id'),
  SubscriptionConfigs.conversations('user-id'),
  (payload) => {
    console.log('对话变化:', payload);
    switch (payload.eventType) {
      case 'INSERT':
        console.log('新对话创建:', payload.new);
        break;
      case 'UPDATE':
        console.log('对话更新:', payload.new);
        break;
      case 'DELETE':
        console.log('对话删除:', payload.old);
        break;
    }
  }
);

// 取消订阅
// unsubscribe();
```

## 6. 在React组件中的使用

### 使用优化的Hook

```typescript
import { useSidebarConversations } from '@lib/hooks/use-sidebar-conversations';

function ConversationList() {
  const {
    conversations,
    isLoading,
    error,
    refresh,
    deleteConversation,
    renameConversation,
    clearCache
  } = useSidebarConversations(20);

  const handleDelete = async (id: string) => {
    const success = await deleteConversation(id);
    if (success) {
      console.log('删除成功');
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    const success = await renameConversation(id, newTitle);
    if (success) {
      console.log('重命名成功');
    }
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      <button onClick={clearCache}>清除缓存</button>
      {conversations.map(conv => (
        <div key={conv.id}>
          <span>{conv.title}</span>
          <button onClick={() => handleDelete(conv.id)}>删除</button>
          <button onClick={() => handleRename(conv.id, '新标题')}>重命名</button>
        </div>
      ))}
    </div>
  );
}
```

## 7. 错误处理最佳实践

### 统一错误处理

```typescript
import { Result, DatabaseError, NetworkError } from '@lib/db';

function handleDatabaseResult<T>(result: Result<T>): T | null {
  if (result.success) {
    return result.data;
  }

  // 根据错误类型进行不同处理
  if (result.error instanceof DatabaseError) {
    console.error('数据库错误:', result.error.message);
    // 可能需要重试或回退
  } else if (result.error instanceof NetworkError) {
    console.error('网络错误:', result.error.message);
    // 显示网络错误提示
  } else {
    console.error('未知错误:', result.error.message);
  }

  return null;
}
```

### 在异步函数中的错误处理

```typescript
import { wrapAsync } from '@lib/db';

async function safeAsyncOperation() {
  const result = await wrapAsync(async () => {
    // 可能抛出异常的操作
    return await someRiskyOperation();
  }, '操作失败');

  if (result.success) {
    return result.data;
  } else {
    console.error(result.error.message);
    return null;
  }
}
```

## 8. 性能优化技巧

### 缓存策略

```typescript
// 短期缓存：用户资料
await dataService.findOne('profiles', { id: userId }, {
  cache: true,
  cacheTTL: 5 * 60 * 1000 // 5分钟
});

// 中期缓存：对话列表
await dataService.findMany('conversations', filters, orderBy, pagination, {
  cache: true,
  cacheTTL: 10 * 60 * 1000 // 10分钟
});

// 长期缓存：配置数据
await dataService.findMany('providers', { is_active: true }, undefined, undefined, {
  cache: true,
  cacheTTL: 60 * 60 * 1000 // 1小时
});
```

### 批量操作

```typescript
// 批量保存消息
await messageService.saveMessages([
  { conversation_id: 'id1', role: 'user', content: 'msg1' },
  { conversation_id: 'id1', role: 'assistant', content: 'msg2' }
]);
```

## 9. 调试和监控

### 开发模式调试

```typescript
import { debugServiceStatus, getCacheStats, getRealtimeStats } from '@lib/db';

// 打印服务状态
debugServiceStatus();

// 获取详细统计
console.log('缓存统计:', getCacheStats());
console.log('订阅统计:', getRealtimeStats());
```

### 资源清理

```typescript
import { cleanupAllResources } from '@lib/db';

// 应用关闭时清理资源
window.addEventListener('beforeunload', () => {
  cleanupAllResources();
});
```

## 10. 迁移指南

### 从旧接口迁移到新接口

```typescript
// 旧方式
const profile = await getCurrentUserProfile();
if (profile) {
  // 处理数据
} else {
  // 处理错误（无法区分是否为真实错误）
}

// 新方式
const result = await getCurrentUserProfile();
if (result.success) {
  const profile = result.data;
  if (profile) {
    // 处理数据
  } else {
    // 用户未登录（明确的状态）
  }
} else {
  // 明确的错误处理
  console.error('获取用户资料失败:', result.error);
}
```

通过这些示例，你可以逐步将现有代码迁移到新的优化接口，享受更好的性能、缓存和错误处理机制。 