'use client';

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme } from '@lib/hooks/use-theme';

/**
 * API密钥管理提示信息组件
 * 显示关于API密钥单向加密存储的说明
 */
export default function ApiKeyInfo() {
  const { isDark } = useTheme();
  
  // 根据主题获取颜色
  const getColors = () => {
    if (isDark) {
      return {
        bgColor: 'rgba(59, 130, 246, 0.15)', // blue-500 with low opacity
        borderColor: 'rgba(59, 130, 246, 0.3)', // blue-500 with opacity
        textColor: 'rgb(191, 219, 254)', // blue-200
        iconColor: 'rgb(96, 165, 250)' // blue-400
      };
    } else {
      return {
        bgColor: 'rgba(59, 130, 246, 0.1)', // blue-500 with low opacity
        borderColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
        textColor: 'rgb(30, 64, 175)', // blue-800
        iconColor: 'rgb(37, 99, 235)' // blue-600
      };
    }
  };
  
  const colors = getColors();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2.5, 
        mb: 3, 
        bgcolor: colors.bgColor,
        color: colors.textColor,
        border: '1px solid',
        borderColor: colors.borderColor,
        borderRadius: '0.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 1.5 
      }}>
        <InfoIcon sx={{ 
          color: colors.iconColor, 
          mt: 0.25,
          fontSize: '1.25rem'
        }} />
        <Box>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              mb: 0.5,
              color: colors.textColor
            }}
          >
            关于 API 密钥管理
          </Typography>
          <Typography 
            variant="body2"
            sx={{ 
              color: colors.textColor,
              lineHeight: 1.5
            }}
          >
            出于安全考虑，API 密钥采用单向加密存储。一旦保存，密钥将无法以原始形式查看。当编辑应用实例时，密钥字段为空，只有当您需要更改密钥时才需要填写。如果保持为空，将继续使用当前密钥。
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
