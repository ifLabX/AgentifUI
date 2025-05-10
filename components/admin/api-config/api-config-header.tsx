'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * API配置页面的头部组件，显示标题和描述
 */
export default function ApiConfigHeader() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API 配置管理
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        管理应用程序使用的 API 密钥和配置
      </Typography>
    </Box>
  );
}
