-- --- BEGIN COMMENT ---
-- 修复org_members表的RLS策略，允许管理员添加任何用户到组织
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 删除现有的org_members插入策略
-- --- END COMMENT ---
DROP POLICY IF EXISTS "用户可以加入组织" ON org_members;

-- --- BEGIN COMMENT ---
-- 2. 创建新的插入策略：管理员可以添加任何用户，用户只能添加自己
-- --- END COMMENT ---
CREATE POLICY "管理员可以添加用户到组织" ON org_members
  FOR INSERT WITH CHECK (
    -- 系统管理员可以添加任何用户到组织
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 普通用户只能添加自己
    user_id = auth.uid()
  );

-- --- BEGIN COMMENT ---
-- 3. 修复查看策略：管理员可以查看所有组织成员记录
-- --- END COMMENT ---
DROP POLICY IF EXISTS "用户可以查看自己的组织成员记录" ON org_members;

CREATE POLICY "管理员和成员可以查看组织成员" ON org_members
  FOR SELECT USING (
    -- 系统管理员可以查看所有组织成员
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 用户可以查看自己的记录
    user_id = auth.uid()
    OR
    -- 组织成员可以查看同组织的其他成员
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
    )
  );

-- --- BEGIN COMMENT ---
-- 4. 修复更新策略：管理员可以更新任何成员记录
-- --- END COMMENT ---
DROP POLICY IF EXISTS "用户可以更新自己的组织成员记录" ON org_members;

CREATE POLICY "管理员和用户可以更新组织成员记录" ON org_members
  FOR UPDATE USING (
    -- 系统管理员可以更新任何成员记录
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 用户只能更新自己的记录
    user_id = auth.uid()
    OR
    -- 组织管理员可以更新本组织的成员记录
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- --- BEGIN COMMENT ---
-- 5. 修复删除策略：管理员可以删除任何成员记录
-- --- END COMMENT ---
DROP POLICY IF EXISTS "用户可以离开组织" ON org_members;

CREATE POLICY "管理员和用户可以管理组织成员" ON org_members
  FOR DELETE USING (
    -- 系统管理员可以删除任何成员记录
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- 用户可以删除自己的记录（离开组织）
    user_id = auth.uid()
    OR
    -- 组织管理员可以删除本组织的成员记录
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- --- BEGIN COMMENT ---
-- 6. 添加注释说明
-- --- END COMMENT ---
COMMENT ON POLICY "管理员可以添加用户到组织" ON org_members IS 
'系统管理员可以添加任何用户到组织，普通用户只能添加自己';

COMMENT ON POLICY "管理员和成员可以查看组织成员" ON org_members IS 
'管理员可以查看所有成员，组织成员可以查看同组织的其他成员';

COMMENT ON POLICY "管理员和用户可以更新组织成员记录" ON org_members IS 
'管理员和组织管理员可以更新成员记录，用户只能更新自己的记录';

COMMENT ON POLICY "管理员和用户可以管理组织成员" ON org_members IS 
'管理员和组织管理员可以删除成员，用户可以删除自己的记录'; 