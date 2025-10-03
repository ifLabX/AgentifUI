-- 修复organizations表的查看策略，让普通用户也能查看自己所属的组织
-- 时间: 20250612000000

-- 删除旧的restrictive策略
DROP POLICY IF EXISTS "simple_organizations_select" ON organizations;

-- 创建新的策略：管理员可以查看所有组织，普通用户可以查看自己所属的组织
CREATE POLICY "organizations_select_for_members" ON organizations
FOR SELECT USING (
  -- 管理员可以查看所有组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 普通用户可以查看自己所属的组织
  EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = organizations.id 
    AND org_members.user_id = auth.uid()
  )
);

-- 添加说明注释
COMMENT ON POLICY "organizations_select_for_members" ON organizations IS 
'允许管理员查看所有组织，普通用户查看自己所属的组织'; 