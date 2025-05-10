'use client';

import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

interface ApiConfigTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

/**
 * API配置页面的标签页组件
 * 管理不同配置选项的标签页切换
 */
export default function ApiConfigTabs({ value, onChange }: ApiConfigTabsProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={value} onChange={onChange}>
        <Tab label="Dify 应用" />
        <Tab label="全局设置" disabled />
      </Tabs>
    </Box>
  );
}
