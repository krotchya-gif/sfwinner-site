-- Migration: 011_match_lineups.sql
-- Description: Add match lineups for pre-match starting lineup selection
-- Created: 2026-05-19

-- Match lineups table
CREATE TABLE IF NOT EXISTS match_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    is_starter BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_match_lineups_match ON match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_player ON match_lineups(player_id);

-- RLS
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

-- Lineups viewable by authenticated users
CREATE POLICY "Match lineups viewable by authenticated" ON match_lineups FOR SELECT USING (true);

-- Lineups editable by team coaches/admins
CREATE POLICY "Match lineups editable by team" ON match_lineups FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'coach')
    )
);

CREATE POLICY "Match lineups editable by team" ON match_lineups FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'coach')
    )
);

CREATE POLICY "Match lineups editable by team" ON match_lineups FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'coach')
    )
);