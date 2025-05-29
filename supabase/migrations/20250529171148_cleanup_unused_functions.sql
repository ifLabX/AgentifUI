-- 清理不需要的用户管理数据库函数
-- 这些函数已被 TypeScript 中的直接查询替代

-- 删除复杂的用户列表函数（如果存在）
DROP FUNCTION IF EXISTS public.get_user_list(user_role, account_status, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

-- 删除简化的用户列表函数（如果存在）  
DROP FUNCTION IF EXISTS public.get_user_list_simple(user_role, account_status, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

-- 删除用户计数函数（如果存在）
DROP FUNCTION IF EXISTS public.get_user_count(user_role, account_status, TEXT, TEXT);

-- 注释：保留以下重要函数和视图：
-- - auth.is_admin() 函数：用于权限检查
-- - public.user_management_view 视图：用于用户列表查询
-- - public.get_user_stats() 函数：用于统计信息
-- - public.get_user_detail() 函数：用于用户详情查询 