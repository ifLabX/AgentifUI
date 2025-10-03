-- --- BEGIN COMMENT ---
-- 修复组织创建的RLS策略问题
-- 确保管理员可以创建组织
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 删除可能存在的冲突策略
-- --- END COMMENT ---
DROP POLICY IF EXISTS "认证用户可以创建组织" ON organizations;
DROP POLICY IF EXISTS "管理员可以创建组织" ON organizations;

-- --- BEGIN COMMENT ---
-- 2. 创建正确的组织创建策略：只有管理员可以创建组织
-- --- END COMMENT ---
CREATE POLICY "管理员可以创建组织" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- --- BEGIN COMMENT ---
-- 3. 确保组织查看策略允许管理员查看所有组织
-- --- END COMMENT ---
DROP POLICY IF EXISTS "组织成员可以查看组织" ON organizations;

CREATE POLICY "管理员和组织成员可以查看组织" ON organizations
  FOR SELECT USING (
    -- 管理员可以查看所有组织
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 组织成员可以查看自己的组织
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
    )
  );

-- --- BEGIN COMMENT ---
-- 4. 确保组织更新策略
-- --- END COMMENT ---
DROP POLICY IF EXISTS "组织管理员可以更新组织" ON organizations;

CREATE POLICY "管理员和组织管理员可以更新组织" ON organizations
  FOR UPDATE USING (
    -- 系统管理员可以更新所有组织
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 组织管理员可以更新自己的组织
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- --- BEGIN COMMENT ---
-- 5. 确保组织删除策略
-- --- END COMMENT ---
DROP POLICY IF EXISTS "组织所有者可以删除组织" ON organizations;

CREATE POLICY "管理员和组织所有者可以删除组织" ON organizations
  FOR DELETE USING (
    -- 系统管理员可以删除所有组织
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 组织所有者可以删除自己的组织
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
    )
  );

-- --- BEGIN COMMENT ---
-- 6. 添加注释说明
-- --- END COMMENT ---
COMMENT ON POLICY "管理员可以创建组织" ON organizations IS 
'只有系统管理员可以创建组织，确保组织管理的安全性';

COMMENT ON POLICY "管理员和组织成员可以查看组织" ON organizations IS 
'管理员可以查看所有组织，组织成员只能查看自己所属的组织';

COMMENT ON POLICY "管理员和组织管理员可以更新组织" ON organizations IS 
'系统管理员可以更新所有组织，组织管理员只能更新自己的组织';

COMMENT ON POLICY "管理员和组织所有者可以删除组织" ON organizations IS 
'系统管理员可以删除所有组织，组织所有者只能删除自己的组织'; 