-- --- BEGIN COMMENT ---
-- Fix UUID type conversion issue in SSO database function
-- Issue: column "sso_provider_id" is of type uuid but expression is of type text
-- Cause: The create_sso_user function incorrectly cast a UUID to TEXT.
-- Solution: Remove the incorrect ::TEXT cast and use the UUID type directly.
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. Fix the UUID type conversion issue in the create_sso_user function
-- The sso_provider_id column in the profiles table is of type UUID.
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
  -- Create the user record, ensuring data types match correctly.
  -- Key fix: The sso_provider_id field is of type UUID, so use the UUID value directly without casting to TEXT.
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
    TRIM(user_name),
    'cas_sso',                     -- TEXT value
    sso_provider_uuid,               -- Use UUID type directly, removing the incorrect ::TEXT cast
    'active'::account_status,        -- Enum type
    'user'::user_role,              -- Enum type
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- --- BEGIN COMMENT ---
    -- Log detailed error information and re-throw
    -- --- END COMMENT ---
    RAISE EXCEPTION 'Failed to create SSO user: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 2. Update function comments and permissions
-- --- END COMMENT ---
COMMENT ON FUNCTION create_sso_user(TEXT, TEXT, UUID) IS 
'Creates an SSO user account, fixing a UUID type conversion issue - sso_provider_id now uses the UUID type directly.';

-- --- BEGIN COMMENT ---
-- 3. Ensure function permissions are set correctly
-- --- END COMMENT ---
GRANT EXECUTE ON FUNCTION create_sso_user(TEXT, TEXT, UUID) TO service_role;

-- --- BEGIN COMMENT ---
-- Fix explanation:
-- 1. Removed the incorrect `sso_provider_uuid::TEXT` cast.
-- 2. Used the UUID type value directly for insertion into the `sso_provider_id` field.
-- 3. This resolves the "column sso_provider_id is of type uuid but expression is of type text" error.
-- 4. This aligns with the database design where profiles.sso_provider_id is defined as a UUID.
-- --- END COMMENT ---
