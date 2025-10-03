-- 清理剩余的中文策略并修复部门创建问题
-- 时间: 20250610166000

-- 清理剩余的中文策略
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "管理员和用户可以更新组织成员记录" ON org_members;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY; 