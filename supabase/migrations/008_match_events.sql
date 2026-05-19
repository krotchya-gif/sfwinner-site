-- Migration: 008_match_events.sql
-- Description: Add match_events table for timeline/chronological events
-- Created: 2026-05-19

-- Match events table for tracking chronological events during a match
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'goal', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out', 'penalty', 'own_goal'
    minute INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for match_events
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Match events are public" ON match_events FOR SELECT USING (true);

-- Authenticated users can insert (for team managers)
CREATE POLICY "Team managers can manage events" ON match_events FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        JOIN matches ON matches.team_home_id = users.team_id
        WHERE matches.id = match_events.match_id
        AND users.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Team managers can update events" ON match_events FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users
        JOIN matches ON matches.team_home_id = users.team_id
        WHERE matches.id = match_events.match_id
        AND users.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Team managers can delete events" ON match_events FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users
        JOIN matches ON matches.team_home_id = users.team_id
        WHERE matches.id = match_events.match_id
        AND users.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
);