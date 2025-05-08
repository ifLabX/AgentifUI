import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert, 
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { getDifyAppConfig } from '@lib/config/dify-config';

export default function CurrentDifyConfig() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function loadConfig() {
      try {
        setIsLoading(true);
        
        // 获取默认配置
        const defaultConfig = await getDifyAppConfig('default');
        
        setConfig(defaultConfig);
      } catch (err) {
        console.error('获取 Dify 配置时出错:', err);
        setError(err instanceof Error ? err : new Error('获取配置时出错'));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadConfig();
  }, []);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          加载配置中...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>获取配置失败</AlertTitle>
        {error.message}
      </Alert>
    );
  }
  
  if (!config) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>未找到配置</AlertTitle>
        未找到 Dify 配置，请使用下方表单创建配置。
      </Alert>
    );
  }
  
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          当前 Dify 配置
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>配置项</TableCell>
                <TableCell>值</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>应用 ID</TableCell>
                <TableCell>{config.appId || 'default'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>显示名称</TableCell>
                <TableCell>{config.displayName || '未设置'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>描述</TableCell>
                <TableCell>{config.description || '未设置'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>API URL</TableCell>
                <TableCell>{config.apiUrl || '未设置'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>API 密钥</TableCell>
                <TableCell>
                  {config.apiKey ? '已设置 (出于安全考虑不显示)' : '未设置'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
