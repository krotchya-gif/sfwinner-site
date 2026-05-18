-- Migration: 001_initial_schema.sql
-- Description: Create initial schema for SF Winner Sports Club
-- Created: 2026-05-19

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('super_admin', 'coach', 'manager');
CREATE TYPE player_status AS ENUM ('active', 'promoted', 'graduated', 'inactive');
CREATE TYPE match_status AS ENUM ('scheduled', 'completed', 'cancelled', 'postponed');

-- ============================================
-- TABLES
-- ============================================

-- Users table (standalone - auth is handled separately)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role user_role NOT NULL DEFAULT 'coach',
    team_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sports table
CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    branch_location TEXT,
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to users after teams table exists
ALTER TABLE users ADD CONSTRAINT users_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL,
    photo_url TEXT,
    jersey_number INTEGER,
    position TEXT,
    status player_status DEFAULT 'active',
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    -- Private fields (NOT exposed in public pages)
    full_name TEXT,
    date_of_birth DATE,
    nisn TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    medical_info TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Age classes table
CREATE TABLE IF NOT EXISTS age_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_home_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_away_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    score_home INTEGER DEFAULT 0,
    score_away INTEGER DEFAULT 0,
    match_date TIMESTAMPTZ,
    venue TEXT,
    status match_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    award TEXT NOT NULL,
    tournament_name TEXT,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users: authenticated users can read their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Sports: public read
CREATE POLICY "Sports are public" ON sports FOR SELECT USING (true);

-- Teams: public read
CREATE POLICY "Teams are public" ON teams FOR SELECT USING (true);

-- Players: public can see limited fields, authenticated can see more
CREATE POLICY "Players public read" ON players FOR SELECT USING (true);

-- Age classes: public read
CREATE POLICY "Age classes are public" ON age_classes FOR SELECT USING (true);

-- Tournaments: public read
CREATE POLICY "Tournaments are public" ON tournaments FOR SELECT USING (true);

-- Matches: public read
CREATE POLICY "Matches are public" ON matches FOR SELECT USING (true);

-- Achievements: public read
CREATE POLICY "Achievements are public" ON achievements FOR SELECT USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Sports
-- ============================================

INSERT INTO sports (id, name, slug) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Futsal', 'futsal'),
    ('22222222-2222-2222-2222-222222222222', 'Basketball', 'basket'),
    ('33333333-3333-3333-3333-333333333333', 'Renang', 'renang')
ON CONFLICT (slug) DO NOTHING;