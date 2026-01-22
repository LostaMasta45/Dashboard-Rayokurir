-- Link admin user rayokurir@gmail.com to public.users table
-- Run this after creating the admin user in Supabase Auth

-- Step 1: Get the auth user ID (run this first to see the ID)
-- SELECT id, email FROM auth.users WHERE email = 'rayokurir@gmail.com';

-- Step 2: Update existing admin user OR insert new one
-- Replace 'YOUR-AUTH-USER-ID' with the actual UUID from step 1

-- Option A: If you have an existing 'admin' user in public.users
UPDATE users 
SET auth_id = (SELECT id FROM auth.users WHERE email = 'rayokurir@gmail.com'),
    email = 'rayokurir@gmail.com'
WHERE username = 'admin';

-- Option B: If no existing user, insert new admin
INSERT INTO users (auth_id, email, username, name, role)
SELECT 
    id,
    'rayokurir@gmail.com',
    'admin',
    'Super Admin',
    'ADMIN'
FROM auth.users 
WHERE email = 'rayokurir@gmail.com'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'rayokurir@gmail.com');

-- Verify the link
SELECT id, username, email, role, auth_id FROM users WHERE role = 'ADMIN';
