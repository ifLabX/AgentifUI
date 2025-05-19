"use client";

import { StagewiseToolbar } from '@stagewise/toolbar-next';
import { useEffect, useState } from 'react';

// --- BEGIN COMMENT ---
// 这个组件封装了 Stagewise 工具栏，确保它只在开发环境中运行
// 通过使用 useEffect 和 useState 来处理客户端渲染
// Next.js 在客户端会自动暴露 process.env.NODE_ENV
// --- END COMMENT ---
export function StagewiseToolbarWrapper() {
  // 使用状态来跟踪是否在客户端环境
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 基本工具栏配置
  const stagewiseConfig = {
    plugins: []
  };

  // 只在客户端渲染，且依赖 Next.js 自带的环境变量检测
  if (isMounted && process.env.NODE_ENV === 'development') {
    return <StagewiseToolbar config={stagewiseConfig} />;
  }

  return null;
}
