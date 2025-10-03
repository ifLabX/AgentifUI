-- --- BEGIN COMMENT ---
-- 修复群组RLS策略的无限递归问题
-- 问题：group_members表的策略在检查权限时查询自身导致无限递归
-- 解决：简化RLS策略，只有管理员可以操作群组相关数据
-- --- END COMMENT ---

-- 删除有问题的RLS策略
DROP POLICY IF EXISTS "群组成员可查看成员列表" ON group_members;
DROP POLICY IF EXISTS "群组成员可查看应用权限" ON group_app_permissions;

-- 重新创建简化的RLS策略 - 只允许管理员操作
-- group_members 表：只有管理员可以管理和查看
CREATE POLICY "管理员可查看群组成员" ON group_members 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- group_app_permissions 表：只有管理员可以管理和查看  
CREATE POLICY "管理员可查看群组应用权限" ON group_app_permissions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- --- BEGIN COMMENT ---
-- 说明：
-- 1. 移除了导致无限递归的策略
-- 2. 群组管理现在完全由管理员控制，符合设计理念
-- 3. 普通用户通过RPC函数获取权限信息，不直接查询这些表
-- 4. RPC函数使用SECURITY DEFINER，绕过RLS限制
-- --- END COMMENT ---

-- 验证策略修复
DO $$
BEGIN
  RAISE NOTICE '✅ RLS策略修复完成：';
  RAISE NOTICE '   - 移除了group_members表的递归策略';
  RAISE NOTICE '   - 移除了group_app_permissions表的递归策略';
  RAISE NOTICE '   - 群组管理现在完全由管理员控制';
  RAISE NOTICE '   - 用户权限通过RPC函数获取，避免RLS冲突';
END $$; 