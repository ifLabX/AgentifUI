-- 创建自定义类型
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'error');

-- 扩展 auth.users 表的 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'user'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  status account_status DEFAULT 'active'::account_status
);

-- 创建 organizations 表
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建 org_members 表
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role org_member_role DEFAULT 'member'::org_member_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, user_id)
);

-- 创建 ai_configs 表
CREATE TABLE IF NOT EXISTS ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- dify, openai, anthropic 等
  app_id TEXT, -- Dify 应用ID
  api_key TEXT NOT NULL, -- 加密存储
  api_url TEXT NOT NULL, -- API URL
  settings JSONB DEFAULT '{}'::jsonb, -- 其他配置参数
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建 conversations 表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ai_config_id UUID REFERENCES ai_configs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

-- 创建 messages 表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 如果是AI消息，则为null
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status message_status DEFAULT 'sent'::message_status
);

-- 创建 api_logs 表
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request JSONB DEFAULT '{}'::jsonb,
  response JSONB DEFAULT '{}'::jsonb,
  status_code INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建 user_preferences 表
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'zh-CN',
  notification_settings JSONB DEFAULT '{}'::jsonb,
  ai_preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 设置行级安全性策略 (RLS)
-- 为所有表启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 为profiles表创建策略
CREATE POLICY "用户可以查看自己的资料" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 为organizations表创建策略
CREATE POLICY "组织成员可以查看组织" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "组织管理员可以更新组织" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- 为org_members表创建策略
CREATE POLICY "组织成员可以查看成员列表" ON org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members AS om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
    )
  );

-- 为conversations表创建策略
CREATE POLICY "用户可以查看自己的对话" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "用户可以更新自己的对话" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "用户可以删除自己的对话" ON conversations
  FOR DELETE USING (user_id = auth.uid());

-- 为messages表创建策略
CREATE POLICY "用户可以查看自己对话的消息" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- 为user_preferences表创建策略
CREATE POLICY "用户可以查看自己的偏好设置" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "用户可以更新自己的偏好设置" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- 创建触发器，在用户创建时自动创建profiles记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    CONCAT('user_', SUBSTRING(CAST(new.id AS TEXT), 1, 8)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 创建自动更新updated_at的触发器函数
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_organizations_modtime
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_org_members_modtime
  BEFORE UPDATE ON org_members
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_ai_configs_modtime
  BEFORE UPDATE ON ai_configs
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_conversations_modtime
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column(); 