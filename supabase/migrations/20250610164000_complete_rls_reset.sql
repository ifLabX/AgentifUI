-- 完全重置RLS策略，彻底解决循环依赖问题
-- 时间: 20250610164000

-- =====================================================
-- 第一步：彻底清理所有现有策略
-- =====================================================

-- 禁用RLS
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 删除org_members表的所有策略
DROP POLICY IF EXISTS "用户可以查看自己的组织成员记录" ON org_members;
DROP POLICY IF EXISTS "用户可以加入组织" ON org_members;
DROP POLICY IF EXISTS "用户可以更新自己的组织成员记录" ON org_members;
DROP POLICY IF EXISTS "用户可以离开组织" ON org_members;
DROP POLICY IF EXISTS "org_members_select_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON org_members;

-- 删除organizations表的所有策略
DROP POLICY IF EXISTS "组织成员可以查看组织" ON organizations;
DROP POLICY IF EXISTS "组织管理员可以更新组织" ON organizations;
DROP POLICY IF EXISTS "认证用户可以创建组织" ON organizations;
DROP POLICY IF EXISTS "组织所有者可以删除组织" ON organizations;
DROP POLICY IF EXISTS "管理员可以创建组织" ON organizations;
DROP POLICY IF EXISTS "管理员和组织成员可以查看组织" ON organizations;
DROP POLICY IF EXISTS "管理员和组织管理员可以更新组织" ON organizations;
DROP POLICY IF EXISTS "管理员和组织所有者可以删除组织" ON organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- =====================================================
-- 第二步：创建完全独立的策略（无循环依赖）
-- =====================================================

-- 重新启用RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- org_members表策略：只依赖profiles表，不依赖organizations表
-- =====================================================

-- 查看权限：管理员查看所有，用户查看自己的记录
CREATE POLICY "org_members_select" ON org_members
FOR SELECT USING (
  -- 管理员可以查看所有记录
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 用户可以查看自己的记录
  user_id = auth.uid()
);

-- 插入权限：管理员可以插入任何记录
CREATE POLICY "org_members_insert" ON org_members
FOR INSERT WITH CHECK (
  -- 管理员可以插入任何记录
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 更新权限：管理员可以更新任何记录，用户可以更新自己的记录
CREATE POLICY "org_members_update" ON org_members
FOR UPDATE USING (
  -- 管理员可以更新任何记录
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 用户可以更新自己的记录
  user_id = auth.uid()
);

-- 删除权限：管理员可以删除任何记录，用户可以删除自己的记录
CREATE POLICY "org_members_delete" ON org_members
FOR DELETE USING (
  -- 管理员可以删除任何记录
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- 用户可以删除自己的记录
  user_id = auth.uid()
);

-- =====================================================
-- organizations表策略：只依赖profiles表，不依赖org_members表
-- =====================================================

-- 查看权限：管理员查看所有组织
CREATE POLICY "organizations_select" ON organizations
FOR SELECT USING (
  -- 管理员可以查看所有组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 插入权限：只有管理员可以创建组织
CREATE POLICY "organizations_insert" ON organizations
FOR INSERT WITH CHECK (
  -- 只有管理员可以创建组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 更新权限：只有管理员可以更新组织
CREATE POLICY "organizations_update" ON organizations
FOR UPDATE USING (
  -- 只有管理员可以更新组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 删除权限：只有管理员可以删除组织
CREATE POLICY "organizations_delete" ON organizations
FOR DELETE USING (
  -- 只有管理员可以删除组织
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 添加说明注释
-- =====================================================

COMMENT ON POLICY "org_members_select" ON org_members IS 
'安全策略：管理员可查看所有，用户只能查看自己的组织成员记录';

COMMENT ON POLICY "org_members_insert" ON org_members IS 
'安全策略：只有管理员可以添加组织成员';

COMMENT ON POLICY "org_members_update" ON org_members IS 
'安全策略：管理员可更新所有，用户只能更新自己的记录';

COMMENT ON POLICY "org_members_delete" ON org_members IS 
'安全策略：管理员可删除所有，用户可以退出组织（删除自己的记录）';

COMMENT ON POLICY "organizations_select" ON organizations IS 
'安全策略：只有管理员可以查看组织信息';

COMMENT ON POLICY "organizations_insert" ON organizations IS 
'安全策略：只有管理员可以创建组织';

COMMENT ON POLICY "organizations_update" ON organizations IS 
'安全策略：只有管理员可以更新组织信息';

COMMENT ON POLICY "organizations_delete" ON organizations IS 
'安全策略：只有管理员可以删除组织'; 