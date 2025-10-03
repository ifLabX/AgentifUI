-- --- BEGIN COMMENT ---
-- 清空虚拟的部门权限数据
-- 确保权限表只包含管理员手动配置的权限，不包含任何自动生成的虚拟数据
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 清空所有现有的部门权限数据
-- 这些数据都是之前迁移文件自动生成的虚拟数据
-- --- END COMMENT ---
TRUNCATE TABLE department_app_permissions;

-- --- BEGIN COMMENT ---
-- 2. 重置序列（如果有的话）
-- --- END COMMENT ---
-- 注意：department_app_permissions 使用 UUID 主键，不需要重置序列

-- --- BEGIN COMMENT ---
-- 3. 修改同步函数，移除自动创建权限的逻辑
-- 改为只返回统计信息，不自动创建任何权限记录
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION sync_department_permissions()
RETURNS JSON AS $$
DECLARE
  total_orgs INTEGER;
  total_depts INTEGER;
  total_apps INTEGER;
  existing_count INTEGER;
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
  
  SELECT COUNT(*) INTO total_apps FROM service_instances;
  
  -- 获取现有权限数量（应该为0，因为只有手动配置的权限）
  SELECT COUNT(*) INTO existing_count FROM department_app_permissions;
  
  -- 构建返回结果，不创建任何权限记录
  SELECT json_build_object(
    'created_permissions', 0,
    'existing_permissions', existing_count,
    'total_possible_combinations', total_orgs * total_depts * total_apps,
    'organizations', total_orgs,
    'departments', total_depts,
    'service_instances', total_apps,
    'message', '权限需要通过管理界面手动配置，不会自动创建'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 4. 修改为新部门创建默认权限的函数
-- 改为不自动创建任何权限，只返回提示信息
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION create_default_permissions_for_department(
  target_org_id UUID,
  target_department TEXT
)
RETURNS INTEGER AS $$
BEGIN
  -- 不自动创建任何权限，返回0
  -- 权限需要通过管理界面手动配置
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 5. 更新函数注释，明确说明不会自动创建权限
-- --- END COMMENT ---
COMMENT ON FUNCTION sync_department_permissions() IS '获取部门权限同步状态，不会自动创建权限记录，权限需要通过管理界面手动配置';
COMMENT ON FUNCTION create_default_permissions_for_department(UUID, TEXT) IS '为新部门创建默认权限的占位函数，实际不创建任何权限，需要通过管理界面手动配置';

-- --- BEGIN COMMENT ---
-- 6. 添加触发器，记录权限变更日志（可选）
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION log_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- 可以在这里添加权限变更日志逻辑
  -- 目前只是占位函数
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建权限变更触发器
DROP TRIGGER IF EXISTS department_permissions_change_log ON department_app_permissions;
CREATE TRIGGER department_permissions_change_log
  AFTER INSERT OR UPDATE OR DELETE ON department_app_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_changes();

-- --- BEGIN COMMENT ---
-- 7. 验证清理结果
-- --- END COMMENT ---
DO $$
DECLARE
  permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO permission_count FROM department_app_permissions;
  
  IF permission_count = 0 THEN
    RAISE NOTICE '✅ 部门权限表已清空，所有虚拟数据已删除';
    RAISE NOTICE '📝 权限现在需要通过管理界面手动配置';
  ELSE
    RAISE WARNING '⚠️  部门权限表仍有 % 条记录', permission_count;
  END IF;
END $$; 