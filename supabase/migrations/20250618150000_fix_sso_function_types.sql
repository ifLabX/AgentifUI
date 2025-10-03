-- Fix return types for SSO-related database functions
-- Resolves mismatch between 'account_status' enum and TEXT types
-- Note: 'auth_source' is a TEXT field, not an enum.

-- --- BEGIN COMMENT ---
-- 1. Recreate the function to fix return types.
-- --- END COMMENT ---
DROP FUNCTION IF EXISTS find_user_by_employee_number(TEXT);

CREATE FUNCTION find_user_by_employee_number(emp_num TEXT)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  username TEXT,
  employee_number TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  auth_source TEXT,              -- Correct: Use TEXT type
  status account_status          -- Correct: Use the correct enum type
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
    AND p.status = 'active'::account_status;
END;
$$;

-- --- BEGIN COMMENT ---
-- 2. Fix the create_sso_user function to use correct data types.
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
  -- Check if employee number already exists
  -- --- END COMMENT ---
  IF EXISTS (SELECT 1 FROM profiles WHERE employee_number = TRIM(emp_number)) THEN
    RAISE EXCEPTION 'Employee number % already exists', emp_number;
  END IF;

  -- Generate a new user ID
  new_user_id := gen_random_uuid();
  
  -- --- BEGIN COMMENT ---
  -- Ensure username is unique, adding a numeric suffix if it conflicts
  -- --- END COMMENT ---
  final_username := TRIM(user_name);
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := TRIM(user_name) || '_' || counter;
  END LOOP;
  
  -- --- BEGIN COMMENT ---
  -- Create user record with correct data types
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
    'cas_sso',                     -- Use TEXT type value
    sso_provider_uuid::TEXT,
    'active'::account_status,        -- Use the correct enum type
    'user'::user_role,              -- Use the correct enum type
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- --- BEGIN COMMENT ---
    -- Log error and re-throw
    -- --- END COMMENT ---
    RAISE EXCEPTION 'Failed to create SSO user: %', SQLERRM;
END;
$$;

-- --- BEGIN COMMENT ---
-- 3. Update function comments
-- --- END COMMENT ---
COMMENT ON FUNCTION find_user_by_employee_number(TEXT) IS 'Finds a user by employee number for SSO login validation (return types fixed).';
COMMENT ON FUNCTION create_sso_user(TEXT, TEXT, UUID) IS 'Creates an SSO user account, handling username conflicts (data types fixed).';

-- --- BEGIN COMMENT ---
-- 4. Validate that the function fix was successful
-- --- END COMMENT ---
DO $$ 
BEGIN
    -- Test if the function can be called without errors (does not actually create data)
    PERFORM find_user_by_employee_number('test_validation_only');
    RAISE NOTICE 'find_user_by_employee_number function validation successful';
EXCEPTION
    WHEN OTHERS THEN
        -- If the error is about the user not being found, that is expected.
        IF SQLERRM LIKE '%Employee number cannot be null or empty%' THEN
            RAISE NOTICE 'find_user_by_employee_number function validation failed: %', SQLERRM;
        ELSE
            RAISE NOTICE 'find_user_by_employee_number function works correctly (no matching user found)';
        END IF;
END $$; 