-- --- BEGIN COMMENT ---
-- 删除已废弃的管理员视图和相关函数
-- 这些视图和函数已不再使用，系统已完全迁移到新的函数架构
-- --- END COMMENT ---

-- 删除废弃的admin_user_management_view视图
DROP VIEW IF EXISTS public.admin_user_management_view CASCADE;

-- 删除相关的废弃函数（如果存在）
DROP FUNCTION IF EXISTS public.get_admin_user_list() CASCADE;
DROP FUNCTION IF EXISTS public.admin_user_stats() CASCADE;

-- 添加注释说明迁移原因
COMMENT ON SCHEMA public IS '已迁移到新的用户管理架构：使用get_admin_users和get_user_stats RPC函数替代废弃的视图'; 