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
import { ServiceInstance } from '@lib/stores/api-config-store';

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
  // 过滤出 Dify 提供商的服务实例
  const difyInstances = serviceInstances.filter(instance => 
    instance.provider_id && instance.instance_id
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Dify 应用实例
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={onAddInstance}
          >
            添加应用
          </Button>
        </Box>

        {difyInstances.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            暂无应用实例，请点击"添加应用"按钮创建
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>应用 ID</TableCell>
                  <TableCell>显示名称</TableCell>
                  <TableCell>描述</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {difyInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {instance.instance_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{instance.display_name || instance.name}</TableCell>
                    <TableCell>{instance.description || '无描述'}</TableCell>
                    <TableCell>
                      {instance.is_default ? (
                        <Chip 
                          size="small" 
                          color="primary" 
                          icon={<InfoIcon />} 
                          label="默认应用" 
                        />
                      ) : (
                        <Chip size="small" label="已配置" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="编辑">
                        <IconButton 
                          size="small" 
                          onClick={() => onEditInstance(instance)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => onDeleteInstance(instance.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
