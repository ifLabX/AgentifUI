-- 删除SSO相关视图
-- 创建日期: 2025-01-08
-- 描述: 删除最新迁移文件中创建的视图，避免不必要的数据库对象

-- --- BEGIN COMMENT ---
-- 删除SSO用户统计视图
-- --- END COMMENT ---
DROP VIEW IF EXISTS sso_user_statistics;

-- --- BEGIN COMMENT ---
-- 确认视图已删除
-- --- END COMMENT --- 