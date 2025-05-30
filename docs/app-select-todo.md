# App切换集成指南

## 1. App切换功能集成

### 1.1 前端UI组件

创建App选择器组件：

```tsx
// components/app-selector/app-selector.tsx
import { useState, useEffect } from 'react';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { getAllDifyApps } from '@lib/services/dify/app-service'; // 需要创建
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

export function AppSelector() {
  const { currentAppId, switchToApp, isLoading } = useCurrentApp();
  const [availableApps, setAvailableApps] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // 获取可用的app列表
  useEffect(() => {
    const loadApps = async () => {
      setIsLoadingApps(true);
      try {
        const apps = await getAllDifyApps();
        setAvailableApps(apps);
      } catch (error) {
        console.error('加载app列表失败:', error);
      } finally {
        setIsLoadingApps(false);
      }
    };
    
    loadApps();
  }, []);

  const handleAppChange = async (newAppId: string) => {
    if (newAppId !== currentAppId) {
      try {
        await switchToApp(newAppId);
        // 可选：显示成功提示
        console.log(`已切换到app: ${newAppId}`);
      } catch (error) {
        console.error('切换app失败:', error);
        // 显示错误提示
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">当前应用:</span>
      <Select 
        value={currentAppId || ''} 
        onValueChange={handleAppChange}
        disabled={isLoading || isLoadingApps}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="选择应用" />
        </SelectTrigger>
        <SelectContent>
          {availableApps.map(app => (
            <SelectItem key={app.id} value={app.id}>
              {app.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### 1.2 创建App服务

```typescript
// lib/services/dify/app-service.ts
import type { ServiceInstance } from '@lib/types/database';
import { getProviderByName } from '@lib/db';

/**
 * 获取所有可用的Dify应用
 */
export async function getAllDifyApps(): Promise<Array<{id: string, name: string, description?: string}>> {
  try {
    // 获取Dify提供商
    const providerResult = await getProviderByName('Dify');
    if (!providerResult.success || !providerResult.data) {
      throw new Error('未找到Dify提供商');
    }

    // 获取所有Dify服务实例
    const { createClient } = await import('@lib/supabase/client');
    const supabase = createClient();
    
    const { data: instances, error } = await supabase
      .from('service_instances')
      .select('instance_id, display_name, description')
      .eq('provider_id', providerResult.data.id)
      .order('display_name');
      
    if (error) {
      throw error;
    }
    
    return instances?.map(instance => ({
      id: instance.instance_id,
      name: instance.display_name || instance.instance_id,
      description: instance.description
    })) || [];
    
  } catch (error) {
    console.error('获取Dify应用列表失败:', error);
    throw error;
  }
}
```

### 1.3 扩展useCurrentApp Hook

```typescript
// lib/hooks/use-current-app.ts (添加方法)
export function useCurrentApp() {
  // ... 现有代码 ...
  
  // 新增：切换app的便捷方法
  const switchToApp = useCallback(async (appId: string) => {
    try {
      await switchToAppAction(appId);
      
      // 切换成功后，可能需要：
      // 1. 清除当前聊天状态
      // 2. 重定向到新的聊天页面
      // 3. 刷新相关数据
      
      // 清除当前聊天状态
      const { clearMessages } = require('@lib/stores/chat-store').useChatStore.getState();
      clearMessages();
      
      // 重定向到app页面
      if (typeof window !== 'undefined') {
        window.location.href = '/app/app-name';
        // 或者切换到聊天的首页
        window.location.href = '/chat/new';
      }
      
    } catch (error) {
      console.error('切换app失败:', error);
      throw error;
    }
  }, [switchToAppAction]);

  return {
    // ... 现有返回值 ...
    switchToApp, // 新增
  };
}
```

## 2. 注意事项

1. **状态清理**：切换app时要彻底清理相关状态，避免数据混乱
2. **缓存管理**：切换app时清除相关缓存，确保使用最新配置
3. **错误恢复**：提供友好的错误处理和重试机制
4. **用户体验**：显示适当的加载状态和进度提示
5. **权限检查**：确保用户有权限访问选择的app
6. **URL同步**：切换app后适当更新URL，保持状态一致

这个方案提供了完整的app切换功能和默认路由支持，同时保持了良好的用户体验和错误处理机制。
