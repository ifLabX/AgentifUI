-- 最终清理：删除所有中文命名的旧策略，确保只保留无循环依赖的策略
-- 时间: 20250610165000

-- =====================================================
-- 彻底清理所有策略（包括中文命名的旧策略）
-- =====================================================

-- 禁用RLS
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 删除org_members表的所有策略（包括中文命名的）
DROP POLICY IF EXISTS "管理员可以添加用户到组织" ON org_members;
DROP POLICY IF EXISTS "管理员和成员可以查看组织成员" ON org_members;
DROP POLICY IF EXISTS "管理员和用户可以更新组织成员" ON org_members;
DROP POLICY IF EXISTS "管理员和用户可以管理组织成员" ON org_members;
DROP POLICY IF EXISTS "用户可以查看自己的组织成员记录" ON org_members;
DROP POLICY IF EXISTS "用户可以加入组织" ON org_members;
DROP POLICY IF EXISTS "用户可以更新自己的组织成员记录" ON org_members;
DROP POLICY IF EXISTS "用户可以离开组织" ON org_members;
DROP POLICY IF EXISTS "组织成员可以查看成员列表" ON org_members;
DROP POLICY IF EXISTS "org_members_select_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_select" ON org_members;
DROP POLICY IF EXISTS "org_members_insert" ON org_members;
DROP POLICY IF EXISTS "org_members_update" ON org_members;
DROP POLICY IF EXISTS "org_members_delete" ON org_members;

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
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_delete" ON organizations;

-- =====================================================
-- 重新启用RLS并创建全新的简单策略
-- =====================================================

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- org_members表：超级简单策略，无任何表间依赖
-- =====================================================

-- 查看策略：管理员查看所有，普通用户查看自己的记录
CREATE POLICY "simple_org_members_select" ON org_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  user_id = auth.uid()
);

-- 插入策略：只有管理员可以插入
CREATE POLICY "simple_org_members_insert" ON org_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 更新策略：管理员可以更新所有，用户可以更新自己的
CREATE POLICY "simple_org_members_update" ON org_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  user_id = auth.uid()
);

-- 删除策略：管理员可以删除所有，用户可以删除自己的
CREATE POLICY "simple_org_members_delete" ON org_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  user_id = auth.uid()
);

-- =====================================================
-- organizations表：超级简单策略，无任何表间依赖
-- =====================================================

-- 查看策略：只有管理员可以查看
CREATE POLICY "simple_organizations_select" ON organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 插入策略：只有管理员可以创建
CREATE POLICY "simple_organizations_insert" ON organizations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 更新策略：只有管理员可以更新
CREATE POLICY "simple_organizations_update" ON organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 删除策略：只有管理员可以删除
CREATE POLICY "simple_organizations_delete" ON organizations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 添加说明注释
-- =====================================================

COMMENT ON POLICY "simple_org_members_select" ON org_members IS 
'最简策略：管理员查看所有，用户查看自己的组织成员记录';

COMMENT ON POLICY "simple_org_members_insert" ON org_members IS 
'最简策略：只有管理员可以添加组织成员';

COMMENT ON POLICY "simple_org_members_update" ON org_members IS 
'最简策略：管理员更新所有，用户更新自己的记录';

COMMENT ON POLICY "simple_org_members_delete" ON org_members IS 
'最简策略：管理员删除所有，用户可退出组织';

COMMENT ON POLICY "simple_organizations_select" ON organizations IS 
'最简策略：只有管理员可以查看组织';

COMMENT ON POLICY "simple_organizations_insert" ON organizations IS 
'最简策略：只有管理员可以创建组织';

COMMENT ON POLICY "simple_organizations_update" ON organizations IS 
'最简策略：只有管理员可以更新组织';

COMMENT ON POLICY "simple_organizations_delete" ON organizations IS 
'最简策略：只有管理员可以删除组织'; 