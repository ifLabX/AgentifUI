-- 修复PostgreSQL枚举类型事务问题
-- 创建日期: 2025-01-08
-- 描述: 分离枚举值添加和使用到不同的事务中

-- --- BEGIN COMMENT ---
-- 1. 首先检查并添加CAS枚举值（如果不存在）
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 检查CAS枚举值是否已存在
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CAS' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sso_protocol')
  ) THEN
    ALTER TYPE sso_protocol ADD VALUE 'CAS';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 提交当前事务，确保枚举值在下个事务中可用
-- PostgreSQL要求枚举值添加后需要在新事务中才能使用
-- --- END COMMENT --- 