-- --- BEGIN COMMENT ---
-- 重新设计权限系统：改为部门级权限控制
-- 更符合实际业务需求：不同部门访问不同应用
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 删除原有的组织级权限表
-- --- END COMMENT ---
DROP TABLE IF EXISTS org_app_permissions CASCADE;

-- --- BEGIN COMMENT ---
-- 2. 创建部门应用权限表
-- --- END COMMENT ---
CREATE TABLE IF NOT EXISTS department_app_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL, -- 部门名称
  service_instance_id UUID REFERENCES service_instances(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  permission_level TEXT DEFAULT 'full' CHECK (permission_level IN ('full', 'read_only', 'restricted')),
  usage_quota INTEGER DEFAULT NULL, -- 每月使用次数限制，NULL表示无限制
  used_count INTEGER DEFAULT 0, -- 当月已使用次数
  quota_reset_date DATE DEFAULT CURRENT_DATE, -- 配额重置日期
  settings JSONB DEFAULT '{}'::jsonb, -- 扩展配置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, department, service_instance_id) -- 一个组织的一个部门对一个应用只能有一条权限记录
);

-- --- BEGIN COMMENT ---
-- 3. 创建索引优化查询性能
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_dept_app_permissions_org_dept ON department_app_permissions(org_id, department);
CREATE INDEX IF NOT EXISTS idx_dept_app_permissions_service_instance_id ON department_app_permissions(service_instance_id);
CREATE INDEX IF NOT EXISTS idx_dept_app_permissions_enabled ON department_app_permissions(org_id, department, is_enabled);

-- --- BEGIN COMMENT ---
-- 4. 创建RLS策略
-- --- END COMMENT ---
ALTER TABLE department_app_permissions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己部门的应用权限
CREATE POLICY "用户可以查看自己部门的应用权限" ON department_app_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = department_app_permissions.org_id
      AND org_members.department = department_app_permissions.department
      AND org_members.user_id = auth.uid()
    )
  );

-- 组织管理员可以管理所有部门的应用权限
CREATE POLICY "组织管理员可以管理部门应用权限" ON department_app_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = department_app_permissions.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- --- BEGIN COMMENT ---
-- 5. 创建自动更新updated_at的触发器
-- --- END COMMENT ---
CREATE TRIGGER update_department_app_permissions_modtime
  BEFORE UPDATE ON department_app_permissions
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- --- BEGIN COMMENT ---
-- 6. 删除现有函数，然后重新创建获取用户可访问应用的函数
-- --- END COMMENT ---
DROP FUNCTION IF EXISTS get_user_accessible_apps(UUID);
DROP FUNCTION IF EXISTS check_user_app_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS increment_app_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_monthly_quotas();

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
  quota_remaining INTEGER,
  department TEXT,
  org_name TEXT
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
    COALESCE(dap.permission_level, 'full') as permission_level,
    dap.usage_quota,
    COALESCE(dap.used_count, 0) as used_count,
    CASE 
      WHEN dap.usage_quota IS NULL THEN NULL
      ELSE GREATEST(0, dap.usage_quota - COALESCE(dap.used_count, 0))
    END as quota_remaining,
    om.department,
    o.name as org_name
  FROM service_instances si
  LEFT JOIN org_members om ON om.user_id = get_user_accessible_apps.user_id
  LEFT JOIN organizations o ON o.id = om.org_id
  LEFT JOIN department_app_permissions dap ON (
    dap.org_id = om.org_id 
    AND dap.department = om.department
    AND dap.service_instance_id = si.id 
    AND dap.is_enabled = true
  )
  WHERE 
    -- 公开应用：所有人可见
    si.visibility = 'public'
    OR 
    -- 组织应用：部门成员可见且有权限
    (si.visibility = 'org_only' AND om.org_id IS NOT NULL AND dap.id IS NOT NULL)
    OR
    -- 私有应用：暂时不处理，可扩展
    (si.visibility = 'private' AND FALSE)
  ORDER BY si.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 7. 重新创建检查用户应用访问权限的函数
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
  user_record RECORD;
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
  
  -- 获取用户组织和部门信息
  SELECT om.*, o.name as org_name INTO user_record
  FROM org_members om
  JOIN organizations o ON o.id = om.org_id
  WHERE om.user_id = check_user_app_permission.user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, '用户未加入任何组织';
    RETURN;
  END IF;
  
  -- 检查部门应用权限
  SELECT * INTO permission_record
  FROM department_app_permissions
  WHERE org_id = user_record.org_id 
  AND department = user_record.department
  AND service_instance_id = app_record.id
  AND is_enabled = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::INTEGER, '部门未授权访问此应用';
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
  user_record RECORD;
BEGIN
  -- 获取应用和用户信息
  SELECT si.*, om.org_id, om.department INTO app_record
  FROM service_instances si
  CROSS JOIN org_members om
  WHERE si.instance_id = app_instance_id
  AND om.user_id = increment_app_usage.user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- 更新使用计数
  UPDATE department_app_permissions
  SET used_count = used_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE org_id = app_record.org_id
  AND department = app_record.department
  AND service_instance_id = app_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 9. 创建配额重置函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE department_app_permissions
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
-- 10. 创建示例部门权限数据
-- 只为有真实组织和部门的情况创建权限
-- --- END COMMENT ---
DO $$
DECLARE
  org_count INTEGER;
  dept_count INTEGER;
BEGIN
  -- 检查是否有组织和部门数据
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO dept_count FROM org_members WHERE department IS NOT NULL;
  
  IF org_count > 0 AND dept_count > 0 THEN
    -- 为每个组织的每个部门创建应用权限
    INSERT INTO department_app_permissions (org_id, department, service_instance_id, permission_level, usage_quota)
    SELECT DISTINCT
      om.org_id,
      om.department,
      si.id,
      'full',
      CASE 
        WHEN si.config->'app_metadata'->>'dify_apptype' = 'workflow' THEN 100
        WHEN si.config->'app_metadata'->>'dify_apptype' = 'text-generation' THEN 500
        ELSE NULL
      END
    FROM org_members om
    CROSS JOIN service_instances si
    WHERE om.department IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM department_app_permissions dap
      WHERE dap.org_id = om.org_id 
      AND dap.department = om.department 
      AND dap.service_instance_id = si.id
    );
    
    RAISE NOTICE '已为现有组织部门创建应用权限';
  ELSE
    RAISE NOTICE '没有找到组织或部门数据，跳过权限创建';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 11. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION get_user_accessible_apps(UUID) IS '获取用户可访问的应用列表，基于部门权限';
COMMENT ON FUNCTION check_user_app_permission(UUID, TEXT) IS '检查用户对特定应用的访问权限，基于部门权限';
COMMENT ON FUNCTION increment_app_usage(UUID, TEXT) IS '增加应用使用计数，基于部门权限';
COMMENT ON FUNCTION reset_monthly_quotas() IS '重置月度配额计数'; 