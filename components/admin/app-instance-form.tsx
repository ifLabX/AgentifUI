import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  AlertTitle,
  Grid,
  Divider
} from '@mui/material';
import { ServiceInstance } from '@lib/stores/api-config-store';

interface AppInstanceFormProps {
  instance?: ServiceInstance;
  providerId: string;
  onSave: (instance: Partial<ServiceInstance> & { apiKey?: string }) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
  error: Error | null;
}

export default function AppInstanceForm({ 
  instance, 
  providerId,
  onSave, 
  onCancel,
  isProcessing,
  error
}: AppInstanceFormProps) {
  const [formData, setFormData] = useState<Partial<ServiceInstance>>({
    provider_id: providerId,
    instance_id: '',
    name: '',
    display_name: '',
    description: '',
    is_default: false,
    api_path: '',
  });

  const [apiKey, setApiKey] = useState('');
  
  // 如果是编辑模式，加载现有实例数据
  useEffect(() => {
    if (instance) {
      setFormData({
        ...instance,
        provider_id: providerId,
      });
    }
  }, [instance, providerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 构建保存数据
    const saveData = {
      ...formData,
      apiKey: apiKey || undefined, // 只有当有值时才包含
    };
    
    // 直接调用保存函数，错误处理已在父组件中实现
    await onSave(saveData);
  };

  const isEditMode = !!instance;
  const title = isEditMode ? '编辑 Dify 应用' : '添加 Dify 应用';

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>错误</AlertTitle>
            {error.message}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <TextField
                margin="normal"
                required
                fullWidth
                id="instance_id"
                label="应用 ID"
                name="instance_id"
                value={formData.instance_id || ''}
                onChange={handleChange}
                placeholder="例如: chat-bot-1"
                helperText="唯一标识符，用于API路由，创建后不可修改"
                disabled={isEditMode}
              />
            </Box>
            
            <Box>
              <TextField
                margin="normal"
                required
                fullWidth
                id="display_name"
                label="显示名称"
                name="display_name"
                value={formData.display_name || ''}
                onChange={handleChange}
                placeholder="例如: 客服聊天机器人"
                helperText="用户友好的名称，用于显示"
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="应用描述"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="描述此应用的用途和功能"
              multiline
              rows={2}
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              API 配置
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <TextField
                margin="normal"
                fullWidth
                id="api_path"
                label="API 路径"
                name="api_path"
                value={formData.api_path || ''}
                onChange={handleChange}
                placeholder="/v1"
                helperText="可选，API 的子路径"
              />
            </Box>
            
            <Box>
              <TextField
                margin="normal"
                fullWidth
                id="apiKey"
                label="API 密钥"
                name="apiKey"
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder={isEditMode ? "留空表示不修改" : "输入 API 密钥"}
                helperText="API 密钥将在存储前加密，只有应用程序可以解密"
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_default || false}
                  onChange={handleChange}
                  name="is_default"
                  color="primary"
                />
              }
              label="设为默认应用"
            />
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isProcessing || !formData.instance_id || !formData.display_name}
            >
              {isProcessing ? '保存中...' : '保存'}
              {isProcessing && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
