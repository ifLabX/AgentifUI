-- --- BEGIN COMMENT ---
-- 修复群组成员表的外键关系问题
-- 问题：group_members.user_id 引用 auth.users，但查询时关联 profiles 表
-- 解决：修改外键引用到 profiles 表，确保关系查询正确
-- --- END COMMENT ---

-- 首先删除现有的外键约束
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- 重新创建外键约束，引用 profiles 表而不是 auth.users
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 确保索引仍然存在
DROP INDEX IF EXISTS idx_group_members_user_id;
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- --- BEGIN COMMENT ---
-- 说明：
-- 1. 修改外键引用从 auth.users 改为 profiles
-- 2. 这样 group_members.user_id 可以直接关联 profiles 表
-- 3. 保持 ON DELETE CASCADE 确保用户删除时清理群组成员关系
-- 4. 重建索引确保查询性能
-- --- END COMMENT ---

-- 验证修复
DO $$
BEGIN
  RAISE NOTICE '✅ 群组成员外键关系修复完成：';
  RAISE NOTICE '   - group_members.user_id 现在引用 profiles(id)';
  RAISE NOTICE '   - 可以正确进行关系查询';
  RAISE NOTICE '   - 保持级联删除行为';
END $$; 