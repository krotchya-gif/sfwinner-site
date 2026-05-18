-- Migration: 006_fix_existing_auth_users
-- Fix users table to match auth.users IDs
-- Created: 2026-05-19

-- Update each user's id to match their auth.users id
DO $$
DECLARE
  auth_user_rec RECORD;
BEGIN
  -- Fix Super Admin
  SELECT id INTO auth_user_rec FROM auth.users WHERE email = 'sfwinner189@gmail.com';
  IF FOUND THEN
    UPDATE users SET id = auth_user_rec.id, team_id = NULL WHERE email = 'sfwinner189@gmail.com';
  END IF;

  -- Fix Futsal Coach
  SELECT id INTO auth_user_rec FROM auth.users WHERE email = 'subaru@sfwinner.site';
  IF FOUND THEN
    UPDATE users SET id = auth_user_rec.id, team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE email = 'subaru@sfwinner.site';
  END IF;

  -- Fix Basketball Coach
  SELECT id INTO auth_user_rec FROM auth.users WHERE email = 'basket@sfwinner.site';
  IF FOUND THEN
    UPDATE users SET id = auth_user_rec.id, team_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE email = 'basket@sfwinner.site';
  END IF;

  -- Fix Renang Coach
  SELECT id INTO auth_user_rec FROM auth.users WHERE email = 'renang@sfwinner.site';
  IF FOUND THEN
    UPDATE users SET id = auth_user_rec.id, team_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' WHERE email = 'renang@sfwinner.site';
  END IF;
END $$;