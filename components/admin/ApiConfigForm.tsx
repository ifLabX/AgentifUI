import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  AlertTitle,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { useApiConfigStore } from '@lib/stores/api-config-store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-config-tabpanel-${index}`}
      aria-labelledby={`api-config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 显示 API 密钥的安全版本
function maskApiKey(key: string) {
  if (!key) return '未设置';
  if (key.length <= 8) return '******';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

export default function ApiConfigForm() {
  const { 
    providers, 
    serviceInstances, 
    apiKeys, 
    isLoading, 
    error, 
    newApiKey, 
    newApiUrl, 
    isUpdating,
    setNewApiKey,
    setNewApiUrl,
    updateDifyConfig
  } = useApiConfigStore();
  
  const [tabValue, setTabValue] = React.useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 查找 Dify 提供商
  const difyProvider = providers.find(p => p.name === 'Dify');
  
  // 查找默认服务实例
  const defaultInstance = difyProvider
    ? serviceInstances.find(si => si.provider_id === difyProvider.id && si.is_default)
    : null;
    
  // 查找默认 API 密钥
  const defaultKey = defaultInstance
    ? apiKeys.find(k => k.service_instance_id === defaultInstance.id && k.is_default)
    : null;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          API 配置管理
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          管理应用程序使用的 API 密钥和配置
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="api provider tabs">
            <Tab label="Dify" id="api-config-tab-0" aria-controls="api-config-tabpanel-0" />
            <Tab label="其他提供商" id="api-config-tab-1" aria-controls="api-config-tabpanel-1" disabled />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>错误</AlertTitle>
              {error.message}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>当前配置</AlertTitle>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>API URL:</strong> {difyProvider?.base_url || '未设置'}
              </Typography>
              <Typography variant="body2">
                <strong>API Key:</strong> {defaultKey ? maskApiKey(defaultKey.key_value) : '未设置'}
              </Typography>
            </Box>
          </Alert>

          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="apiUrl"
              label="API URL"
              name="apiUrl"
              placeholder="例如: https://api.dify.ai/v1"
              value={newApiUrl}
              onChange={(e) => setNewApiUrl(e.target.value)}
            />
            <TextField
              margin="normal"
              fullWidth
              name="apiKey"
              label="API Key"
              type="password"
              id="apiKey"
              placeholder="输入新的 API Key"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              helperText="API 密钥将在存储前加密，只有应用程序可以解密。"
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={updateDifyConfig}
              disabled={isUpdating || (!newApiKey && !newApiUrl)}
            >
              {isUpdating ? '更新中...' : '更新配置'}
              {isUpdating && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
}
