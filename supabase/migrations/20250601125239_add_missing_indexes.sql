-- 添加缺失的数据库索引以优化查询性能
-- 基于当前应用的查询模式分析得出的关键索引

-- === conversations 表索引 ===
-- 用户对话列表查询（按更新时间倒序）
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON conversations(user_id, updated_at DESC) 
WHERE status = 'active';

-- 按应用ID筛选对话
CREATE INDEX IF NOT EXISTS idx_conversations_app_id 
ON conversations(app_id) 
WHERE app_id IS NOT NULL;

-- 按状态筛选对话
CREATE INDEX IF NOT EXISTS idx_conversations_status 
ON conversations(status);

-- Dify外部ID查询
CREATE INDEX IF NOT EXISTS idx_conversations_external_id 
ON conversations(external_id) 
WHERE external_id IS NOT NULL;

-- 组织对话查询
CREATE INDEX IF NOT EXISTS idx_conversations_org_id 
ON conversations(org_id);

-- === messages 表索引优化 ===
-- 对话消息按时间排序（复合索引优化）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at);

-- 用户消息查询
CREATE INDEX IF NOT EXISTS idx_messages_user_id 
ON messages(user_id);

-- Dify外部ID查询
CREATE INDEX IF NOT EXISTS idx_messages_external_id 
ON messages(external_id) 
WHERE external_id IS NOT NULL;

-- 消息状态查询
CREATE INDEX IF NOT EXISTS idx_messages_status 
ON messages(status);

-- === ai_configs 表索引 ===
-- 组织AI配置查询
CREATE INDEX IF NOT EXISTS idx_ai_configs_org_id 
ON ai_configs(org_id);

-- 按提供商查询AI配置
CREATE INDEX IF NOT EXISTS idx_ai_configs_provider 
ON ai_configs(provider);

-- 应用ID查询
CREATE INDEX IF NOT EXISTS idx_ai_configs_app_id 
ON ai_configs(app_id) 
WHERE app_id IS NOT NULL;

-- === profiles 表索引 ===
-- 用户名查询
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username) 
WHERE username IS NOT NULL;

-- 用户角色查询
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- 用户状态查询
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles(status);

-- === providers 表索引 ===
-- 提供商类型查询
CREATE INDEX IF NOT EXISTS idx_providers_type 
ON providers(type);

-- 提供商状态查询
CREATE INDEX IF NOT EXISTS idx_providers_is_active 
ON providers(is_active);

-- === 组合索引优化 ===
-- 用户在特定组织的对话
CREATE INDEX IF NOT EXISTS idx_conversations_user_org_updated 
ON conversations(user_id, org_id, updated_at DESC) 
WHERE status = 'active';

-- 特定应用的活跃对话
CREATE INDEX IF NOT EXISTS idx_conversations_app_status_updated 
ON conversations(app_id, status, updated_at DESC) 
WHERE app_id IS NOT NULL;

-- === 性能优化注释 ===
-- 这些索引基于以下查询模式：
-- 1. 用户获取对话列表（按更新时间排序）
-- 2. 按应用筛选对话
-- 3. 获取对话的消息列表（按时间排序）
-- 4. 组织管理AI配置
-- 5. Dify API集成的外部ID查询
-- 
-- 部分索引使用了WHERE条件来减少索引大小，提高性能 