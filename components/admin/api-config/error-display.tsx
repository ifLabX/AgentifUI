'use client';

import React from 'react';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { AlertCircle, XCircle, Shield } from 'lucide-react';
import AppInstanceList from './app-instance-list';
import { ServiceInstance } from '@lib/stores/api-config-store';

interface AuthErrorProps {
  message: string;
}

// --- BEGIN COMMENT ---
// 自定义Alert组件，替代MUI
// --- END COMMENT ---
const Alert = ({ 
  severity, 
  title, 
  children 
}: { 
  severity: 'error' | 'warning' | 'info'; 
  title?: string; 
  children: React.ReactNode 
}) => {
  const { isDark } = useTheme();
  
  const severityStyles = {
    error: isDark 
      ? "bg-red-900/20 border-red-800 text-red-200" 
      : "bg-red-50 border-red-200 text-red-800",
    warning: isDark 
      ? "bg-yellow-900/20 border-yellow-800 text-yellow-200" 
      : "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: isDark 
      ? "bg-stone-800/50 border-stone-700 text-stone-200" 
      : "bg-stone-100 border-stone-300 text-stone-800"
  };
  
  const Icon = severity === 'error' ? XCircle : AlertCircle;
  
  return (
    <div className={cn(
      "rounded-lg border p-4 mb-6",
      severityStyles[severity]
    )}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * 权限验证错误组件
 */
export function AuthError({ message }: AuthErrorProps) {
  return (
    <div className="p-6">
      <Alert severity="error" title="权限验证错误">
        {message}
      </Alert>
    </div>
  );
}

/**
 * 访问被拒绝组件
 */
export function AccessDenied() {
  const { isDark } = useTheme();
  
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <Shield className={cn(
          "h-16 w-16 mx-auto mb-4",
          isDark ? "text-red-400" : "text-red-500"
        )} />
        <h2 className={cn(
          "text-xl font-semibold mb-2",
          isDark ? "text-stone-100" : "text-stone-900"
        )}>
          访问被拒绝
        </h2>
        <p className={cn(
          "text-sm",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          您没有管理员权限访问此页面。请联系系统管理员获取相应权限。
        </p>
      </div>
    </div>
  );
}

interface DataErrorProps {
  message: string;
  serviceInstances: ServiceInstance[];
  onAddInstance: () => void;
  onEditInstance: (instance: ServiceInstance) => void;
  onDeleteInstance: (instanceId: string) => Promise<void>;
}

/**
 * 数据加载错误组件
 * 显示错误信息并尝试显示已加载的应用实例列表
 */
export function DataError({ 
  message, 
  serviceInstances,
  onAddInstance,
  onEditInstance,
  onDeleteInstance
}: DataErrorProps) {
  return (
    <div className="p-6">
      <Alert severity="error" title="数据加载错误">
        {message}
      </Alert>
      
      {/* --- BEGIN COMMENT ---
      显示应用实例列表，即使有错误
      --- END COMMENT --- */}
      <AppInstanceList 
        serviceInstances={serviceInstances}
        onAddInstance={onAddInstance}
        onEditInstance={onEditInstance}
        onDeleteInstance={onDeleteInstance}
      />
    </div>
  );
}
