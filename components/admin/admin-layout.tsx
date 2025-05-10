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
// 只导入需要的图标
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';

const drawerWidth = 240;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  // 只保留API配置路由
  const menuItems = [
    { text: 'API 配置', icon: <SettingsApplicationsIcon />, href: '/admin/api-config' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
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
