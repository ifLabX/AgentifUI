'use client';

import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface FeedbackNotificationProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

/**
 * 操作反馈通知组件
 * 显示操作成功或失败的反馈信息
 */
export default function FeedbackNotification({ 
  open, 
  message, 
  severity, 
  onClose 
}: FeedbackNotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
