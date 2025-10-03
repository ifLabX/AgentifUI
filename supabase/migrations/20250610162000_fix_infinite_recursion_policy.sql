-- 修复org_members表RLS策略无限递归问题
-- 时间: 20250610162000

-- 首先禁用RLS并删除所有现有策略
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;

-- 删除所有现有的org_members策略
DROP POLICY IF EXISTS "org_members_select_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON org_members;

-- 重新启用RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- 创建简化的策略，避免循环依赖

-- SELECT策略：管理员可以查看所有，用户只能查看自己相关的
CREATE POLICY "org_members_select_policy" ON org_members
FOR SELECT USING (
  -- 管理员可以查看所有
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 用户可以查看自己的成员记录
  user_id = auth.uid()
  OR
  -- 用户可以查看同组织的其他成员
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- INSERT策略：管理员和组织所有者可以添加成员
CREATE POLICY "org_members_insert_policy" ON org_members
FOR INSERT WITH CHECK (
  -- 管理员可以添加任何成员
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 组织所有者可以添加成员到自己的组织
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- UPDATE策略：管理员和组织所有者可以更新成员信息
CREATE POLICY "org_members_update_policy" ON org_members
FOR UPDATE USING (
  -- 管理员可以更新任何成员
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 组织所有者可以更新自己组织的成员
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- DELETE策略：管理员和组织所有者可以删除成员
CREATE POLICY "org_members_delete_policy" ON org_members
FOR DELETE USING (
  -- 管理员可以删除任何成员
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 组织所有者可以删除自己组织的成员
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
  OR
  -- 用户可以删除自己的成员记录（退出组织）
  user_id = auth.uid()
);

-- 同时修复organizations表的策略，确保没有循环依赖
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- 重新启用RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 创建简化的organizations策略
CREATE POLICY "organizations_select_policy" ON organizations
FOR SELECT USING (
  -- 管理员可以查看所有组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 组织成员可以查看自己所在的组织
  id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "organizations_insert_policy" ON organizations
FOR INSERT WITH CHECK (
  -- 只有管理员可以创建组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "organizations_update_policy" ON organizations
FOR UPDATE USING (
  -- 管理员可以更新任何组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 组织所有者可以更新自己的组织
  id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

CREATE POLICY "organizations_delete_policy" ON organizations
FOR DELETE USING (
  -- 管理员可以删除任何组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 组织所有者可以删除自己的组织
  id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
); 