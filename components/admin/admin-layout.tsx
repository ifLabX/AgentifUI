import React, { ReactNode, useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  CssBaseline,
  useTheme as useMuiTheme
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 只导入需要的图标
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

// 保持原有的抽屉宽度
const drawerWidth = 240;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const muiTheme = useMuiTheme();
  
  // 只保留API配置路由
  const menuItems = [
    { text: 'API 配置', icon: <SettingsApplicationsIcon />, href: '/admin/api-config' },
  ];

  // 获取当前主题的颜色
  const getThemeColors = () => {
    if (isDark) {
      return {
        mainBackground: '#292524', // stone-800
        sidebarBackground: '#44403c', // stone-700
        textColor: '#f3f4f6', // gray-100
        borderColor: 'rgba(75, 85, 99, 0.5)', // gray-700 with opacity
        hoverBackground: '#57534e', // stone-600
        activeBackground: '#44403c', // stone-700
        dividerColor: 'rgba(75, 85, 99, 0.6)', // gray-700 with opacity
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      };
    } else {
      return {
        mainBackground: '#f5f5f4', // stone-100
        sidebarBackground: '#e7e5e4', // stone-200
        textColor: '#1c1917', // stone-900
        borderColor: 'rgba(214, 211, 209, 0.6)', // stone-300 with opacity
        hoverBackground: '#d6d3d1', // stone-300
        activeBackground: '#e7e5e4', // stone-200
        dividerColor: 'rgba(214, 211, 209, 0.5)', // stone-300 with opacity
        shadowColor: 'rgba(120, 113, 108, 0.5)' // stone-500 with opacity
      };
    }
  };

  const colors = getThemeColors();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* 顶部应用栏 - 使用主题颜色 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          bgcolor: colors.mainBackground,
          color: colors.textColor,
          boxShadow: `0 1px 3px ${colors.shadowColor}`,
          borderBottom: `1px solid ${colors.borderColor}`
        }}
        elevation={0}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
            LLM EduHub 管理后台
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 侧边栏 - 使用与聊天页面一致的样式 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          zIndex: 10, // 确保侧边栏在适当的层级
          position: 'relative',
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            bgcolor: colors.sidebarBackground,
            color: colors.textColor,
            borderRight: `1px solid ${colors.borderColor}`,
            boxShadow: isDark 
              ? '4px 0 8px rgba(0, 0, 0, 0.3)' 
              : '4px 0 8px rgba(120, 113, 108, 0.15)',
            backdropFilter: 'blur(4px)',
            position: 'relative', // 确保定位正确
            overflow: 'visible' // 允许内容溢出
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => {
              // 使用startsWith检查路径前缀，确保子页面也能正确高亮导航项
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.text} href={item.href} passHref style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                  <ListItem 
                    component="div"
                    sx={{
                      my: 0.5,
                      mx: 1,
                      px: 2, // 增加水平内边距
                      py: 1, // 确保垂直内边距合适
                      borderRadius: '8px',
                      border: '1px solid transparent',
                      transition: 'all 0.2s ease-in-out',
                      width: 'calc(100% - 16px)', // 确保宽度正确
                      boxSizing: 'border-box', // 确保边框不会增加元素宽度
                      overflow: 'hidden', // 防止内容溢出
                      '&:hover': { 
                        bgcolor: colors.hoverBackground,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      },
                      ...(isActive && {
                        bgcolor: colors.activeBackground,
                        borderColor: colors.borderColor,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      })
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isDark ? 'rgba(209, 213, 219, 0.8)' : 'rgba(87, 83, 78, 0.8)',
                      minWidth: '32px', // 减小图标的最小宽度
                      mr: 1 // 增加右边距
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 500 : 400,
                        noWrap: true, // 防止文字换行
                        overflow: 'hidden', // 隐藏溢出文字
                        textOverflow: 'ellipsis' // 显示省略号
                      }}
                      sx={{ margin: 0 }} // 移除默认边距
                    />
                  </ListItem>
                </Link>
              );
            })}
          </List>
          <Divider sx={{ 
            my: 1, 
            borderColor: colors.dividerColor,
            opacity: 0.6
          }} />
        </Box>
      </Drawer>

      {/* 主内容区域 - 使用主题颜色 */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          bgcolor: colors.mainBackground,
          color: colors.textColor,
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
