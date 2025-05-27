-- 修复 org_members 表的 RLS 策略递归问题
-- 
-- 问题：原策略在查询 org_members 时又递归查询自己，导致无限递归
-- 解决：简化策略，直接检查当前用户是否为表中的记录所有者或使用organizations表验证

-- 删除有问题的策略
DROP POLICY IF EXISTS "组织成员可以查看成员列表" ON org_members;

-- 创建新的策略：只允许用户查看自己的组织成员记录
-- 完全避免递归：不在 org_members 策略中查询 org_members 表
CREATE POLICY "用户可以查看自己的组织成员记录" ON org_members
  FOR SELECT USING (
    -- 用户只能查看自己的记录，避免递归查询
    user_id = auth.uid()
  );

-- 添加插入策略：暂时允许所有认证用户插入自己的记录
CREATE POLICY "用户可以加入组织" ON org_members
  FOR INSERT WITH CHECK (
    -- 用户只能插入自己的记录
    user_id = auth.uid()
  );

-- 添加更新策略：用户只能更新自己的记录
CREATE POLICY "用户可以更新自己的组织成员记录" ON org_members
  FOR UPDATE USING (
    -- 用户只能更新自己的记录
    user_id = auth.uid()
  );

-- 添加删除策略：用户只能删除自己的记录
CREATE POLICY "用户可以离开组织" ON org_members
  FOR DELETE USING (
    -- 用户只能删除自己的记录（离开组织）
    user_id = auth.uid()
  );

-- 为了确保策略正确，我们也检查并修复 organizations 表的策略
-- 删除可能有问题的策略并重新创建
DROP POLICY IF EXISTS "组织成员可以查看组织" ON organizations;
DROP POLICY IF EXISTS "组织管理员可以更新组织" ON organizations;

-- 重新创建 organizations 表的策略，使用更明确的逻辑
CREATE POLICY "组织成员可以查看组织" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM org_members om
      WHERE om.org_id = organizations.id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "组织管理员可以更新组织" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM org_members om
      WHERE om.org_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- 添加组织创建策略：任何认证用户都可以创建组织
CREATE POLICY "认证用户可以创建组织" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 添加组织删除策略：只有所有者可以删除组织
CREATE POLICY "组织所有者可以删除组织" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 
      FROM org_members om
      WHERE om.org_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- 添加注释说明修复内容
COMMENT ON POLICY "用户可以查看自己的组织成员记录" ON org_members IS 
'修复RLS递归问题：用户只能查看自己的org_members记录，完全避免递归查询';

COMMENT ON POLICY "用户可以加入组织" ON org_members IS 
'用户可以创建自己的组织成员记录';

COMMENT ON POLICY "用户可以更新自己的组织成员记录" ON org_members IS 
'用户只能更新自己的组织成员记录';

COMMENT ON POLICY "用户可以离开组织" ON org_members IS 
'用户可以删除自己的组织成员记录（离开组织）'; 