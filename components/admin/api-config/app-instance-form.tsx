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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete
} from '@mui/material';
import { ServiceInstance, ServiceInstanceConfig } from '@lib/types/database';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

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
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Partial<ServiceInstance>>({
    provider_id: providerId,
    instance_id: '',
    name: '',
    display_name: '',
    description: '',
    is_default: false,
    api_path: '',
    config: {
      app_metadata: {
        app_type: 'model',
        is_common_model: false,
        is_marketplace_app: false,
        tags: [],
        model_type: '',
        icon_url: '',
        brief_description: ''
      }
    }
  });

  const [apiKey, setApiKey] = useState('');
  
  // 🎯 预定义的标签选项
  const predefinedTags = [
    '对话助手', '文本生成', '代码助手', '翻译工具', 
    '数据分析', '创意写作', '学习辅导', '商务助手',
    'GPT-4', 'GPT-3.5', 'Claude', '通义千问'
  ];
  
  // 获取当前主题的颜色
  const getThemeColors = () => {
    if (isDark) {
      return {
        cardBg: '#292524', // stone-800
        borderColor: 'rgba(75, 85, 99, 0.3)', // gray-700 with opacity
        inputBg: 'rgba(41, 37, 36, 0.8)', // stone-800 with opacity
        inputBorder: 'rgba(87, 83, 78, 0.5)', // stone-600 with opacity
        hoverBorder: 'rgba(120, 113, 108, 0.8)', // stone-500 with opacity
        focusBorder: 'rgb(96, 165, 250)', // blue-400
        buttonPrimary: 'rgb(59, 130, 246)', // blue-500
        buttonPrimaryHover: 'rgb(37, 99, 235)', // blue-600
        buttonSecondary: 'transparent',
        buttonSecondaryHover: 'rgba(87, 83, 78, 0.2)', // stone-600 with opacity
        dividerColor: 'rgba(75, 85, 99, 0.3)', // gray-700 with opacity
        shadowColor: 'rgba(0, 0, 0, 0.25)'
      };
    } else {
      return {
        cardBg: '#ffffff',
        borderColor: 'rgba(214, 211, 209, 0.5)', // stone-300 with opacity
        inputBg: '#ffffff',
        inputBorder: 'rgba(214, 211, 209, 0.8)', // stone-300 with opacity
        hoverBorder: 'rgba(168, 162, 158, 0.8)', // stone-400 with opacity
        focusBorder: 'rgb(37, 99, 235)', // blue-600
        buttonPrimary: 'rgb(37, 99, 235)', // blue-600
        buttonPrimaryHover: 'rgb(29, 78, 216)', // blue-700
        buttonSecondary: 'transparent',
        buttonSecondaryHover: 'rgba(214, 211, 209, 0.3)', // stone-300 with opacity
        dividerColor: 'rgba(214, 211, 209, 0.8)', // stone-300 with opacity
        shadowColor: 'rgba(120, 113, 108, 0.15)' // stone-500 with opacity
      };
    }
  };
  
  const colors = getThemeColors();
  
  // 如果是编辑模式，加载现有实例数据
  useEffect(() => {
    if (instance) {
      // 🎯 确保config和app_metadata结构完整
      const existingConfig = instance.config || {};
      const existingAppMetadata = existingConfig.app_metadata || {};
      
      const updatedFormData = {
        // 先复制原始实例数据
        ...instance,
        // 确保必要字段存在
        provider_id: providerId,
        instance_id: instance.instance_id || '',
        name: instance.name || '',
        // 如果 display_name 不存在，使用 name 或空字符串
        display_name: instance.display_name || instance.name || '',
        // 如果 description 不存在，使用空字符串
        description: instance.description || '',
        // 如果 is_default 不存在，使用 false
        is_default: Boolean(instance.is_default),
        api_path: instance.api_path || '',
        // 确保config结构完整
        config: {
          ...existingConfig,
          app_metadata: {
            app_type: existingAppMetadata.app_type || 'model',
            is_common_model: Boolean(existingAppMetadata.is_common_model),
            is_marketplace_app: Boolean(existingAppMetadata.is_marketplace_app),
            tags: Array.isArray(existingAppMetadata.tags) ? existingAppMetadata.tags : [],
            model_type: existingAppMetadata.model_type || '',
            icon_url: existingAppMetadata.icon_url || '',
            brief_description: existingAppMetadata.brief_description || '',
            ...existingAppMetadata
          }
        }
      };
      
      setFormData(updatedFormData);
    }
  }, [instance, providerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: Partial<ServiceInstance>) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 🎯 处理app_metadata字段的变化
  const handleMetadataChange = (field: string, value: any) => {
    setFormData((prev: Partial<ServiceInstance>) => ({
      ...prev,
      config: {
        ...prev.config,
        app_metadata: {
          ...prev.config?.app_metadata,
          [field]: value
        }
      }
    }));
  };

  // 🎯 处理标签变化
  const handleTagsChange = (_: any, newTags: string[]) => {
    handleMetadataChange('tags', newTags);
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
        <Typography 
          variant="h6" 
          component="div" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            mb: 2,
            color: isDark ? 'rgb(229, 231, 235)' : 'rgb(31, 41, 55)' // gray-200 : gray-800
          }}
        >
          {title}
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: '0.5rem',
              '& .MuiAlert-icon': {
                color: isDark ? 'rgb(248, 113, 113)' : 'rgb(220, 38, 38)' // red-400 : red-600
              }
            }}
          >
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colors.inputBg,
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s',
                    '& fieldset': {
                      borderColor: colors.inputBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: colors.hoverBorder,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.focusBorder,
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    mx: 0,
                    mt: 0.5,
                    fontSize: '0.75rem',
                    opacity: 0.8
                  }
                }}
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
            <Divider sx={{ 
              my: 2.5,
              borderColor: colors.dividerColor,
              opacity: 0.8
            }} />
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              应用元数据配置
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel id="app-type-label">应用类型</InputLabel>
                <Select
                  labelId="app-type-label"
                  id="app_type"
                  value={formData.config?.app_metadata?.app_type || 'model'}
                  label="应用类型"
                  onChange={(e) => handleMetadataChange('app_type', e.target.value)}
                  sx={{
                    bgcolor: colors.inputBg,
                    borderRadius: '0.5rem',
                  }}
                >
                  <MenuItem value="model">模型切换</MenuItem>
                  <MenuItem value="marketplace">应用市场</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box>
              <TextField
                margin="normal"
                fullWidth
                id="model_type"
                label="模型类型"
                value={formData.config?.app_metadata?.model_type || ''}
                onChange={(e) => handleMetadataChange('model_type', e.target.value)}
                placeholder="例如: GPT-4, Claude-3"
                helperText="如果是模型类型应用，请指定模型"
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              id="tags"
              options={predefinedTags}
              freeSolo
              value={formData.config?.app_metadata?.tags || []}
              onChange={handleTagsChange}
              renderTags={(value: readonly string[], getTagProps) =>
                value.map((option: string, index: number) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    sx={{
                      bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.3)',
                      color: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)'
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="应用标签"
                  placeholder="选择或输入标签"
                  helperText="用于分类和搜索，可以选择预设标签或输入自定义标签"
                />
              )}
            />
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
            <Box>
              <TextField
                margin="normal"
                fullWidth
                id="icon_url"
                label="应用图标URL"
                value={formData.config?.app_metadata?.icon_url || ''}
                onChange={(e) => handleMetadataChange('icon_url', e.target.value)}
                placeholder="https://example.com/icon.png"
                helperText="可选，应用的图标地址"
              />
            </Box>
            
            <Box>
              <TextField
                margin="normal"
                fullWidth
                id="brief_description"
                label="简介"
                value={formData.config?.app_metadata?.brief_description || ''}
                onChange={(e) => handleMetadataChange('brief_description', e.target.value)}
                placeholder="简短描述应用功能"
                helperText="用于应用市场显示的简短描述"
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.config?.app_metadata?.is_common_model || false}
                  onChange={(e) => handleMetadataChange('is_common_model', e.target.checked)}
                  color="primary"
                />
              }
              label="常用模型"
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontSize: '0.875rem',
                  color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'
                } 
              }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.config?.app_metadata?.is_marketplace_app || false}
                  onChange={(e) => handleMetadataChange('is_marketplace_app', e.target.checked)}
                  color="primary"
                />
              }
              label="应用市场应用"
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontSize: '0.875rem',
                  color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'
                } 
              }}
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ 
              my: 2.5,
              borderColor: colors.dividerColor,
              opacity: 0.8
            }} />
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
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
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isProcessing}
              sx={{
                borderRadius: '0.5rem',
                py: 1,
                px: 2.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)', // gray-400/500 with opacity
                color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)', // gray-300 : gray-700
                bgcolor: colors.buttonSecondary,
                '&:hover': {
                  bgcolor: colors.buttonSecondaryHover,
                  borderColor: isDark ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)', // gray-400/500 with more opacity
                }
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isProcessing || !formData.instance_id || !formData.display_name}
              sx={{
                borderRadius: '0.5rem',
                py: 1,
                px: 2.5,
                textTransform: 'none',
                fontWeight: 500,
                bgcolor: colors.buttonPrimary,
                '&:hover': {
                  bgcolor: colors.buttonPrimaryHover,
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                  color: 'white'
                }
              }}
            >
              {isProcessing ? '保存中...' : '保存'}
              {isProcessing && <CircularProgress size={20} sx={{ ml: 1 }} color="inherit" />}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
