/**
 * 数据库查询函数索引
 * 
 * 本文件导出所有数据库查询相关的函数
 * 使用时可以从这个文件统一导入所需的函数
 */

// 导出所有函数，按模块分组

// API密钥相关函数
export {
  getApiKeyByServiceInstance,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getDecryptedApiKey,
  incrementApiKeyUsage
} from './api-keys';

// 服务提供商相关函数
export {
  getActiveProviders,
  getProviderById,
  getProviderByName,
  createProvider,
  updateProvider,
  deleteProvider
} from './providers';

// 服务实例相关函数
export {
  getServiceInstancesByProvider,
  getDefaultServiceInstance,
  getServiceInstanceById,
  getServiceInstanceByInstanceId,
  createServiceInstance,
  updateServiceInstance,
  deleteServiceInstance
} from './service-instances';

// 用户资料相关函数
export {
  getCurrentUserProfile,
  getUserProfileById,
  getUserProfileByUsername,
  getAdminUsers,
  updateUserProfile,
  setUserAsAdmin,
  isUserAdmin
} from './profiles';

// 对话相关函数
export {
  getUserConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
  getConversationMessages,
  addMessageToConversation,
  updateMessageStatus
} from './conversations';
