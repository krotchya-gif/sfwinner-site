-- Migration: 002_fix_team_assignments
-- Fix team_id assignments for coaches
-- Created: 2026-05-19

-- Team IDs
DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
    -- Update coach team assignments
    UPDATE users SET team_id = futsal_team_id WHERE email = 'subaru@sfwinner.site';
    UPDATE users SET team_id = basket_team_id WHERE email = 'basket@sfwinner.site';
    UPDATE users SET team_id = renang_team_id WHERE email = 'renang@sfwinner.site';
END $$;