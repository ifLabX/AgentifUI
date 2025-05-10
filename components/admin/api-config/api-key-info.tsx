'use client';

import React from 'react';
import { Paper, Typography } from '@mui/material';

/**
 * API密钥管理提示信息组件
 * 显示关于API密钥单向加密存储的说明
 */
export default function ApiKeyInfo() {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        mb: 3, 
        bgcolor: 'info.light', 
        color: 'info.contrastText',
        border: '1px solid',
        borderColor: 'info.main'
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
        关于 API 密钥管理
      </Typography>
      <Typography variant="body2">
        出于安全考虑，API 密钥采用单向加密存储。一旦保存，密钥将无法以原始形式查看。当编辑应用实例时，密钥字段为空，只有当您需要更改密钥时才需要填写。如果保持为空，将继续使用当前密钥。
      </Typography>
    </Paper>
  );
}
