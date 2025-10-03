-- --- BEGIN COMMENT ---
-- 群组权限系统：删除复杂的组织+部门架构，创建简单的群组权限控制
-- 设计理念：群组只是成员集合，创建者拥有所有权限
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 第一步：清理旧架构（如果存在）
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 第二步：完全清理旧架构
-- --- END COMMENT ---

-- 删除所有RLS策略
DROP POLICY IF EXISTS "用户可以查看自己部门的应用权限" ON department_app_permissions;
DROP POLICY IF EXISTS "组织管理员可以管理部门应用权限" ON department_app_permissions;
DROP POLICY IF EXISTS "用户可以查看自己的组织成员信息" ON org_members;
DROP POLICY IF EXISTS "组织管理员可以管理成员" ON org_members;
DROP POLICY IF EXISTS "组织成员可以查看成员列表" ON org_members;
DROP POLICY IF EXISTS "组织成员可以查看组织信息" ON organizations;
DROP POLICY IF EXISTS "组织管理员可以更新组织信息" ON organizations;
DROP POLICY IF EXISTS "管理员可以查看所有组织" ON organizations;
DROP POLICY IF EXISTS "organizations_select_for_members" ON organizations;
DROP POLICY IF EXISTS "组织成员可以查看组织" ON organizations;
DROP POLICY IF EXISTS "组织管理员可以更新组织" ON organizations;
DROP POLICY IF EXISTS "org_members_select_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON org_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON org_members;
DROP POLICY IF EXISTS "管理员和用户可以更新组织成员记录" ON org_members;

-- 删除所有函数
DROP FUNCTION IF EXISTS get_user_accessible_apps(UUID);
DROP FUNCTION IF EXISTS check_user_app_permission(UUID, UUID);
DROP FUNCTION IF EXISTS increment_app_usage(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_org_department_info();
DROP FUNCTION IF EXISTS sync_department_permissions();
DROP FUNCTION IF EXISTS get_permission_sync_status();
DROP FUNCTION IF EXISTS batch_update_department_permissions(JSONB);
DROP FUNCTION IF EXISTS get_user_departments(UUID);

-- 删除视图和触发器
DROP VIEW IF EXISTS user_organization_departments;
DROP TRIGGER IF EXISTS update_department_app_permissions_modtime ON department_app_permissions;
DROP TRIGGER IF EXISTS update_org_members_modtime ON org_members;
DROP TRIGGER IF EXISTS update_organizations_modtime ON organizations;

-- 删除表
DROP TABLE IF EXISTS department_app_permissions CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 删除枚举
DROP TYPE IF EXISTS org_member_role CASCADE;

-- --- BEGIN COMMENT ---
-- 第二步：创建群组架构
-- --- END COMMENT ---

-- 1. 群组表
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 群组成员表 - 无角色层级，只有成员关系
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. 群组应用权限表
CREATE TABLE group_app_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  service_instance_id UUID REFERENCES service_instances(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT TRUE,
  usage_quota INTEGER, -- NULL = 无限制
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, service_instance_id)
);

-- --- BEGIN COMMENT ---
-- 第三步：创建必要的索引
-- --- END COMMENT ---
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_app_permissions_group_id ON group_app_permissions(group_id);
CREATE INDEX idx_group_app_permissions_service_instance_id ON group_app_permissions(service_instance_id);

-- --- BEGIN COMMENT ---
-- 第四步：RLS策略（管理员权限控制）
-- --- END COMMENT ---

-- groups 表：只有管理员可以管理群组
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可查看所有群组" ON groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "管理员可创建群组" ON groups FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "管理员可管理群组" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "管理员可删除群组" ON groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- group_members 表：管理员可管理，群组成员可查看
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "群组成员可查看成员列表" ON group_members 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
  );
CREATE POLICY "管理员可管理成员" ON group_members 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- group_app_permissions 表：管理员可管理，群组成员可查看
ALTER TABLE group_app_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "群组成员可查看应用权限" ON group_app_permissions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_app_permissions.group_id AND gm.user_id = auth.uid())
  );
CREATE POLICY "管理员可管理应用权限" ON group_app_permissions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- --- BEGIN COMMENT ---
-- 第五步：更新应用可见性
-- --- END COMMENT ---
UPDATE service_instances SET visibility = 'group_only' WHERE visibility = 'org_only';
ALTER TABLE service_instances DROP CONSTRAINT IF EXISTS service_instances_visibility_check;
ALTER TABLE service_instances ADD CONSTRAINT service_instances_visibility_check 
CHECK (visibility IN ('public', 'group_only', 'private'));

-- --- BEGIN COMMENT ---
-- 第六步：核心RPC函数
-- --- END COMMENT ---

-- 获取用户可访问的应用
CREATE OR REPLACE FUNCTION get_user_accessible_apps(p_user_id UUID)
RETURNS TABLE (
  service_instance_id UUID,
  display_name TEXT,
  description TEXT,
  instance_id TEXT,
  api_path TEXT,
  visibility TEXT,
  config JSONB,
  usage_quota INTEGER,
  used_count INTEGER,
  quota_remaining INTEGER,
  group_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.display_name,
    si.description,
    si.instance_id,
    si.api_path,
    si.visibility::TEXT,
    si.config,
    gap.usage_quota,
    gap.used_count,
    CASE 
      WHEN gap.usage_quota IS NULL THEN NULL
      ELSE GREATEST(0, gap.usage_quota - gap.used_count)
    END,
    g.name
  FROM service_instances si
  LEFT JOIN group_app_permissions gap ON si.id = gap.service_instance_id AND gap.is_enabled = true
  LEFT JOIN group_members gm ON gap.group_id = gm.group_id AND gm.user_id = p_user_id
  LEFT JOIN groups g ON gm.group_id = g.id
  WHERE 
    si.visibility = 'public'
    OR (si.visibility = 'group_only' AND gm.user_id IS NOT NULL)
    OR (si.visibility = 'private' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = p_user_id AND p.role = 'admin'))
  ORDER BY si.display_name;
END;
$$;

-- 检查用户应用权限
CREATE OR REPLACE FUNCTION check_user_app_permission(p_user_id UUID, p_service_instance_id UUID)
RETURNS TABLE (has_access BOOLEAN, quota_remaining INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visibility TEXT;
  v_user_role TEXT;
  v_quota INTEGER;
  v_used_count INTEGER;
BEGIN
  SELECT visibility INTO v_visibility FROM service_instances WHERE id = p_service_instance_id;
  
  IF v_visibility IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, '应用不存在'::TEXT;
    RETURN;
  END IF;
  
  IF v_visibility = 'public' THEN
    RETURN QUERY SELECT true, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;
  
  IF v_visibility = 'private' THEN
    RETURN QUERY SELECT (v_user_role = 'admin'), NULL::INTEGER, 
      CASE WHEN v_user_role = 'admin' THEN NULL ELSE '需要管理员权限'::TEXT END;
    RETURN;
  END IF;
  
  IF v_visibility = 'group_only' THEN
    SELECT gap.usage_quota, gap.used_count INTO v_quota, v_used_count
    FROM group_app_permissions gap
    JOIN group_members gm ON gap.group_id = gm.group_id
    WHERE gap.service_instance_id = p_service_instance_id
      AND gm.user_id = p_user_id
      AND gap.is_enabled = true;
    
    IF v_quota IS NULL AND v_used_count IS NULL THEN
      RETURN QUERY SELECT false, NULL::INTEGER, '无群组权限'::TEXT;
      RETURN;
    END IF;
    
    IF v_quota IS NOT NULL AND v_used_count >= v_quota THEN
      RETURN QUERY SELECT false, 0, '配额已用完'::TEXT;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 
      CASE WHEN v_quota IS NULL THEN NULL ELSE GREATEST(0, v_quota - v_used_count) END,
      NULL::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT false, NULL::INTEGER, '未知应用类型'::TEXT;
END;
$$;

-- 增加使用量
CREATE OR REPLACE FUNCTION increment_app_usage(p_user_id UUID, p_service_instance_id UUID, p_increment INTEGER DEFAULT 1)
RETURNS TABLE (success BOOLEAN, new_used_count INTEGER, quota_remaining INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visibility TEXT;
  v_new_count INTEGER;
  v_quota INTEGER;
BEGIN
  SELECT visibility INTO v_visibility FROM service_instances WHERE id = p_service_instance_id;
  
  IF v_visibility IN ('public', 'private') THEN
    RETURN QUERY SELECT true, 0, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  IF v_visibility = 'group_only' THEN
    UPDATE group_app_permissions gap
    SET used_count = used_count + p_increment
    FROM group_members gm
    WHERE gap.service_instance_id = p_service_instance_id
      AND gap.group_id = gm.group_id
      AND gm.user_id = p_user_id
      AND gap.is_enabled = true
    RETURNING gap.used_count, gap.usage_quota INTO v_new_count, v_quota;
    
    IF v_new_count IS NULL THEN
      RETURN QUERY SELECT false, 0, NULL::INTEGER, '无权限'::TEXT;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT true, v_new_count,
      CASE WHEN v_quota IS NULL THEN NULL ELSE GREATEST(0, v_quota - v_new_count) END,
      NULL::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT false, 0, NULL::INTEGER, '未知应用类型'::TEXT;
END;
$$;

-- --- BEGIN COMMENT ---
-- 第七步：添加注释
-- --- END COMMENT ---
COMMENT ON TABLE groups IS '群组表 - 管理员可管理的用户群组';
COMMENT ON TABLE group_members IS '群组成员表 - 纯成员关系，无角色层级';
COMMENT ON TABLE group_app_permissions IS '群组应用权限表 - 启用/禁用 + 配额控制';

-- --- BEGIN COMMENT ---
-- 第八步：迁移完成日志
-- --- END COMMENT ---
DO $$
BEGIN
  RAISE NOTICE '✅ 群组权限系统迁移完成：';
  RAISE NOTICE '   - 删除复杂的组织+部门+角色架构';
  RAISE NOTICE '   - 创建简单的群组成员关系';
  RAISE NOTICE '   - 权限逻辑：public(全员) | group_only(成员) | private(管理员)';
  RAISE NOTICE '   - 群组管理：只有管理员可管理，普通用户暂不可见';
  RAISE NOTICE '   - 配额控制：群组级别的使用量统计';
END $$; 