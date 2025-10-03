-- 彻底修复org_members表RLS策略无限递归问题
-- 时间: 20250610163000
-- 解决方案：避免策略中查询自己表，使用更简单的权限检查

-- 首先禁用RLS并删除所有现有策略
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;

-- 删除所有现有的org_members策略
DROP POLICY IF EXISTS "org_members_select_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON org_members;

-- 重新启用RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- 创建超级简化的策略，避免所有自引用

-- SELECT策略：管理员查看所有，用户只看自己的记录
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
);

-- INSERT策略：只有管理员可以添加成员
CREATE POLICY "org_members_insert_policy" ON org_members
FOR INSERT WITH CHECK (
  -- 只有管理员可以添加成员
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- UPDATE策略：管理员可以更新所有，用户只能更新自己的记录
CREATE POLICY "org_members_update_policy" ON org_members
FOR UPDATE USING (
  -- 管理员可以更新任何成员
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 用户可以更新自己的记录
  user_id = auth.uid()
);

-- DELETE策略：管理员可以删除所有，用户可以删除自己的记录
CREATE POLICY "org_members_delete_policy" ON org_members
FOR DELETE USING (
  -- 管理员可以删除任何成员
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 用户可以删除自己的成员记录（退出组织）
  user_id = auth.uid()
);

-- 修复organizations表的策略，同样避免循环引用
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
);

CREATE POLICY "organizations_delete_policy" ON organizations
FOR DELETE USING (
  -- 管理员可以删除任何组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
); 