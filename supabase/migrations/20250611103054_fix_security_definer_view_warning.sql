-- --- BEGIN COMMENT ---
-- 修复 security_definer_view 警告
-- 明确指定视图为 SECURITY INVOKER，确保管理员仍能正常访问
-- 时间: 20250611103054
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 重新创建 user_organization_departments 视图，明确指定为 SECURITY INVOKER
-- --- END COMMENT ---
DROP VIEW IF EXISTS user_organization_departments;

CREATE VIEW user_organization_departments 
WITH (security_invoker = true) AS
SELECT 
    om.user_id,
    om.org_id,
    o.name as org_name,
    om.department,
    om.role,
    om.job_title,
    om.created_at
FROM org_members om
JOIN organizations o ON o.id = om.org_id
ORDER BY om.org_id, om.department;

-- --- BEGIN COMMENT ---
-- 2. 确保视图的权限策略正确
-- 管理员可以通过现有的 RLS 策略访问所有数据
-- 普通用户只能看到自己相关的组织数据
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 3. 验证管理员权限：管理员应该能够查询此视图获取所有组织部门信息
-- 这依赖于 org_members 和 organizations 表的现有 RLS 策略：
-- - org_members: 管理员可以查看所有记录 (simple_org_members_select)
-- - organizations: 管理员可以查看所有记录 (organizations_select_for_members)
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 4. 添加说明注释
-- --- END COMMENT ---
COMMENT ON VIEW user_organization_departments IS 
'用户组织部门视图 - 使用 SECURITY INVOKER，依赖底层表的 RLS 策略进行权限控制。管理员可查看所有数据，普通用户只能查看自己相关的组织信息。';

-- --- BEGIN COMMENT ---
-- 5. 验证函数 get_user_departments 的 SECURITY DEFINER 是必要的
-- 该函数需要 SECURITY DEFINER 来绕过 RLS 限制，为管理员提供完整的用户部门信息
-- 这是合理的，因为它有明确的参数控制和权限检查
-- --- END COMMENT ---
COMMENT ON FUNCTION get_user_departments(UUID) IS 
'获取指定用户在所有组织的部门信息 - 使用 SECURITY DEFINER 是必要的，用于管理员查询任意用户的完整部门信息'; 