-- Migration: 007_tournament_stats_schema
-- Add tournament_participants and player_tournament_stats tables
-- Created: 2026-05-19

-- Tournament participants (which teams are in which tournament)
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

-- Player tournament stats (goals, assists, cards per player per tournament)
CREATE TABLE IF NOT EXISTS player_tournament_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    age_class_id UUID REFERENCES age_classes(id) ON DELETE SET NULL,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, tournament_id, age_class_id)
);

-- Add RLS policies
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_tournament_stats ENABLE ROW LEVEL SECURITY;

-- Public can read tournament_participants
CREATE POLICY "Tournament participants are public" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Tournament participants admin write" ON tournament_participants FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

-- Public can read player_tournament_stats
CREATE POLICY "Player tournament stats are public" ON player_tournament_stats FOR SELECT USING (true);
CREATE POLICY "Player tournament stats admin write" ON player_tournament_stats FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

-- Updated_at trigger for player_tournament_stats
CREATE TRIGGER update_player_tournament_stats_updated_at BEFORE UPDATE ON player_tournament_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();