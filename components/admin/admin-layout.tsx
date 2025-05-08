import React, { ReactNode } from 'react';
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
  CssBaseline
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 使用替代图标，避免依赖问题
import HomeIcon from '@mui/icons-material/Home';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import GroupIcon from '@mui/icons-material/Group';
import TuneIcon from '@mui/icons-material/Tune';

const drawerWidth = 240;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { text: '控制面板', icon: <HomeIcon />, href: '/admin' },
    { text: 'API 配置', icon: <SettingsApplicationsIcon />, href: '/admin/api-config' },
    { text: '用户管理', icon: <GroupIcon />, href: '/admin/users' },
    { text: '系统设置', icon: <TuneIcon />, href: '/admin/settings' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            LLM EduHub 管理后台
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <Link key={item.text} href={item.href} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItem 
                  component="div"
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    backgroundColor: pathname === item.href ? 'rgba(0, 0, 0, 0.08)' : 'transparent'
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              </Link>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
