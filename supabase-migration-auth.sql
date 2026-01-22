-- Migration: Add Supabase Auth integration to users table
-- Run this in Supabase SQL Editor

-- 1. Add auth_id and email columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Add email column to couriers table (for courier login)
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_couriers_email ON couriers(email);

-- 4. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for users table
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'ADMIN')
    );

-- Allow admins to insert/update/delete users
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'ADMIN')
    );

-- 6. For initial setup, create a permissive policy (remove after initial admin is created)
-- This allows the first user to be created without RLS blocking
CREATE POLICY "Allow initial setup" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- NOTE: After creating your admin account, run this to remove the permissive policy:
-- DROP POLICY "Allow initial setup" ON users;
