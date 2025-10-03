-- --- BEGIN COMMENT ---
-- 修复org_members表的外键关系
-- 将user_id的外键从auth.users(id)改为profiles(id)
-- 这样可以支持从profiles表直接关联查询org_members
-- --- END COMMENT ---

-- 1. 首先删除现有的外键约束
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_user_id_fkey;

-- 2. 重新创建外键约束，引用profiles表而不是auth.users表
ALTER TABLE org_members 
ADD CONSTRAINT org_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. 确保数据一致性 - 检查所有org_members中的user_id都存在于profiles表中
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  -- 检查是否有孤立的org_members记录
  SELECT COUNT(*) INTO missing_count
  FROM org_members om
  LEFT JOIN profiles p ON om.user_id = p.id
  WHERE p.id IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE '发现 % 条孤立的org_members记录，将被清理', missing_count;
    
    -- 删除孤立的记录
    DELETE FROM org_members 
    WHERE user_id NOT IN (SELECT id FROM profiles);
    
    RAISE NOTICE '已清理孤立的org_members记录';
  ELSE
    RAISE NOTICE 'org_members表数据一致性检查通过';
  END IF;
END $$;

-- 4. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);

-- 5. 添加注释说明
COMMENT ON TABLE org_members IS '组织成员关系表，关联profiles表而不是auth.users表';
COMMENT ON COLUMN org_members.user_id IS '用户ID，引用profiles.id而不是auth.users.id'; 