-- 第一步：添加 phone 认证类型到枚举
-- 解决 Database error saving new user 错误

-- --- BEGIN COMMENT ---
-- 更新 auth_source_type 枚举，添加 phone 认证类型
-- 注意：PostgreSQL要求先添加枚举值，再在新的迁移中使用
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 检查是否已经包含 phone 类型
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'phone' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auth_source_type')
  ) THEN
    ALTER TYPE auth_source_type ADD VALUE 'phone';
  END IF;
END $$; 