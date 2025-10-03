-- --- BEGIN COMMENT ---
-- 组织应用权限系统
-- 实现组织对应用的访问控制和使用配额管理
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 创建组织应用权限表
-- --- END COMMENT ---
CREATE TABLE IF NOT EXISTS org_app_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  service_instance_id UUID REFERENCES service_instances(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  permission_level TEXT DEFAULT 'full' CHECK (permission_level IN ('full', 'read_only', 'restricted')),
  usage_quota INTEGER DEFAULT NULL, -- 每月使用次数限制，NULL表示无限制
  used_count INTEGER DEFAULT 0, -- 当月已使用次数
  quota_reset_date DATE DEFAULT CURRENT_DATE, -- 配额重置日期
  settings JSONB DEFAULT '{}'::jsonb, -- 扩展配置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, service_instance_id)
);

-- --- BEGIN COMMENT ---
-- 2. 扩展service_instances表，添加可见性控制
-- --- END COMMENT ---
ALTER TABLE service_instances 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' 
CHECK (visibility IN ('public', 'org_only', 'private'));

-- --- BEGIN COMMENT ---
-- 3. 创建索引优化查询性能
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_org_app_permissions_org_id ON org_app_permissions(org_id);
CREATE INDEX IF NOT EXISTS idx_org_app_permissions_service_instance_id ON org_app_permissions(service_instance_id);
CREATE INDEX IF NOT EXISTS idx_org_app_permissions_enabled ON org_app_permissions(org_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_service_instances_visibility ON service_instances(visibility);

-- --- BEGIN COMMENT ---
-- 4. 创建RLS策略
-- --- END COMMENT ---
ALTER TABLE org_app_permissions ENABLE ROW LEVEL SECURITY;

-- 组织成员可以查看本组织的应用权限
CREATE POLICY "组织成员可以查看应用权限" ON org_app_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_app_permissions.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- 组织管理员可以管理应用权限
CREATE POLICY "组织管理员可以管理应用权限" ON org_app_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_app_permissions.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- --- BEGIN COMMENT ---
-- 5. 创建自动更新updated_at的触发器
-- --- END COMMENT ---
CREATE TRIGGER update_org_app_permissions_modtime
  BEFORE UPDATE ON org_app_permissions
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- --- BEGIN COMMENT ---
-- 6. 创建获取用户可访问应用的函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION get_user_accessible_apps(user_id UUID)
RETURNS TABLE(
  service_instance_id UUID,
  display_name TEXT,
  description TEXT,
  instance_id TEXT,
  api_path TEXT,
  visibility TEXT,
  config JSONB,
  permission_level TEXT,
  usage_quota INTEGER,
  used_count INTEGER,
  quota_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id as service_instance_id,
    si.display_name,
    si.description,
    si.instance_id,
    si.api_path,
    si.visibility,
    si.config,
    COALESCE(oap.permission_level, 'full') as permission_level,
    oap.usage_quota,
    COALESCE(oap.used_count, 0) as used_count,
    CASE 
      WHEN oap.usage_quota IS NULL THEN NULL
      ELSE GREATEST(0, oap.usage_quota - COALESCE(oap.used_count, 0))
    END as quota_remaining
  FROM service_instances si
  LEFT JOIN org_members om ON om.user_id = user_id
  LEFT JOIN org_app_permissions oap ON (
    oap.org_id = om.org_id 
    AND oap.service_instance_id = si.id 
    AND oap.is_enabled = true
  )
  WHERE 
    -- 公开应用：所有人可见
    si.visibility = 'public'
    OR 
    -- 组织应用：组织成员可见且有权限
    (si.visibility = 'org_only' AND om.org_id IS NOT NULL AND oap.id IS NOT NULL)
    OR
    -- 私有应用：暂时不处理，可扩展
    (si.visibility = 'private' AND FALSE)
  ORDER BY si.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 7. 创建检查用户应用访问权限的函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION check_user_app_permission(
  user_id UUID,
  app_instance_id TEXT
)
RETURNS TABLE(
  has_access BOOLEAN,
  permission_level TEXT,
  quota_remaining INTEGER,
  error_message TEXT
) AS $$
DECLARE
  app_record RECORD;
  org_record RECORD;
  permission_record RECORD;
BEGIN
  -- 获取应用信息
  SELECT * INTO app_record 
  FROM service_instances 
  WHERE instance_id = app_instance_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, '应用不存在';
    RETURN;
  END IF;
  
  -- 如果是公开应用，直接允许访问
  IF app_record.visibility = 'public' THEN
    RETURN QUERY SELECT true, 'full'::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  -- 获取用户组织信息
  SELECT om.*, o.name as org_name INTO org_record
  FROM org_members om
  JOIN organizations o ON o.id = om.org_id
  WHERE om.user_id = check_user_app_permission.user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, '用户未加入任何组织';
    RETURN;
  END IF;
  
  -- 检查组织应用权限
  SELECT * INTO permission_record
  FROM org_app_permissions
  WHERE org_id = org_record.org_id 
  AND service_instance_id = app_record.id
  AND is_enabled = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, '组织未授权访问此应用';
    RETURN;
  END IF;
  
  -- 检查配额
  IF permission_record.usage_quota IS NOT NULL THEN
    IF permission_record.used_count >= permission_record.usage_quota THEN
      RETURN QUERY SELECT false, permission_record.permission_level, 0, '已达到使用配额限制';
      RETURN;
    END IF;
  END IF;
  
  -- 返回访问权限
  RETURN QUERY SELECT 
    true, 
    permission_record.permission_level,
    CASE 
      WHEN permission_record.usage_quota IS NULL THEN NULL
      ELSE GREATEST(0, permission_record.usage_quota - permission_record.used_count)
    END,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 8. 创建使用计数更新函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION increment_app_usage(
  user_id UUID,
  app_instance_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  app_record RECORD;
  org_record RECORD;
BEGIN
  -- 获取应用和组织信息
  SELECT si.*, om.org_id INTO app_record
  FROM service_instances si
  CROSS JOIN org_members om
  WHERE si.instance_id = app_instance_id
  AND om.user_id = increment_app_usage.user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- 更新使用计数
  UPDATE org_app_permissions
  SET used_count = used_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE org_id = app_record.org_id
  AND service_instance_id = app_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 9. 创建配额重置函数（可以通过定时任务调用）
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE org_app_permissions
  SET used_count = 0,
      quota_reset_date = CURRENT_DATE,
      updated_at = CURRENT_TIMESTAMP
  WHERE quota_reset_date < CURRENT_DATE
  AND usage_quota IS NOT NULL;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 10. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION get_user_accessible_apps(UUID) IS '获取用户可访问的应用列表，包含权限和配额信息';
COMMENT ON FUNCTION check_user_app_permission(UUID, TEXT) IS '检查用户对特定应用的访问权限';
COMMENT ON FUNCTION increment_app_usage(UUID, TEXT) IS '增加应用使用计数';
COMMENT ON FUNCTION reset_monthly_quotas() IS '重置月度配额计数';

-- --- BEGIN COMMENT ---
-- 11. 创建示例数据（可选）
-- --- END COMMENT ---
DO $$
BEGIN
  -- 为现有组织添加一些示例应用权限
  IF EXISTS (SELECT 1 FROM organizations LIMIT 1) THEN
    INSERT INTO org_app_permissions (org_id, service_instance_id, permission_level, usage_quota)
    SELECT 
      o.id,
      si.id,
      'full',
      CASE 
        WHEN si.config->'app_metadata'->>'dify_apptype' = 'workflow' THEN 100
        WHEN si.config->'app_metadata'->>'dify_apptype' = 'text-generation' THEN 500
        ELSE NULL
      END
    FROM organizations o
    CROSS JOIN service_instances si
    WHERE NOT EXISTS (
      SELECT 1 FROM org_app_permissions oap
      WHERE oap.org_id = o.id AND oap.service_instance_id = si.id
    )
    LIMIT 10; -- 限制示例数据数量
    
    RAISE NOTICE '已为现有组织创建示例应用权限';
  END IF;
END $$; 