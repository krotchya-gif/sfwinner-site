-- Seed: seed.sql
-- Main seed file that includes all seed data
-- Created: 2026-05-19

-- ============================================
-- USERS (linked to Supabase Auth)
-- ============================================

INSERT INTO users (id, email, name, role, team_id) VALUES
    ('d8f825a4-728b-41cd-b3ed-d50d90b5cc5a', 'sfwinner189@gmail.com', 'Super Admin', 'super_admin', NULL),
    ('5c3e8b32-0204-445c-bf21-c612c640bdea', 'subaru@sfwinner.site', 'Subaru Pratama', 'coach', NULL),
    ('97a25c6e-34ff-4efb-a163-c96e89e21035', 'basket@sfwinner.site', 'Budi Santoso', 'coach', NULL),
    ('c968eb7d-4549-45dc-b1ad-da1a2ff211f4', 'renang@sfwinner.site', 'Ahmad Rizki', 'coach', NULL)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email;

-- ============================================
-- TEAMS
-- ============================================

DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
    -- Futsal Team
    INSERT INTO teams (id, name, slug, logo_url, branch_location, sport_id) VALUES
        (futsal_team_id, 'SF Winner Futsal', 'sf-winner-futsal', NULL, 'Jakarta Selatan', '11111111-1111-1111-1111-111111111111')
    ON CONFLICT (slug) DO NOTHING;

    -- Basketball Team
    INSERT INTO teams (id, name, slug, logo_url, branch_location, sport_id) VALUES
        (basket_team_id, 'SF Winner Basketball', 'sf-winner-basketball', NULL, 'Jakarta Pusat', '22222222-2222-2222-2222-222222222222')
    ON CONFLICT (slug) DO NOTHING;

    -- Renang Team
    INSERT INTO teams (id, name, slug, logo_url, branch_location, sport_id) VALUES
        (renang_team_id, 'SF Winner Renang', 'sf-winner-renang', NULL, 'Jakarta Barat', '33333333-3333-3333-3333-333333333333')
    ON CONFLICT (slug) DO NOTHING;

    -- Update coaches with team_id
    UPDATE users SET team_id = futsal_team_id WHERE email = 'subaru@sfwinner.site';
    UPDATE users SET team_id = basket_team_id WHERE email = 'basket@sfwinner.site';
    UPDATE users SET team_id = renang_team_id WHERE email = 'renang@sfwinner.site';
END $$;

-- ============================================
-- AGE CLASSES (6 per team)
-- ============================================

DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
    -- Futsal Age Classes
    INSERT INTO age_classes (name, min_age, max_age, team_id) VALUES
        ('U-8', 6, 8, futsal_team_id),
        ('U-10', 8, 10, futsal_team_id),
        ('U-12', 10, 12, futsal_team_id),
        ('U-14', 12, 14, futsal_team_id),
        ('U-16', 14, 16, futsal_team_id),
        ('U-18', 16, 18, futsal_team_id)
    ON CONFLICT DO NOTHING;

    -- Basketball Age Classes
    INSERT INTO age_classes (name, min_age, max_age, team_id) VALUES
        ('U-8', 6, 8, basket_team_id),
        ('U-10', 8, 10, basket_team_id),
        ('U-12', 10, 12, basket_team_id),
        ('U-14', 12, 14, basket_team_id),
        ('U-16', 14, 16, basket_team_id),
        ('U-18', 16, 18, basket_team_id)
    ON CONFLICT DO NOTHING;

    -- Renang Age Classes
    INSERT INTO age_classes (name, min_age, max_age, team_id) VALUES
        ('U-8', 6, 8, renang_team_id),
        ('U-10', 8, 10, renang_team_id),
        ('U-12', 10, 12, renang_team_id),
        ('U-14', 12, 14, renang_team_id),
        ('U-16', 14, 16, renang_team_id),
        ('U-18', 16, 18, renang_team_id)
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- TOURNAMENTS (3 per sport)
-- ============================================

DO $$
DECLARE
    futsal_sport_id UUID := '11111111-1111-1111-1111-111111111111';
    basket_sport_id UUID := '22222222-2222-2222-2222-222222222222';
    renang_sport_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    INSERT INTO tournaments (name, slug, description, location, start_date, end_date, sport_id) VALUES
        ('AJI Cup 2026', 'aji-cup-2026', 'Annual junior futsal tournament hosted by AJI Jakarta', 'Gelora Bung Karno', '2026-03-15', '2026-03-20', futsal_sport_id),
        ('Kopdar Championship', 'kopdar-championship', 'Community gathering futsal championship', 'Gor Jaya Raya', '2026-04-10', '2026-04-12', futsal_sport_id),
        ('Nusantara Sports Fest', 'nusantara-sports-fest-2026', 'Multi-sport youth championship', 'ICE BSD', '2026-05-01', '2026-05-05', futsal_sport_id),
        ('AJI Cup 2026', 'aji-cup-basket-2026', 'Annual junior basketball tournament', 'Gelora Bung Karno', '2026-03-15', '2026-03-20', basket_sport_id),
        ('Kopdar Championship', 'kopdar-basket-championship', 'Community basketball championship', 'GOR Pelita', '2026-04-10', '2026-04-12', basket_sport_id),
        ('Nusantara Sports Fest', 'nusantara-basket-fest-2026', 'Multi-sport youth championship', 'ICE BSD', '2026-05-01', '2026-05-05', basket_sport_id),
        ('AJI Cup 2026', 'aji-cup-renang-2026', 'Annual junior swimming championship', 'Eka Suit', '2026-03-15', '2026-03-20', renang_sport_id),
        ('Kopdar Championship', 'kopdar-renang-championship', 'Community swimming championship', 'Kalimalang Aquatic Center', '2026-04-10', '2026-04-12', renang_sport_id),
        ('Nusantara Sports Fest', 'nusantara-renang-fest-2026', 'Multi-sport youth championship', 'JIEXPO', '2026-05-01', '2026-05-05', renang_sport_id);
END $$;

-- ============================================
-- MATCHES (6 per sport)
-- ============================================

DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    t1_futsu UUID; t2_futsu UUID; t3_futsu UUID;
    t1_basket UUID; t2_basket UUID; t3_basket UUID;
    t1_renang UUID; t2_renang UUID; t3_renang UUID;
BEGIN
    SELECT id INTO t1_futsu FROM tournaments WHERE slug = 'aji-cup-2026' AND sport_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO t2_futsu FROM tournaments WHERE slug = 'kopdar-championship' AND sport_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO t3_futsu FROM tournaments WHERE slug = 'nusantara-sports-fest-2026' AND sport_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO t1_basket FROM tournaments WHERE slug = 'aji-cup-basket-2026' AND sport_id = '22222222-2222-2222-2222-222222222222';
    SELECT id INTO t2_basket FROM tournaments WHERE slug = 'kopdar-basket-championship' AND sport_id = '22222222-2222-2222-2222-222222222222';
    SELECT id INTO t3_basket FROM tournaments WHERE slug = 'nusantara-basket-fest-2026' AND sport_id = '22222222-2222-2222-2222-222222222222';
    SELECT id INTO t1_renang FROM tournaments WHERE slug = 'aji-cup-renang-2026' AND sport_id = '33333333-3333-3333-3333-333333333333';
    SELECT id INTO t2_renang FROM tournaments WHERE slug = 'kopdar-renang-championship' AND sport_id = '33333333-3333-3333-3333-333333333333';
    SELECT id INTO t3_renang FROM tournaments WHERE slug = 'nusantara-renang-fest-2026' AND sport_id = '33333333-3333-3333-3333-333333333333';

    INSERT INTO matches (team_home_id, team_away_id, tournament_id, score_home, score_away, match_date, venue, status) VALUES
        (futsal_team_id, NULL, t1_futsu, 3, 1, '2026-03-16 10:00:00', 'Gelora Bung Karno', 'completed'),
        (futsal_team_id, NULL, t1_futsu, 2, 0, '2026-03-17 14:00:00', 'Gelora Bung Karno', 'completed'),
        (futsal_team_id, NULL, t2_futsu, 5, 2, '2026-04-11 09:00:00', 'Gor Jaya Raya', 'completed'),
        (futsal_team_id, NULL, t2_futsu, 4, 1, '2026-04-11 16:00:00', 'Gor Jaya Raya', 'completed'),
        (futsal_team_id, NULL, t3_futsu, 2, 2, '2026-05-02 11:00:00', 'ICE BSD', 'completed'),
        (futsal_team_id, NULL, t3_futsu, 4, 0, '2026-05-03 15:00:00', 'ICE BSD', 'completed'),
        (basket_team_id, NULL, t1_basket, 78, 65, '2026-03-16 10:00:00', 'Gelora Bung Karno', 'completed'),
        (basket_team_id, NULL, t1_basket, 85, 72, '2026-03-17 14:00:00', 'Gelora Bung Karno', 'completed'),
        (basket_team_id, NULL, t2_basket, 92, 88, '2026-04-11 09:00:00', 'GOR Pelita', 'completed'),
        (basket_team_id, NULL, t2_basket, 81, 79, '2026-04-11 16:00:00', 'GOR Pelita', 'completed'),
        (basket_team_id, NULL, t3_basket, 88, 76, '2026-05-02 11:00:00', 'ICE BSD', 'completed'),
        (basket_team_id, NULL, t3_basket, 95, 68, '2026-05-03 15:00:00', 'ICE BSD', 'completed'),
        (renang_team_id, NULL, t1_renang, 45, 38, '2026-03-16 08:00:00', 'Eka Suit Aquatic Center', 'completed'),
        (renang_team_id, NULL, t1_renang, 42, 40, '2026-03-16 09:30:00', 'Eka Suit Aquatic Center', 'completed'),
        (renang_team_id, NULL, t2_renang, 38, 35, '2026-04-10 10:00:00', 'Kalimalang Aquatic Center', 'completed'),
        (renang_team_id, NULL, t2_renang, 41, 37, '2026-04-10 14:00:00', 'Kalimalang Aquatic Center', 'completed'),
        (renang_team_id, NULL, t3_renang, 44, 39, '2026-05-01 08:00:00', 'JIEXPO Aquatic', 'completed'),
        (renang_team_id, NULL, t3_renang, 40, 42, '2026-05-01 10:00:00', 'JIEXPO Aquatic', 'completed');
END $$;

-- ============================================
-- PLAYERS (10-12 per team)
-- ============================================

DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
BEGIN
    INSERT INTO players (display_name, jersey_number, position, status, team_id, full_name, date_of_birth, nisn, parent_name, parent_phone, medical_info, address) VALUES
        ('Reza Saputra', 1, 'Goalkeeper', 'active', futsal_team_id, 'Reza Saputra', '2012-03-15', '12345678', 'Hendra Saputra', '081234567890', 'Tidak ada', 'Jl. Melati No. 10, Jakarta'),
        ('Dimas Pratama', 2, 'Defender', 'active', futsal_team_id, 'Dimas Pratama', '2012-05-20', '12345679', 'Joko Pratama', '081234567891', 'Tidak ada', 'Jl. Mawar No. 5, Jakarta'),
        ('Farhan Hakim', 3, 'Defender', 'active', futsal_team_id, 'Farhan Hakim', '2012-01-10', '12345680', 'Ahmad Hakim', '081234567892', 'Tidak ada', 'Jl. Anggrek No. 8, Jakarta'),
        ('Galih Putra', 4, 'Midfielder', 'active', futsal_team_id, 'Galih Putra', '2012-07-22', '12345681', 'Dedi Putra', '081234567893', 'Tidak ada', 'Jl. Kenanga No. 12, Jakarta'),
        ('Rizky Ramadhan', 5, 'Forward', 'active', futsal_team_id, 'Rizky Ramadhan', '2012-09-05', '12345682', 'Budi Ramadhan', '081234567894', 'Tidak ada', 'Jl. Dahlia No. 3, Jakarta'),
        ('Bagus Setiawan', 6, 'Midfielder', 'active', futsal_team_id, 'Bagus Setiawan', '2010-04-18', '12345683', 'Heri Setiawan', '081234567895', 'Tidak ada', 'Jl. Jeruk No. 15, Jakarta'),
        ('Wahyu Nugroho', 7, 'Forward', 'active', futsal_team_id, 'Wahyu Nugroho', '2010-11-30', '12345684', 'Slamet Nugroho', '081234567896', 'Tidak ada', 'Jl. Lemon No. 7, Jakarta'),
        ('Doni Fernando', 8, 'Goalkeeper', 'active', futsal_team_id, 'Doni Fernando', '2010-02-14', '12345685', 'John Fernando', '081234567897', 'Tidak ada', 'Jl. Mangga No. 20, Jakarta'),
        ('Fajar Ibrahim', 9, 'Defender', 'active', futsal_team_id, 'Fajar Ibrahim', '2014-06-25', '12345686', 'Ibrahim Hasan', '081234567898', 'Tidak ada', 'Jl. Apel No. 11, Jakarta'),
        ('Gilang Permana', 10, 'Midfielder', 'active', futsal_team_id, 'Gilang Permana', '2014-08-12', '12345687', 'Toni Permana', '081234567899', 'Tidak ada', 'Jl. Duren No. 9, Jakarta'),
        ('Hendra Kusuma', 11, 'Forward', 'active', futsal_team_id, 'Hendra Kusuma', '2014-12-03', '12345688', 'Rudi Kusuma', '081234567800', 'Tidak ada', 'Jl. Jambu No. 4, Jakarta'),
        ('Indra Gunawan', 12, 'Midfielder', 'active', futsal_team_id, 'Indra Gunawan', '2016-02-28', '12345689', 'Gunawan Saleh', '081234567801', 'Tidak ada', 'Jl. Nanas No. 6, Jakarta'),
        ('Andre Wijaya', 1, 'Point Guard', 'active', basket_team_id, 'Andre Wijaya', '2010-01-15', '22345678', 'David Wijaya', '081234568001', 'Tidak ada', 'Jl. Sudirman No. 50, Jakarta'),
        ('Bobby Chen', 2, 'Shooting Guard', 'active', basket_team_id, 'Bobby Chen', '2010-03-22', '22345679', 'John Chen', '081234568002', 'Tidak ada', 'Jl. Thamrin No. 30, Jakarta'),
        ('Chandra Putra', 3, 'Small Forward', 'active', basket_team_id, 'Chandra Putra', '2010-05-10', '22345680', 'Baba Putra', '081234568003', 'Tidak ada', 'Jl. Gatot Subroto No. 20, Jakarta'),
        ('Daniel Lee', 4, 'Power Forward', 'active', basket_team_id, 'Daniel Lee', '2010-07-18', '22345681', 'Steven Lee', '081234568004', 'Tidak ada', 'Jl. HR Rasuna Said No. 15, Jakarta'),
        ('Eko Prasetyo', 5, 'Center', 'active', basket_team_id, 'Eko Prasetyo', '2010-09-25', '22345682', 'Jimin Prasetyo', '081234568005', 'Tidak ada', 'Jl. Mega Kuningan No. 8, Jakarta'),
        ('Felix Tanoto', 6, 'Point Guard', 'active', basket_team_id, 'Felix Tanoto', '2012-04-12', '22345683', 'Robert Tanoto', '081234568006', 'Tidak ada', 'Jl. Kyai Tapa No. 25, Jakarta'),
        ('Garry Widjaja', 7, 'Shooting Guard', 'active', basket_team_id, 'Garry Widjaja', '2012-06-30', '22345684', 'Henry Widjaja', '081234568007', 'Tidak ada', 'Jl. Letjen Suprapto No. 40, Jakarta'),
        ('Hadi Susanto', 8, 'Small Forward', 'active', basket_team_id, 'Hadi Susanto', '2012-08-05', '22345685', 'Doni Susanto', '081234568008', 'Tidak ada', 'Jl. Ahmad Yani No. 35, Jakarta'),
        ('Ivan Lie', 9, 'Power Forward', 'active', basket_team_id, 'Ivan Lie', '2014-02-20', '22345686', 'Lie Ching', '081234568009', 'Tidak ada', 'Jl. Pangeran Diponegoro No. 18, Jakarta'),
        ('Jefri Tanoto', 10, 'Center', 'active', basket_team_id, 'Jefri Tanoto', '2014-10-15', '22345687', 'Lie Junior', '081234568010', 'Tidak ada', 'Jl. Imam Bonjol No. 22, Jakarta'),
        ('Kevin Hartono', 11, 'Shooting Guard', 'active', basket_team_id, 'Kevin Hartono', '2016-01-08', '22345688', 'John Hartono', '081234568011', 'Tidak ada', 'Jl. Latuharhary No. 12, Jakarta'),
        ('Alif Rizki', 1, 'Freestyle', 'active', renang_team_id, 'Alif Rizki', '2012-03-10', '32345678', 'Kadir Rizki', '081234569001', 'Tidak ada', 'Jl. Puri Indah No. 15, Jakarta'),
        ('Bayu Firmansyah', 2, 'Backstroke', 'active', renang_team_id, 'Bayu Firmansyah', '2012-05-22', '32345679', 'Firman Abdillah', '081234569002', 'Tidak ada', 'Jl. Town Center No. 8, Jakarta'),
        ('Cakra Wibowo', 3, 'Breaststroke', 'active', renang_team_id, 'Cakra Wibowo', '2012-07-14', '32345680', 'Dharma Wibowo', '081234569003', 'Tidak ada', 'Jl. Kamal No. 20, Jakarta'),
        ('Dani Mahendra', 4, 'Butterfly', 'active', renang_team_id, 'Dani Mahendra', '2010-02-28', '32345681', 'Mahendra Satria', '081234569004', 'Tidak ada', 'Jl. Kembangan No. 12, Jakarta'),
        ('Eko Santoso', 5, 'Freestyle', 'active', renang_team_id, 'Eko Santoso', '2010-04-05', '32345682', 'Santo Djoyo', '081234569005', 'Tidak ada', 'Jl. Duri Kosambi No. 25, Jakarta'),
        ('Fikri Haikal', 6, 'Backstroke', 'active', renang_team_id, 'Fikri Haikal', '2010-08-19', '32345683', 'Haikal Basri', '081234569006', 'Tidak ada', 'Jl. Cengkareng No. 18, Jakarta'),
        ('Gading Jewaru', 7, 'Individual Medley', 'active', renang_team_id, 'Gading Jewaru', '2014-01-30', '32345684', 'Jewaru Nugroho', '081234569007', 'Tidak ada', 'Jl. Daan Mogot No. 45, Jakarta'),
        ('Haris Lubis', 8, 'Freestyle', 'active', renang_team_id, 'Haris Lubis', '2014-06-12', '32345685', 'Lubis Harun', '081234569008', 'Tidak ada', 'Jl. Pinangsia No. 10, Jakarta'),
        ('Irfan Dzaky', 9, 'Breaststroke', 'active', renang_team_id, 'Irfan Dzaky', '2016-03-25', '32345686', 'Dzaky Pramono', '081234569009', 'Tidak ada', 'Jl. Grogol No. 30, Jakarta'),
        ('Jovan Wicaksono', 10, 'Butterfly', 'active', renang_team_id, 'Jovan Wicaksono', '2016-09-08', '32345687', 'Wicaksono H', '081234569010', 'Tidak ada', 'Jl. Tambora No. 5, Jakarta'),
        ('Kenzo Wijaya', 11, 'Backstroke', 'active', renang_team_id, 'Kenzo Wijaya', '2018-05-15', '32345688', 'Wijaya Kurnia', '081234569011', 'Tidak ada', 'Jl. Petojo Utara No. 8, Jakarta');
END $$;

-- ============================================
-- ACHIEVEMENTS (5 per sport)
-- ============================================

DO $$
DECLARE
    futsal_team_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    basket_team_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    renang_team_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    p1_futsu UUID; p2_futsu UUID; p3_futsu UUID; p4_futsu UUID; p5_futsu UUID;
    p1_basket UUID; p2_basket UUID; p3_basket UUID; p4_basket UUID; p5_basket UUID;
    p1_renang UUID; p2_renang UUID; p3_renang UUID; p4_renang UUID; p5_renang UUID;
BEGIN
    SELECT id INTO p1_futsu FROM players WHERE team_id = futsal_team_id ORDER BY created_at LIMIT 1;
    SELECT id INTO p2_futsu FROM players WHERE team_id = futsal_team_id ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO p3_futsu FROM players WHERE team_id = futsal_team_id ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO p4_futsu FROM players WHERE team_id = futsal_team_id ORDER BY created_at LIMIT 1 OFFSET 3;
    SELECT id INTO p5_futsu FROM players WHERE team_id = futsal_team_id ORDER BY created_at LIMIT 1 OFFSET 4;
    SELECT id INTO p1_basket FROM players WHERE team_id = basket_team_id ORDER BY created_at LIMIT 1;
    SELECT id INTO p2_basket FROM players WHERE team_id = basket_team_id ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO p3_basket FROM players WHERE team_id = basket_team_id ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO p4_basket FROM players WHERE team_id = basket_team_id ORDER BY created_at LIMIT 1 OFFSET 3;
    SELECT id INTO p5_basket FROM players WHERE team_id = basket_team_id ORDER BY created_at LIMIT 1 OFFSET 4;
    SELECT id INTO p1_renang FROM players WHERE team_id = renang_team_id ORDER BY created_at LIMIT 1;
    SELECT id INTO p2_renang FROM players WHERE team_id = renang_team_id ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO p3_renang FROM players WHERE team_id = renang_team_id ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO p4_renang FROM players WHERE team_id = renang_team_id ORDER BY created_at LIMIT 1 OFFSET 3;
    SELECT id INTO p5_renang FROM players WHERE team_id = renang_team_id ORDER BY created_at LIMIT 1 OFFSET 4;

    INSERT INTO achievements (player_id, award, tournament_name, date) VALUES
        (p1_futsu, 'Best Goalkeeper', 'AJI Cup 2026', '2026-03-20'),
        (p3_futsu, 'Top Scorer', 'AJI Cup 2026', '2026-03-20'),
        (p2_futsu, 'Best Defender', 'Kopdar Championship', '2026-04-12'),
        (p1_futsu, 'Best Goalkeeper', 'Nusantara Sports Fest', '2026-05-05'),
        (p5_futsu, 'MVP', 'Nusantara Sports Fest', '2026-05-05'),
        (p1_basket, 'Best Point Guard', 'AJI Cup 2026', '2026-03-20'),
        (p3_basket, 'Best Small Forward', 'AJI Cup 2026', '2026-03-20'),
        (p2_basket, 'Best Shooting Guard', 'Kopdar Championship', '2026-04-12'),
        (p5_basket, 'Best Center', 'Nusantara Sports Fest', '2026-05-05'),
        (p4_basket, 'MVP', 'Nusantara Sports Fest', '2026-05-05'),
        (p1_renang, 'Best Freestyle', 'AJI Cup 2026', '2026-03-20'),
        (p2_renang, 'Best Backstroke', 'AJI Cup 2026', '2026-03-20'),
        (p3_renang, 'Best Breaststroke', 'Kopdar Championship', '2026-04-12'),
        (p4_renang, 'Best Overall', 'Nusantara Sports Fest', '2026-05-05'),
        (p5_renang, 'Most Improved', 'Nusantara Sports Fest', '2026-05-05');
END $$;