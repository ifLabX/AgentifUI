-- 简化部门权限设计
-- 删除混淆的permission_level字段，保留核心功能

-- 1. 删除permission_level字段（造成混淆的根源）
ALTER TABLE department_app_permissions 
DROP COLUMN IF EXISTS permission_level;

-- 2. 先删除现有函数，避免返回类型冲突
DROP FUNCTION IF EXISTS get_user_accessible_apps(UUID);
DROP FUNCTION IF EXISTS check_user_app_permission(UUID, UUID);
DROP FUNCTION IF EXISTS increment_app_usage(UUID, UUID, INTEGER);

-- 3. 重新创建函数，移除permission_level逻辑
CREATE OR REPLACE FUNCTION get_user_accessible_apps(p_user_id UUID)
RETURNS TABLE (
  service_instance_id UUID,
  display_name TEXT,
  description TEXT,
  instance_id TEXT,
  api_path TEXT,
  visibility TEXT,
  config JSONB,
  usage_quota INTEGER,
  used_count INTEGER,
  quota_remaining INTEGER,
  department TEXT,
  org_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id as service_instance_id,
    si.display_name,
    si.description,
    si.instance_id,
    si.api_path,
    si.visibility::TEXT,
    si.config,
    dap.usage_quota,
    dap.used_count,
    CASE 
      WHEN dap.usage_quota IS NULL THEN NULL
      ELSE GREATEST(0, dap.usage_quota - dap.used_count)
    END as quota_remaining,
    om.department,
    o.name as org_name
  FROM service_instances si
  LEFT JOIN department_app_permissions dap ON si.id = dap.service_instance_id
  LEFT JOIN org_members om ON (dap.org_id = om.org_id AND dap.department = om.department AND om.user_id = p_user_id)
  LEFT JOIN organizations o ON om.org_id = o.id
  WHERE 
    -- 公开应用：所有人可见
    si.visibility = 'public'
    OR 
    -- 组织应用：需要部门权限且已启用
    (si.visibility = 'org_only' AND dap.is_enabled = true AND om.user_id = p_user_id)
    OR
    -- 私有应用：只有管理员可见
    (si.visibility = 'private' AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = p_user_id AND p.role = 'admin'
    ))
  ORDER BY si.display_name;
END;
$$;

-- 4. 重新创建权限检查函数
CREATE OR REPLACE FUNCTION check_user_app_permission(
  p_user_id UUID,
  p_service_instance_id UUID
)
RETURNS TABLE (
  has_access BOOLEAN,
  quota_remaining INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visibility TEXT;
  v_user_role TEXT;
  v_quota INTEGER;
  v_used_count INTEGER;
BEGIN
  -- 获取应用可见性
  SELECT visibility INTO v_visibility
  FROM service_instances 
  WHERE id = p_service_instance_id;
  
  IF v_visibility IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, '应用不存在'::TEXT;
    RETURN;
  END IF;
  
  -- 获取用户角色
  SELECT role INTO v_user_role
  FROM profiles 
  WHERE id = p_user_id;
  
  -- 公开应用：所有人可访问
  IF v_visibility = 'public' THEN
    RETURN QUERY SELECT true, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  -- 私有应用：只有管理员可访问
  IF v_visibility = 'private' THEN
    IF v_user_role = 'admin' THEN
      RETURN QUERY SELECT true, NULL::INTEGER, NULL::TEXT;
    ELSE
      RETURN QUERY SELECT false, NULL::INTEGER, '无权限访问此应用'::TEXT;
    END IF;
    RETURN;
  END IF;
  
  -- 组织应用：检查部门权限
  IF v_visibility = 'org_only' THEN
    SELECT dap.usage_quota, dap.used_count
    INTO v_quota, v_used_count
    FROM department_app_permissions dap
    JOIN org_members om ON (dap.org_id = om.org_id AND dap.department = om.department)
    WHERE dap.service_instance_id = p_service_instance_id
      AND om.user_id = p_user_id
      AND dap.is_enabled = true;
    
    IF v_quota IS NULL AND v_used_count IS NULL THEN
      RETURN QUERY SELECT false, NULL::INTEGER, '您的部门无权限访问此应用'::TEXT;
      RETURN;
    END IF;
    
    -- 检查配额
    IF v_quota IS NOT NULL AND v_used_count >= v_quota THEN
      RETURN QUERY SELECT false, 0, '部门配额已用完'::TEXT;
      RETURN;
    END IF;
    
    -- 有权限且配额充足
    RETURN QUERY SELECT 
      true, 
      CASE 
        WHEN v_quota IS NULL THEN NULL
        ELSE GREATEST(0, v_quota - v_used_count)
      END,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- 未知可见性类型
  RETURN QUERY SELECT false, NULL::INTEGER, '未知的应用可见性类型'::TEXT;
END;
$$;

-- 5. 重新创建使用量增加函数
CREATE OR REPLACE FUNCTION increment_app_usage(
  p_user_id UUID,
  p_service_instance_id UUID,
  p_increment INTEGER DEFAULT 1
)
RETURNS TABLE (
  success BOOLEAN,
  new_used_count INTEGER,
  quota_remaining INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visibility TEXT;
  v_current_count INTEGER;
  v_quota INTEGER;
  v_new_count INTEGER;
BEGIN
  -- 获取应用可见性
  SELECT visibility INTO v_visibility
  FROM service_instances 
  WHERE id = p_service_instance_id;
  
  -- 公开和私有应用不需要记录使用量
  IF v_visibility IN ('public', 'private') THEN
    RETURN QUERY SELECT true, 0, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  -- 组织应用：更新部门使用量
  IF v_visibility = 'org_only' THEN
    UPDATE department_app_permissions dap
    SET used_count = used_count + p_increment,
        updated_at = NOW()
    FROM org_members om
    WHERE dap.service_instance_id = p_service_instance_id
      AND dap.org_id = om.org_id
      AND dap.department = om.department
      AND om.user_id = p_user_id
      AND dap.is_enabled = true
    RETURNING dap.used_count, dap.usage_quota INTO v_new_count, v_quota;
    
    IF v_new_count IS NULL THEN
      RETURN QUERY SELECT false, 0, NULL::INTEGER, '无权限或部门未启用此应用'::TEXT;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT 
      true,
      v_new_count,
      CASE 
        WHEN v_quota IS NULL THEN NULL
        ELSE GREATEST(0, v_quota - v_new_count)
      END,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- 未知可见性类型
  RETURN QUERY SELECT false, 0, NULL::INTEGER, '未知的应用可见性类型'::TEXT;
END;
$$;

-- 6. 更新TypeScript类型定义注释
COMMENT ON TABLE department_app_permissions IS '部门应用权限表 - 简化版本，只保留核心字段：is_enabled（是否启用）和usage_quota（使用配额）';
COMMENT ON COLUMN department_app_permissions.is_enabled IS '是否启用：控制该部门是否可以访问此应用';
COMMENT ON COLUMN department_app_permissions.usage_quota IS '使用配额：该部门每月可使用次数，NULL表示无限制';
COMMENT ON COLUMN department_app_permissions.used_count IS '已使用次数：当前月份已使用的次数';

-- 7. 记录迁移日志
DO $$
BEGIN
  RAISE NOTICE '✅ 部门权限简化完成：';
  RAISE NOTICE '   - 删除了混淆的 permission_level 字段';
  RAISE NOTICE '   - 保留了核心的 is_enabled 和 usage_quota 字段';
  RAISE NOTICE '   - 更新了所有相关数据库函数';
  RAISE NOTICE '   - 权限逻辑简化为：public(全员) | org_only(部门启用) | private(管理员)';
END $$; 