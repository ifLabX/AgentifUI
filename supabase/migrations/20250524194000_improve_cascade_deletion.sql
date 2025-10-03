-- 改进级联删除逻辑，处理孤儿组织和AI配置问题

-- 1. 创建函数来处理组织成员删除后的清理工作
CREATE OR REPLACE FUNCTION handle_org_member_deletion()
RETURNS TRIGGER AS $$
DECLARE
  remaining_members_count INTEGER;
BEGIN
  -- 检查删除成员后，组织是否还有其他成员
  SELECT COUNT(*) INTO remaining_members_count
  FROM org_members 
  WHERE org_id = OLD.org_id 
  AND id != OLD.id;
  
  IF remaining_members_count = 0 THEN
    -- 如果没有其他成员，删除组织及其相关数据
    -- ai_configs 会因为 ON DELETE CASCADE 自动删除
    DELETE FROM organizations WHERE id = OLD.org_id;
    
    RAISE NOTICE '已删除孤儿组织: %', OLD.org_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建触发器，在删除组织成员时检查是否需要清理孤儿组织
DROP TRIGGER IF EXISTS cleanup_orphan_organizations ON org_members;
CREATE TRIGGER cleanup_orphan_organizations
  AFTER DELETE ON org_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_org_member_deletion();

-- 3. 创建函数来处理用户删除前的组织权限转移
CREATE OR REPLACE FUNCTION handle_user_deletion_prep()
RETURNS TRIGGER AS $$
DECLARE
  org_record RECORD;
  new_owner_id UUID;
  total_members INTEGER;
BEGIN
  -- 查找用户是组织owner的所有组织
  FOR org_record IN 
    SELECT om.org_id, o.name as org_name
    FROM org_members om 
    JOIN organizations o ON o.id = om.org_id
    WHERE om.user_id = OLD.id 
    AND om.role = 'owner'
  LOOP
    -- 计算组织总成员数
    SELECT COUNT(*) INTO total_members
    FROM org_members 
    WHERE org_id = org_record.org_id;
    
    -- 如果只有一个成员（即将被删除的owner），跳过权限转移
    -- 组织将在成员删除后被自动清理
    IF total_members <= 1 THEN
      RAISE NOTICE '组织 % 将被删除（无其他成员）', org_record.org_name;
      CONTINUE;
    END IF;
    
    -- 尝试找到该组织的其他admin成员来接管
    SELECT user_id INTO new_owner_id
    FROM org_members 
    WHERE org_id = org_record.org_id 
    AND user_id != OLD.id 
    AND role = 'admin'
    ORDER BY created_at ASC  -- 选择最早加入的admin
    LIMIT 1;
    
    IF new_owner_id IS NOT NULL THEN
      -- 将admin提升为owner
      UPDATE org_members 
      SET role = 'owner', updated_at = CURRENT_TIMESTAMP
      WHERE org_id = org_record.org_id 
      AND user_id = new_owner_id;
      
      RAISE NOTICE '组织 % 的所有权已转移给admin用户: %', org_record.org_name, new_owner_id;
    ELSE
      -- 如果没有admin，尝试找到普通成员提升
      SELECT user_id INTO new_owner_id
      FROM org_members 
      WHERE org_id = org_record.org_id 
      AND user_id != OLD.id 
      AND role = 'member'
      ORDER BY created_at ASC  -- 选择最早加入的成员
      LIMIT 1;
      
      IF new_owner_id IS NOT NULL THEN
        -- 将member提升为owner
        UPDATE org_members 
        SET role = 'owner', updated_at = CURRENT_TIMESTAMP
        WHERE org_id = org_record.org_id 
        AND user_id = new_owner_id;
        
        RAISE NOTICE '组织 % 的所有权已转移给成员用户: %', org_record.org_name, new_owner_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建触发器，在删除用户前处理组织权限转移
DROP TRIGGER IF EXISTS handle_user_deletion_prep ON auth.users;
CREATE TRIGGER handle_user_deletion_prep
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion_prep();

-- 5. 添加约束确保组织操作的数据完整性
CREATE OR REPLACE FUNCTION validate_org_member_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- 对于UPDATE操作，确保不会移除组织的最后一个owner
  IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner' THEN
    IF NOT EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = OLD.org_id 
      AND id != OLD.id 
      AND role = 'owner'
    ) THEN
      RAISE EXCEPTION '不能移除组织的最后一个所有者';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器来验证组织成员操作
DROP TRIGGER IF EXISTS validate_org_member_operations ON org_members;
CREATE TRIGGER validate_org_member_operations
  BEFORE UPDATE ON org_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_org_member_operations();

-- 6. 创建清理孤儿数据的维护函数（可定期执行）
CREATE OR REPLACE FUNCTION cleanup_orphan_data()
RETURNS TABLE(
  cleanup_type text,
  records_affected integer
) AS $$
DECLARE
  orphan_orgs_count INTEGER;
  orphan_messages_count INTEGER;
  orphan_ai_configs_count INTEGER;
BEGIN
  -- 清理没有成员的组织
  WITH deleted_orgs AS (
    DELETE FROM organizations 
    WHERE id NOT IN (
      SELECT DISTINCT org_id 
      FROM org_members 
      WHERE org_id IS NOT NULL
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO orphan_orgs_count FROM deleted_orgs;
  
  -- 清理孤儿AI配置（如果外键约束没有正确设置）
  WITH deleted_configs AS (
    DELETE FROM ai_configs 
    WHERE org_id NOT IN (
      SELECT id FROM organizations
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO orphan_ai_configs_count FROM deleted_configs;
  
  -- 清理没有对话的孤儿消息（理论上不应该存在，但作为安全措施）
  WITH deleted_messages AS (
    DELETE FROM messages 
    WHERE conversation_id NOT IN (
      SELECT id FROM conversations
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO orphan_messages_count FROM deleted_messages;
  
  -- 返回清理统计
  RETURN QUERY VALUES 
    ('orphan_organizations', orphan_orgs_count),
    ('orphan_ai_configs', orphan_ai_configs_count),
    ('orphan_messages', orphan_messages_count);
  
  RAISE NOTICE '孤儿数据清理完成: 组织=%, AI配置=%, 消息=%', 
    orphan_orgs_count, orphan_ai_configs_count, orphan_messages_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建安全的批量清理函数（带事务控制）
CREATE OR REPLACE FUNCTION safe_cleanup_orphan_data(
  dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE(
  cleanup_type text,
  records_found integer,
  action_taken text
) AS $$
DECLARE
  orphan_orgs_count INTEGER;
  orphan_messages_count INTEGER;
  orphan_ai_configs_count INTEGER;
BEGIN
  -- 统计孤儿组织
  SELECT COUNT(*) INTO orphan_orgs_count
  FROM organizations 
  WHERE id NOT IN (
    SELECT DISTINCT org_id 
    FROM org_members 
    WHERE org_id IS NOT NULL
  );
  
  -- 统计孤儿AI配置
  SELECT COUNT(*) INTO orphan_ai_configs_count
  FROM ai_configs 
  WHERE org_id NOT IN (
    SELECT id FROM organizations
  );
  
  -- 统计孤儿消息
  SELECT COUNT(*) INTO orphan_messages_count
  FROM messages 
  WHERE conversation_id NOT IN (
    SELECT id FROM conversations
  );
  
  IF dry_run THEN
    -- 仅返回统计信息，不执行删除
    RETURN QUERY VALUES 
      ('orphan_organizations', orphan_orgs_count, 'DRY_RUN: Would delete'),
      ('orphan_ai_configs', orphan_ai_configs_count, 'DRY_RUN: Would delete'),
      ('orphan_messages', orphan_messages_count, 'DRY_RUN: Would delete');
  ELSE
    -- 执行实际清理
    PERFORM cleanup_orphan_data();
    RETURN QUERY VALUES 
      ('orphan_organizations', orphan_orgs_count, 'DELETED'),
      ('orphan_ai_configs', orphan_ai_configs_count, 'DELETED'),
      ('orphan_messages', orphan_messages_count, 'DELETED');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建索引以提升清理操作性能
-- 注意：在迁移中不能使用 CONCURRENTLY，改为普通索引创建
CREATE INDEX IF NOT EXISTS idx_org_members_org_id_role 
  ON org_members(org_id, role);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id_role 
  ON org_members(user_id, role);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON messages(conversation_id);

-- 刷新 Supabase 客户端缓存
NOTIFY pgrst, 'reload schema';