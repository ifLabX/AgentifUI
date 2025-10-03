-- SSO Integration Support - Data Part
-- Creation Date: 2025-01-08
-- Description: Adds support for a generic CAS-based SSO system (data and functions).

-- --- BEGIN COMMENT ---
-- This migration assumes that the 'CAS' enum value has been added in a previous migration.
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. Add employee_number field to the profiles table
-- --- END COMMENT ---
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS employee_number TEXT;

-- --- BEGIN COMMENT ---
-- 2. Add a unique constraint for employee_number if it doesn't already exist
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
-- 3. Add an index to optimize query performance
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_employee_number
ON profiles(employee_number) WHERE employee_number IS NOT NULL;

-- --- BEGIN COMMENT ---
-- 4. Add a comment to the field
-- --- END COMMENT ---
COMMENT ON COLUMN profiles.employee_number IS 'Employee ID: A unique identifier for SSO';

-- --- BEGIN COMMENT ---
-- 5. Insert a generic SSO provider configuration
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
  gen_random_uuid(),
  'CAS Provider',
  'CAS'::sso_protocol,
  jsonb_build_object(
    'ui', jsonb_build_object(
      'icon', '🏛️',
      'theme', 'primary'
    ),
    'security', jsonb_build_object(
      'require_https', true,
      'validate_certificates', true,
      'allowed_redirect_hosts', jsonb_build_array()
    ),
    'protocol_config', jsonb_build_object(
      'timeout', 10000,
      'version', '2.0',
      'base_url', 'https://your-cas-server.example.com',
      'endpoints', jsonb_build_object(
        'login', '/login',
        'logout', '/logout',
        'validate', '/serviceValidate',
        'validate_v3', '/p3/serviceValidate'
      ),
      'attributes_mapping', jsonb_build_object(
        'email', 'cas:mail',
        'username', 'cas:username',
        'full_name', 'cas:name',
        'employee_id', 'cas:user'
      )
    )
  ),
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- --- BEGIN COMMENT ---
-- 6. Create a function to find a user by employee number
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
  -- Validate input parameters
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
-- 7. Create a function to create an SSO user
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
  -- Validate input parameters
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
  -- Check if the employee number already exists
  -- --- END COMMENT ---
  IF EXISTS (SELECT 1 FROM profiles WHERE employee_number = TRIM(emp_number)) THEN
    RAISE EXCEPTION 'Employee number % already exists', emp_number;
  END IF;

  -- Generate a new user ID
  new_user_id := gen_random_uuid();

  -- --- BEGIN COMMENT ---
  -- Ensure the username is unique, adding a numeric suffix if it conflicts
  -- --- END COMMENT ---
  final_username := TRIM(user_name);
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := TRIM(user_name) || '_' || counter;
  END LOOP;

  -- --- BEGIN COMMENT ---
  -- Create the user record
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
    TRIM(user_name), -- Use the username as the initial display name
    'cas_sso',
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
    -- Log the error and re-throw
    -- --- END COMMENT ---
    RAISE EXCEPTION 'Failed to create SSO user: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 8. Create a function to update the login time for an SSO user
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION update_sso_user_login(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- --- BEGIN COMMENT ---
  -- Validate input parameters
  -- --- END COMMENT ---
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User UUID cannot be null';
  END IF;

  -- --- BEGIN COMMENT ---
  -- Update the last login time
  -- --- END COMMENT ---
  UPDATE profiles
  SET
    last_login = NOW(),
    updated_at = NOW()
  WHERE id = user_uuid
    AND status = 'active';

  -- Return whether the update was successful
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update user login time: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 9. Add comments to the functions
-- --- END COMMENT ---
COMMENT ON FUNCTION find_user_by_employee_number(TEXT) IS 'Finds a user by their employee number, for SSO login validation.';
COMMENT ON FUNCTION create_sso_user(TEXT, TEXT, UUID) IS 'Creates an SSO user account, automatically handling username conflicts.';
COMMENT ON FUNCTION update_sso_user_login(UUID) IS 'Updates the last login time for an SSO user.';

-- --- BEGIN COMMENT ---
-- 10. Create RLS policies related to SSO
-- --- END COMMENT ---

-- Ensure SSO users can view their own profiles
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
-- 11. Create an SSO statistics view (optional, for admin monitoring)
-- --- END COMMENT ---
CREATE OR REPLACE VIEW sso_user_statistics AS
SELECT
  'cas_sso'::text as provider_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d,
  COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users_7d,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
  MIN(created_at) as first_user_created,
  MAX(last_login) as last_login_time
FROM profiles
WHERE auth_source = 'cas_sso'
  AND status = 'active';

COMMENT ON VIEW sso_user_statistics IS 'SSO user statistics for admin monitoring and analysis.';

-- --- BEGIN COMMENT ---
-- 12. Grant necessary permissions
-- --- END COMMENT ---

-- Ensure authenticated users can execute SSO-related functions
GRANT EXECUTE ON FUNCTION find_user_by_employee_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_sso_user(TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_sso_user_login(UUID) TO authenticated;

-- Admins can view SSO statistics
GRANT SELECT ON sso_user_statistics TO authenticated; 