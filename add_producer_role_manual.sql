-- Manual SQL script to add 'producer' role
-- Run this script in your Supabase database SQL editor

-- Add 'producer' role to the role enum
-- First, create a new enum type with the additional role
CREATE TYPE user_role_new AS ENUM ('admin', 'senior', 'operator', 'producer');

-- Update the auth_users table to use the new enum type
ALTER TABLE auth_users 
  ALTER COLUMN role TYPE user_role_new 
  USING role::text::user_role_new;

-- Drop the old enum type
DROP TYPE user_role;

-- Rename the new enum type to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Update the default value to ensure it's still 'operator'
ALTER TABLE auth_users ALTER COLUMN role SET DEFAULT 'operator';

-- Add a comment to document the new role
COMMENT ON TYPE user_role IS 'User roles: admin (full access), senior (task completion + user management), operator (basic access), producer (read-only hard drives + task creation without assignments)';

-- Verify the change
SELECT unnest(enum_range(NULL::user_role)) as available_roles; 