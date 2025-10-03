-- --- BEGIN COMMENT ---
-- 激活组织功能：扩展org_members表字段，移除conversations冗余字段
-- 将现有用户账户与组织体系打通，清理无用的org_id关联
-- --- END COMMENT ---

-- 1. 扩展org_members表，添加部门和职位信息
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS job_title TEXT;

-- 2. 移除conversations表中无用的org_id字段
-- conversations是个人对话历史，不应该属于组织
-- 用户的组织信息已经通过profiles -> org_members关联
ALTER TABLE conversations DROP COLUMN IF EXISTS org_id;

-- 3. 创建用于设置组织数据的函数
CREATE OR REPLACE FUNCTION setup_test_organizations(admin_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  company_org_id UUID := gen_random_uuid();
  team_org_id UUID := gen_random_uuid();
BEGIN
  -- 创建企业和开发团队组织
  INSERT INTO organizations (id, name, logo_url, settings, created_at, updated_at) VALUES 
    (company_org_id, 'ifLabX', NULL, '{"type": "company", "description": "ifLabX企业"}', NOW(), NOW()),
    (team_org_id, 'AgentifUI开发团队', NULL, '{"type": "team", "description": "AgentifUI产品开发团队"}', NOW(), NOW());

  -- 将指定用户加入组织
  INSERT INTO org_members (org_id, user_id, role, department, job_title, created_at, updated_at) VALUES 
    (company_org_id, admin_user_id, 'owner', '技术部', '创始人', NOW(), NOW()),
    (team_org_id, admin_user_id, 'owner', '开发组', '项目负责人', NOW(), NOW());

  RETURN '组织设置完成：ifLabX企业 + AgentifUI开发团队';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON org_members(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_department ON org_members(department) WHERE department IS NOT NULL;

-- 5. 注释说明使用方法
COMMENT ON FUNCTION setup_test_organizations(UUID) IS '
设置测试组织数据的函数。
使用方法：在Supabase控制台执行：
SELECT setup_test_organizations(''你的user_id'');
'; 