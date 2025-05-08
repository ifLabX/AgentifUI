'use client';

import { useEffect } from 'react';
import { Box, Container, Typography, Alert, AlertTitle, CircularProgress } from '@mui/material';
import { useAdminAuth } from '@lib/hooks/use-admin-auth';
import { useApiConfigStore } from '@lib/stores/api-config-store';
import ApiConfigForm from '@components/admin/ApiConfigForm';

export default function ApiConfigPage() {
  // 使用管理员权限检查 hook
  const { isAdmin, isLoading: isAuthLoading, error: authError } = useAdminAuth();
  
  // 使用 API 配置 store
  const { 
    loadConfigData, 
    isLoading: isDataLoading,
    error: dataError
  } = useApiConfigStore();
  
  // 加载配置数据
  useEffect(() => {
    if (isAdmin) {
      loadConfigData();
    }
  }, [isAdmin, loadConfigData]);
  
  // 显示加载状态
  if (isAuthLoading || isDataLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            加载中...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // 显示错误信息
  if (authError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>权限验证错误</AlertTitle>
          {authError.message}
        </Alert>
      </Container>
    );
  }
  
  // 显示访问被拒绝信息
  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>访问被拒绝</AlertTitle>
          您没有管理员权限访问此页面。
        </Alert>
      </Container>
    );
  }
  
  // 显示数据加载错误
  if (dataError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>数据加载错误</AlertTitle>
          {dataError.message}
        </Alert>
        <Box mt={2} display="flex" justifyContent="center">
          <ApiConfigForm />
        </Box>
      </Container>
    );
  }
  
  // 显示 API 配置表单
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API 配置管理
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        管理应用程序使用的 API 密钥和配置
      </Typography>
      <Box mt={3}>
        <ApiConfigForm />
      </Box>
    </Container>
  );
}