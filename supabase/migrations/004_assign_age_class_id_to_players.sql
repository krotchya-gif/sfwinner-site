-- Migration: 004_assign_age_class_id_to_players
-- Assign age_class_id to existing players based on birth year approximation
-- Created: 2026-05-19

DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    ac_u8_futsu UUID; ac_u10_futsu UUID; ac_u12_futsu UUID; ac_u14_futsu UUID; ac_u16_futsu UUID; ac_u18_futsu UUID;
    ac_u8_basket UUID; ac_u10_basket UUID; ac_u12_basket UUID; ac_u14_basket UUID; ac_u16_basket UUID; ac_u18_basket UUID;
    ac_u8_renang UUID; ac_u10_renang UUID; ac_u12_renang UUID; ac_u14_renang UUID; ac_u16_renang UUID; ac_u18_renang UUID;
BEGIN
    -- Get age class IDs for Futsal
    SELECT id INTO ac_u8_futsu FROM age_classes WHERE name = 'U-8' AND team_id = futsal_team_id;
    SELECT id INTO ac_u10_futsu FROM age_classes WHERE name = 'U-10' AND team_id = futsal_team_id;
    SELECT id INTO ac_u12_futsu FROM age_classes WHERE name = 'U-12' AND team_id = futsal_team_id;
    SELECT id INTO ac_u14_futsu FROM age_classes WHERE name = 'U-14' AND team_id = futsal_team_id;
    SELECT id INTO ac_u16_futsu FROM age_classes WHERE name = 'U-16' AND team_id = futsal_team_id;
    SELECT id INTO ac_u18_futsu FROM age_classes WHERE name = 'U-18' AND team_id = futsal_team_id;

    -- Get age class IDs for Basketball
    SELECT id INTO ac_u8_basket FROM age_classes WHERE name = 'U-8' AND team_id = basket_team_id;
    SELECT id INTO ac_u10_basket FROM age_classes WHERE name = 'U-10' AND team_id = basket_team_id;
    SELECT id INTO ac_u12_basket FROM age_classes WHERE name = 'U-12' AND team_id = basket_team_id;
    SELECT id INTO ac_u14_basket FROM age_classes WHERE name = 'U-14' AND team_id = basket_team_id;
    SELECT id INTO ac_u16_basket FROM age_classes WHERE name = 'U-16' AND team_id = basket_team_id;
    SELECT id INTO ac_u18_basket FROM age_classes WHERE name = 'U-18' AND team_id = basket_team_id;

    -- Get age class IDs for Renang
    SELECT id INTO ac_u8_renang FROM age_classes WHERE name = 'U-8' AND team_id = renang_team_id;
    SELECT id INTO ac_u10_renang FROM age_classes WHERE name = 'U-10' AND team_id = renang_team_id;
    SELECT id INTO ac_u12_renang FROM age_classes WHERE name = 'U-12' AND team_id = renang_team_id;
    SELECT id INTO ac_u14_renang FROM age_classes WHERE name = 'U-14' AND team_id = renang_team_id;
    SELECT id INTO ac_u16_renang FROM age_classes WHERE name = 'U-16' AND team_id = renang_team_id;
    SELECT id INTO ac_u18_renang FROM age_classes WHERE name = 'U-18' AND team_id = renang_team_id;

    -- Assign age_class_id to Futsal players based on position (for U-14/U-16 split)
    -- Futsal players 1-5 = U-14, 6-8 = U-16, 9-11 = U-12, 12 = U-10
    UPDATE players SET age_class_id = ac_u14_futsu WHERE team_id = futsal_team_id AND jersey_number IN (1,2,3,4,5);
    UPDATE players SET age_class_id = ac_u16_futsu WHERE team_id = futsal_team_id AND jersey_number IN (6,7,8);
    UPDATE players SET age_class_id = ac_u12_futsu WHERE team_id = futsal_team_id AND jersey_number IN (9,10,11);
    UPDATE players SET age_class_id = ac_u10_futsu WHERE team_id = futsal_team_id AND jersey_number = 12;

    -- Assign age_class_id to Basketball players
    -- Players 1-5 = U-16, 6-9 = U-14, 10-11 = U-12, 12 = U-10
    UPDATE players SET age_class_id = ac_u16_basket WHERE team_id = basket_team_id AND jersey_number IN (1,2,3,4,5);
    UPDATE players SET age_class_id = ac_u14_basket WHERE team_id = basket_team_id AND jersey_number IN (6,7,8,9);
    UPDATE players SET age_class_id = ac_u12_basket WHERE team_id = basket_team_id AND jersey_number IN (10,11);
    UPDATE players SET age_class_id = ac_u10_basket WHERE team_id = basket_team_id AND jersey_number = 12;

    -- Assign age_class_id to Renang players
    -- Players 1-3 = U-14, 4-6 = U-16, 7-8 = U-12, 9-10 = U-10, 11 = U-8
    UPDATE players SET age_class_id = ac_u14_renang WHERE team_id = renang_team_id AND jersey_number IN (1,2,3);
    UPDATE players SET age_class_id = ac_u16_renang WHERE team_id = renang_team_id AND jersey_number IN (4,5,6);
    UPDATE players SET age_class_id = ac_u12_renang WHERE team_id = renang_team_id AND jersey_number IN (7,8);
    UPDATE players SET age_class_id = ac_u10_renang WHERE team_id = renang_team_id AND jersey_number IN (9,10);
    UPDATE players SET age_class_id = ac_u8_renang WHERE team_id = renang_team_id AND jersey_number = 11;
END $$;