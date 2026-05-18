-- Seed: 001_create_superadmin.sql
-- Description: Create initial super admin user
-- Created: 2026-05-19
-- Usage: Run AFTER creating auth user in Supabase Dashboard

-- ============================================
-- INSTRUCTIONS
-- ============================================
--
-- STEP 1: Go to Supabase Dashboard > Authentication > Users > Add user
--         Create user with email: admin@sfwinner.site
--         Copy the USER ID from the user row
--
-- STEP 2: Replace 'YOUR_USER_ID_HERE' below with the copied USER ID
--
-- STEP 3: Run this SQL in Supabase Dashboard > SQL Editor
--
-- ============================================

-- Replace this with actual user ID from Supabase Auth
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- SET @superadmin_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- CREATE SUPERADMIN USER
-- ============================================

INSERT INTO users (id, email, name, role, team_id)
VALUES (
    'YOUR_USER_ID_HERE',  -- Replace with actual Supabase Auth user ID
    'admin@sfwinner.site',
    'Super Admin',
    'super_admin',
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    updated_at = NOW();

-- Verify
-- SELECT id, email, name, role FROM users WHERE role = 'super_admin';