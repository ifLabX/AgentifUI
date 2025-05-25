'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCurrentApp } from '@lib/hooks/use-current-app';

/**
 * API配置页面的头部组件，显示标题和描述
 */
export default function ApiConfigHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  
  const { forceRefreshApp, currentAppId } = useCurrentApp();

  // 强制刷新应用缓存
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 1. 清理服务端缓存
      const cacheResponse = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!cacheResponse.ok) {
        throw new Error('清理服务端缓存失败');
      }
      
      const cacheResult = await cacheResponse.json();
      console.log('[管理界面] 服务端缓存清理结果:', cacheResult);
      
      // 2. 刷新前端应用缓存
      await forceRefreshApp();
      
      setNotification({
        open: true,
        message: `缓存已全面刷新 (服务端清理${cacheResult.clearedCount}项，前端已重新加载)`,
        severity: 'success'
      });
    } catch (error) {
      console.error('强制刷新缓存时出错:', error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : '强制刷新失败',
        severity: 'error'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // 关闭通知
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            API 配置管理
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            管理应用程序使用的 API 密钥和配置
          </Typography>
          {/* 显示当前应用ID用于调试 */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            当前应用ID: {currentAppId || '未设置'}
          </Typography>
        </Box>
        
        {/* 强制刷新按钮 */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleForceRefresh}
          disabled={isRefreshing}
          sx={{ ml: 2 }}
        >
          {isRefreshing ? '刷新中...' : '强制刷新应用'}
        </Button>
      </Box>

      {/* 通知组件 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
