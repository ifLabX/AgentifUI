import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Button, 
  Divider, 
  Tooltip, 
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { ServiceInstance } from '@lib/types/database';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

interface AppInstanceListProps {
  serviceInstances: ServiceInstance[];
  onAddInstance: () => void;
  onEditInstance: (instance: ServiceInstance) => void;
  onDeleteInstance: (instanceId: string) => void;
}

export default function AppInstanceList({ 
  serviceInstances, 
  onAddInstance, 
  onEditInstance, 
  onDeleteInstance 
}: AppInstanceListProps) {
  const { isDark } = useTheme();
  
  // 获取当前主题的颜色
  const getThemeColors = () => {
    if (isDark) {
      return {
        cardBg: '#292524', // stone-800
        borderColor: 'rgba(75, 85, 99, 0.3)', // gray-700 with opacity
        tableHeaderBg: 'rgba(41, 37, 36, 0.6)', // stone-800 with opacity
        tableBorderColor: 'rgba(87, 83, 78, 0.2)', // stone-600 with opacity
        tableRowHoverBg: 'rgba(68, 64, 60, 0.5)', // stone-700 with opacity
        buttonPrimary: 'rgb(59, 130, 246)', // blue-500
        buttonPrimaryHover: 'rgb(37, 99, 235)', // blue-600
        chipDefaultBg: 'rgba(87, 83, 78, 0.2)', // stone-600 with opacity
        chipPrimaryBg: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
        chipPrimaryBorder: 'rgba(59, 130, 246, 0.4)', // blue-500 with opacity
        iconButtonHover: 'rgba(87, 83, 78, 0.2)', // stone-600 with opacity
        shadowColor: 'rgba(0, 0, 0, 0.25)'
      };
    } else {
      return {
        cardBg: '#ffffff',
        borderColor: 'rgba(214, 211, 209, 0.5)', // stone-300 with opacity
        tableHeaderBg: 'rgba(245, 245, 244, 0.8)', // stone-100 with opacity
        tableBorderColor: 'rgba(214, 211, 209, 0.5)', // stone-300 with opacity
        tableRowHoverBg: 'rgba(231, 229, 228, 0.5)', // stone-200 with opacity
        buttonPrimary: 'rgb(37, 99, 235)', // blue-600
        buttonPrimaryHover: 'rgb(29, 78, 216)', // blue-700
        chipDefaultBg: 'rgba(214, 211, 209, 0.3)', // stone-300 with opacity
        chipPrimaryBg: 'rgba(37, 99, 235, 0.1)', // blue-600 with opacity
        chipPrimaryBorder: 'rgba(37, 99, 235, 0.3)', // blue-600 with opacity
        iconButtonHover: 'rgba(214, 211, 209, 0.5)', // stone-300 with opacity
        shadowColor: 'rgba(120, 113, 108, 0.15)' // stone-500 with opacity
      };
    }
  };
  
  const colors = getThemeColors();
  
  // 过滤出 Dify 提供商的服务实例
  const difyInstances = serviceInstances.filter(instance => 
    instance.provider_id && instance.instance_id
  );

  return (
    <Card
      elevation={isDark ? 0 : 1}
      sx={{
        bgcolor: colors.cardBg,
        border: '1px solid',
        borderColor: colors.borderColor,
        borderRadius: '0.75rem',
        boxShadow: `0 4px 6px -1px ${colors.shadowColor}`,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontWeight: 600,
              color: isDark ? 'rgb(229, 231, 235)' : 'rgb(31, 41, 55)' // gray-200 : gray-800
            }}
          >
            Dify 应用实例
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={onAddInstance}
            sx={{
              borderRadius: '0.5rem',
              py: 1,
              px: 2,
              textTransform: 'none',
              fontWeight: 500,
              bgcolor: colors.buttonPrimary,
              '&:hover': {
                bgcolor: colors.buttonPrimaryHover,
              }
            }}
          >
            添加应用
          </Button>
        </Box>

        {difyInstances.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 2,
              borderRadius: '0.5rem',
              border: '1px dashed',
              borderColor: isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(214, 211, 209, 0.6)',
              bgcolor: isDark ? 'rgba(41, 37, 36, 0.3)' : 'rgba(245, 245, 244, 0.5)'
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
                fontWeight: 500
              }}
            >
              暂无应用实例，请点击“添加应用”按钮创建
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            variant="outlined"
            sx={{
              borderRadius: '0.75rem',
              border: '1px solid',
              borderColor: colors.tableBorderColor,
              boxShadow: 'none',
              overflow: 'hidden',
              bgcolor: 'transparent'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: colors.tableHeaderBg,
                }}>
                  <TableCell sx={{ 
                    borderBottom: `1px solid ${colors.tableBorderColor}`,
                    py: 1.5,
                    fontWeight: 600,
                    color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)' // gray-300 : gray-700
                  }}>
                    应用 ID
                  </TableCell>
                  <TableCell sx={{ 
                    borderBottom: `1px solid ${colors.tableBorderColor}`,
                    py: 1.5,
                    fontWeight: 600,
                    color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)' // gray-300 : gray-700
                  }}>
                    显示名称
                  </TableCell>
                  <TableCell sx={{ 
                    borderBottom: `1px solid ${colors.tableBorderColor}`,
                    py: 1.5,
                    fontWeight: 600,
                    color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)' // gray-300 : gray-700
                  }}>
                    描述
                  </TableCell>
                  <TableCell sx={{ 
                    borderBottom: `1px solid ${colors.tableBorderColor}`,
                    py: 1.5,
                    fontWeight: 600,
                    color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)' // gray-300 : gray-700
                  }}>
                    状态
                  </TableCell>
                  <TableCell sx={{ 
                    borderBottom: `1px solid ${colors.tableBorderColor}`,
                    py: 1.5,
                    fontWeight: 600,
                    color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)' // gray-300 : gray-700
                  }}>
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {difyInstances.map((instance) => (
                  <TableRow 
                    key={instance.id}
                    sx={{
                      '&:hover': {
                        bgcolor: colors.tableRowHoverBg
                      },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ 
                      borderBottom: `1px solid ${colors.tableBorderColor}`,
                      py: 1.5
                    }}>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace"
                        sx={{ 
                          color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)', // gray-300 : gray-700
                          fontWeight: 500
                        }}
                      >
                        {instance.instance_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: `1px solid ${colors.tableBorderColor}`,
                      py: 1.5
                    }}>
                      {instance.display_name || instance.name}
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: `1px solid ${colors.tableBorderColor}`,
                      py: 1.5,
                      color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)' // gray-400 : gray-500
                    }}>
                      {instance.description || '无描述'}
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: `1px solid ${colors.tableBorderColor}`,
                      py: 1.5
                    }}>
                      {instance.is_default ? (
                        <Chip 
                          size="small" 
                          icon={<InfoIcon sx={{ fontSize: '1rem' }} />} 
                          label="默认应用"
                          sx={{
                            bgcolor: colors.chipPrimaryBg,
                            color: isDark ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)', // blue-400 : blue-600
                            border: '1px solid',
                            borderColor: colors.chipPrimaryBorder,
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="已配置"
                          sx={{
                            bgcolor: colors.chipDefaultBg,
                            color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)', // gray-300 : gray-700
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: `1px solid ${colors.tableBorderColor}`,
                      py: 1.5
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="编辑">
                          <IconButton 
                            size="small" 
                            onClick={() => onEditInstance(instance)}
                            sx={{
                              color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)', // gray-400 : gray-500
                              '&:hover': {
                                bgcolor: colors.iconButtonHover,
                                color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)' // gray-300 : gray-700
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton 
                            size="small"
                            onClick={() => onDeleteInstance(instance.id)}
                            sx={{
                              color: isDark ? 'rgb(248, 113, 113)' : 'rgb(220, 38, 38)', // red-400 : red-600
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.1)', // red with opacity
                                color: isDark ? 'rgb(248, 113, 113)' : 'rgb(220, 38, 38)' // red-400 : red-600
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
