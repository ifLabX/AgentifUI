-- 北京信息科技大学SSO集成支持 - 数据部分
-- 创建日期: 2025-01-08
-- 描述: 添加对北信CAS统一认证系统的支持（数据和函数部分）

-- --- BEGIN COMMENT ---
-- 此迁移假设CAS枚举值已在前一个迁移中添加
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 添加学工号字段到profiles表
-- --- END COMMENT ---
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS employee_number TEXT;

-- --- BEGIN COMMENT ---
-- 2. 添加学工号唯一约束（如果字段已存在但没有约束）
-- --- END COMMENT ---
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_employee_number_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_employee_number_key UNIQUE (employee_number);
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 3. 添加索引优化查询性能
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_employee_number 
ON profiles(employee_number) WHERE employee_number IS NOT NULL;

-- --- BEGIN COMMENT ---
-- 4. 添加字段注释
-- --- END COMMENT ---
COMMENT ON COLUMN profiles.employee_number IS '学工号：北京信息科技大学统一身份标识';

-- --- BEGIN COMMENT ---
-- 5. 插入北京信息科技大学SSO提供商配置
-- --- END COMMENT ---
INSERT INTO sso_providers (
  id,
  name,
  protocol,
  settings,
  enabled,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '北京信息科技大学',
  'CAS'::sso_protocol,
  jsonb_build_object(
    'base_url', 'https://sso.bistu.edu.cn',
    'login_endpoint', '/login',
    'logout_endpoint', '/logout',
    'validate_endpoint', '/serviceValidate',
    'validate_endpoint_v3', '/p3/serviceValidate',
    'version', '2.0',
    'attributes_enabled', true,
    'description', '北京信息科技大学统一认证系统',
    'support_attributes', jsonb_build_array('employeeNumber', 'log_username')
  ),
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- --- BEGIN COMMENT ---
-- 6. 创建学工号查找函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION find_user_by_employee_number(emp_num TEXT)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  username TEXT,
  employee_number TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  auth_source TEXT,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- --- BEGIN COMMENT ---
  -- 验证输入参数
  -- --- END COMMENT ---
  IF emp_num IS NULL OR LENGTH(TRIM(emp_num)) = 0 THEN
    RAISE EXCEPTION 'Employee number cannot be null or empty';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.employee_number,
    p.last_login,
    p.auth_source,
    p.status
  FROM profiles p
  WHERE p.employee_number = TRIM(emp_num)
    AND p.status = 'active';
END;
$$;

-- --- BEGIN COMMENT ---
-- 7. 创建SSO用户创建函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION create_sso_user(
  emp_number TEXT,
  user_name TEXT,
  sso_provider_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- --- BEGIN COMMENT ---
  -- 验证输入参数
  -- --- END COMMENT ---
  IF emp_number IS NULL OR LENGTH(TRIM(emp_number)) = 0 THEN
    RAISE EXCEPTION 'Employee number cannot be null or empty';
  END IF;
  
  IF user_name IS NULL OR LENGTH(TRIM(user_name)) = 0 THEN
    RAISE EXCEPTION 'Username cannot be null or empty';
  END IF;
  
  IF sso_provider_uuid IS NULL THEN
    RAISE EXCEPTION 'SSO provider UUID cannot be null';
  END IF;

  -- --- BEGIN COMMENT ---
  -- 检查学工号是否已存在
  -- --- END COMMENT ---
  IF EXISTS (SELECT 1 FROM profiles WHERE employee_number = TRIM(emp_number)) THEN
    RAISE EXCEPTION 'Employee number % already exists', emp_number;
  END IF;

  -- 生成新的用户ID
  new_user_id := gen_random_uuid();
  
  -- --- BEGIN COMMENT ---
  -- 确保用户名唯一，如果冲突则添加数字后缀
  -- --- END COMMENT ---
  final_username := TRIM(user_name);
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := TRIM(user_name) || '_' || counter;
  END LOOP;
  
  -- --- BEGIN COMMENT ---
  -- 创建用户记录
  -- --- END COMMENT ---
  INSERT INTO profiles (
    id,
    employee_number,
    username,
    full_name,
    auth_source,
    sso_provider_id,
    status,
    role,
    created_at,
    updated_at,
    last_login
  ) VALUES (
    new_user_id,
    TRIM(emp_number),
    final_username,
    TRIM(user_name), -- 初始显示名使用用户名，后续可通过其他方式获取真实姓名
    'bistu_sso',
    sso_provider_uuid::TEXT,
    'active',
    'user',
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- --- BEGIN COMMENT ---
    -- 记录错误并重新抛出
    -- --- END COMMENT ---
    RAISE EXCEPTION 'Failed to create SSO user: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 8. 创建SSO用户登录时间更新函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION update_sso_user_login(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- --- BEGIN COMMENT ---
  -- 验证输入参数
  -- --- END COMMENT ---
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User UUID cannot be null';
  END IF;

  -- --- BEGIN COMMENT ---
  -- 更新最后登录时间
  -- --- END COMMENT ---
  UPDATE profiles 
  SET 
    last_login = NOW(),
    updated_at = NOW()
  WHERE id = user_uuid
    AND status = 'active';
  
  -- 返回是否更新成功
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update user login time: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 9. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION find_user_by_employee_number(TEXT) IS '根据学工号查找用户信息，用于SSO登录验证';
COMMENT ON FUNCTION create_sso_user(TEXT, TEXT, UUID) IS '创建北信SSO用户账户，自动处理用户名冲突';
COMMENT ON FUNCTION update_sso_user_login(UUID) IS '更新SSO用户最后登录时间';

-- --- BEGIN COMMENT ---
-- 10. 创建SSO相关的RLS策略
-- --- END COMMENT ---

-- 确保SSO用户可以查看自己的信息
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'sso_users_can_view_own_profile'
  ) THEN
    CREATE POLICY "sso_users_can_view_own_profile" ON profiles
      FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
          SELECT 1 FROM profiles admin_check 
          WHERE admin_check.id = auth.uid() 
          AND admin_check.role = 'admin'
        )
      );
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 11. 创建SSO统计视图（可选，用于管理员监控）
-- --- END COMMENT ---
CREATE OR REPLACE VIEW sso_user_statistics AS
SELECT 
  'bistu_sso'::text as provider_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d,
  COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users_7d,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
  MIN(created_at) as first_user_created,
  MAX(last_login) as last_login_time
FROM profiles 
WHERE auth_source = 'bistu_sso'
  AND status = 'active';

COMMENT ON VIEW sso_user_statistics IS '北信SSO用户统计信息，用于管理员监控和分析';

-- --- BEGIN COMMENT ---
-- 12. 授予必要的权限
-- --- END COMMENT ---

-- 确保认证用户可以执行SSO相关函数
GRANT EXECUTE ON FUNCTION find_user_by_employee_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_sso_user(TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_sso_user_login(UUID) TO authenticated;

-- 管理员可以查看SSO统计
GRANT SELECT ON sso_user_statistics TO authenticated; 