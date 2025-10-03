-- --- BEGIN COMMENT ---
-- 启用多部门成员功能：允许用户在同一组织属于多个部门
-- 解决方案A（轻量级）：修改唯一约束，支持用户在同组织多部门
-- --- END COMMENT ---

-- 1. 删除现有的唯一约束 (org_id, user_id)
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_org_id_user_id_key;

-- 2. 添加新的唯一约束 (org_id, user_id, department)
-- 这样同一用户可以在同一组织的不同部门有多条记录
ALTER TABLE org_members ADD CONSTRAINT org_members_org_user_dept_key 
UNIQUE (org_id, user_id, department);

-- 3. 确保department字段不能为NULL（多部门场景下必须明确部门）
ALTER TABLE org_members ALTER COLUMN department SET NOT NULL;

-- 4. 为没有部门的现有记录设置默认部门
UPDATE org_members 
SET department = '默认部门' 
WHERE department IS NULL OR department = '';

-- 5. 创建查询用户所有部门的视图
CREATE OR REPLACE VIEW user_organization_departments AS
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

-- 6. 创建获取用户多部门信息的函数
CREATE OR REPLACE FUNCTION get_user_departments(p_user_id UUID)
RETURNS TABLE(
    org_id UUID,
    org_name TEXT,
    department TEXT,
    role TEXT,
    job_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        om.org_id,
        o.name as org_name,
        om.department,
        om.role,
        om.job_title
    FROM org_members om
    JOIN organizations o ON o.id = om.org_id
    WHERE om.user_id = p_user_id
    ORDER BY o.name, om.department;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 更新权限策略注释
COMMENT ON TABLE org_members IS '组织成员表 - 支持用户在同组织属于多个部门';
COMMENT ON CONSTRAINT org_members_org_user_dept_key ON org_members IS '用户在同组织同部门的唯一性约束';
COMMENT ON FUNCTION get_user_departments(UUID) IS '获取用户在所有组织的所有部门信息'; 