-- --- BEGIN COMMENT ---
-- 部门权限管理函数
-- 提供数据同步、状态查询和批量管理功能
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 获取组织部门信息函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION get_org_department_info()
RETURNS TABLE(
  org_id UUID,
  org_name TEXT,
  department TEXT,
  member_count BIGINT,
  has_permissions BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as org_id,
    o.name as org_name,
    om.department,
    COUNT(om.id) as member_count,
    EXISTS(
      SELECT 1 FROM department_app_permissions dap 
      WHERE dap.org_id = o.id 
      AND dap.department = om.department
    ) as has_permissions
  FROM organizations o
  JOIN org_members om ON om.org_id = o.id
  WHERE om.department IS NOT NULL
  GROUP BY o.id, o.name, om.department
  ORDER BY o.name, om.department;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 2. 同步部门权限数据函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION sync_department_permissions()
RETURNS JSON AS $$
DECLARE
  created_count INTEGER := 0;
  existing_count INTEGER := 0;
  total_orgs INTEGER;
  total_depts INTEGER;
  total_apps INTEGER;
  result JSON;
BEGIN
  -- 获取统计信息
  SELECT COUNT(DISTINCT o.id) INTO total_orgs 
  FROM organizations o 
  JOIN org_members om ON om.org_id = o.id 
  WHERE om.department IS NOT NULL;
  
  SELECT COUNT(DISTINCT om.department) INTO total_depts 
  FROM org_members om 
  WHERE om.department IS NOT NULL;
  
  SELECT COUNT(*) INTO total_apps FROM service_instances;
  
  -- 获取现有权限数量
  SELECT COUNT(*) INTO existing_count FROM department_app_permissions;
  
  -- 为每个组织的每个部门创建应用权限
  INSERT INTO department_app_permissions (org_id, department, service_instance_id, permission_level, usage_quota, is_enabled)
  SELECT DISTINCT
    om.org_id,
    om.department,
    si.id,
    'full'::TEXT,
    CASE 
      WHEN si.config->'app_metadata'->>'dify_apptype' = 'workflow' THEN 100
      WHEN si.config->'app_metadata'->>'dify_apptype' = 'text-generation' THEN 500
      ELSE NULL
    END,
    true
  FROM org_members om
  CROSS JOIN service_instances si
  WHERE om.department IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM department_app_permissions dap
    WHERE dap.org_id = om.org_id 
    AND dap.department = om.department 
    AND dap.service_instance_id = si.id
  );
  
  GET DIAGNOSTICS created_count = ROW_COUNT;
  
  -- 构建返回结果
  SELECT json_build_object(
    'created_permissions', created_count,
    'existing_permissions', existing_count,
    'total_combinations', total_orgs * total_depts * total_apps,
    'organizations', total_orgs,
    'departments', total_depts,
    'service_instances', total_apps
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 3. 获取权限同步状态函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION get_permission_sync_status()
RETURNS JSON AS $$
DECLARE
  total_orgs INTEGER;
  total_depts INTEGER;
  total_apps INTEGER;
  total_permissions INTEGER;
  expected_permissions INTEGER;
  coverage_percentage NUMERIC;
  result JSON;
BEGIN
  -- 获取组织数量（有部门的）
  SELECT COUNT(DISTINCT o.id) INTO total_orgs 
  FROM organizations o 
  JOIN org_members om ON om.org_id = o.id 
  WHERE om.department IS NOT NULL;
  
  -- 获取部门数量
  SELECT COUNT(DISTINCT om.department) INTO total_depts 
  FROM org_members om 
  WHERE om.department IS NOT NULL;
  
  -- 获取应用数量
  SELECT COUNT(*) INTO total_apps FROM service_instances;
  
  -- 获取现有权限数量
  SELECT COUNT(*) INTO total_permissions FROM department_app_permissions;
  
  -- 计算期望的权限数量（每个组织×部门×应用的组合）
  SELECT COUNT(*) INTO expected_permissions
  FROM (
    SELECT DISTINCT om.org_id, om.department
    FROM org_members om 
    WHERE om.department IS NOT NULL
  ) dept_combos
  CROSS JOIN service_instances si;
  
  -- 计算覆盖率
  IF expected_permissions > 0 THEN
    coverage_percentage := (total_permissions::NUMERIC / expected_permissions::NUMERIC) * 100;
  ELSE
    coverage_percentage := 0;
  END IF;
  
  -- 构建返回结果
  SELECT json_build_object(
    'total_orgs', total_orgs,
    'total_departments', total_depts,
    'total_apps', total_apps,
    'total_permissions', total_permissions,
    'coverage_percentage', ROUND(coverage_percentage, 2)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 4. 批量更新部门权限函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION batch_update_department_permissions(updates JSONB)
RETURNS INTEGER AS $$
DECLARE
  update_record JSONB;
  updated_count INTEGER := 0;
BEGIN
  -- 遍历更新数组
  FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    -- 更新或插入权限记录
    INSERT INTO department_app_permissions (
      org_id, 
      department, 
      service_instance_id, 
      permission_level, 
      usage_quota, 
      is_enabled
    )
    VALUES (
      (update_record->>'org_id')::UUID,
      update_record->>'department',
      (update_record->>'service_instance_id')::UUID,
      update_record->>'permission_level',
      CASE 
        WHEN update_record->>'usage_quota' = 'null' OR update_record->>'usage_quota' IS NULL 
        THEN NULL 
        ELSE (update_record->>'usage_quota')::INTEGER 
      END,
      (update_record->>'is_enabled')::BOOLEAN
    )
    ON CONFLICT (org_id, department, service_instance_id)
    DO UPDATE SET
      permission_level = EXCLUDED.permission_level,
      usage_quota = EXCLUDED.usage_quota,
      is_enabled = EXCLUDED.is_enabled,
      updated_at = CURRENT_TIMESTAMP;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 5. 为新部门创建默认权限函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION create_default_permissions_for_department(
  target_org_id UUID,
  target_department TEXT
)
RETURNS INTEGER AS $$
DECLARE
  created_count INTEGER;
BEGIN
  -- 为指定部门创建所有应用的默认权限
  INSERT INTO department_app_permissions (org_id, department, service_instance_id, permission_level, usage_quota, is_enabled)
  SELECT 
    target_org_id,
    target_department,
    si.id,
    'full'::TEXT,
    CASE 
      WHEN si.config->'app_metadata'->>'dify_apptype' = 'workflow' THEN 100
      WHEN si.config->'app_metadata'->>'dify_apptype' = 'text-generation' THEN 500
      ELSE NULL
    END,
    true
  FROM service_instances si
  WHERE NOT EXISTS (
    SELECT 1 FROM department_app_permissions dap
    WHERE dap.org_id = target_org_id
    AND dap.department = target_department
    AND dap.service_instance_id = si.id
  );
  
  GET DIAGNOSTICS created_count = ROW_COUNT;
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 6. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION get_org_department_info() IS '获取所有组织和部门的信息，包括成员数量和权限状态';
COMMENT ON FUNCTION sync_department_permissions() IS '同步部门权限数据，为所有组织部门创建应用权限';
COMMENT ON FUNCTION get_permission_sync_status() IS '获取权限同步状态和覆盖率统计';
COMMENT ON FUNCTION batch_update_department_permissions(JSONB) IS '批量更新部门权限配置';
COMMENT ON FUNCTION create_default_permissions_for_department(UUID, TEXT) IS '为新部门创建默认应用权限';