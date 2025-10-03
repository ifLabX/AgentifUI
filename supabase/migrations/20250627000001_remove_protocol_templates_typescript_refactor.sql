-- --- BEGIN COMMENT ---
-- SSO协议模板表删除迁移（TypeScript重构版）
-- 迁移版本: 20250627000001
-- 目的: 删除 sso_protocol_templates 表，使用 TypeScript 配置文件替代
-- 影响: 简化系统架构，提升类型安全性和开发体验
-- 重要: 此迁移将删除所有协议模板数据，请确保已备份必要信息
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 安全检查：确认表存在后再进行删除操作
-- --- END COMMENT ---
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sso_protocol_templates') THEN
    RAISE NOTICE 'Table sso_protocol_templates does not exist, skipping deletion';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting SSO protocol templates table deletion...';
END $$;

-- --- BEGIN COMMENT ---
-- 2. 删除相关的RLS策略（如果存在）
-- --- END COMMENT ---
DROP POLICY IF EXISTS "管理员可以访问SSO协议模板" ON sso_protocol_templates;

-- --- BEGIN COMMENT ---
-- 3. 删除相关的触发器（如果存在）
-- --- END COMMENT ---
DROP TRIGGER IF EXISTS update_sso_protocol_templates_modtime ON sso_protocol_templates;

-- --- BEGIN COMMENT ---
-- 4. 删除协议模板表（包括所有数据和注释）
-- --- END COMMENT ---
DROP TABLE IF EXISTS sso_protocol_templates CASCADE;

-- --- BEGIN COMMENT ---
-- 5. 验证迁移结果并输出确认信息
-- --- END COMMENT ---
DO $$
BEGIN
  -- 检查表是否已删除
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sso_protocol_templates') THEN
    RAISE EXCEPTION 'Migration failed: sso_protocol_templates table still exists';
  END IF;
  
  -- 检查策略是否已删除
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sso_protocol_templates' 
    AND policyname = '管理员可以访问SSO协议模板'
  ) THEN
    RAISE EXCEPTION 'Migration failed: RLS policy still exists';
  END IF;
  
  -- 检查触发器是否已删除
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_sso_protocol_templates_modtime'
  ) THEN
    RAISE EXCEPTION 'Migration failed: trigger still exists';
  END IF;
  
  RAISE NOTICE 'SSO Protocol Templates TypeScript refactor migration completed successfully';
  RAISE NOTICE 'All related components removed: table, RLS policies, triggers, and data';
  RAISE NOTICE 'Protocol templates are now managed via TypeScript configuration file: @lib/config/sso-protocol-definitions.ts';
END $$; 