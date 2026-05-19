-- Migration: 010_attendance_tracking.sql
-- Description: Add attendance tracking for players at sessions/matches
-- Created: 2026-05-19

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('training', 'match', 'tournament')),
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_player ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_date ON attendance(event_date);

-- RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Attendance viewable by authenticated" ON attendance;
DROP POLICY IF EXISTS "Attendance editable by team" ON attendance;

-- Attendance is viewable by authenticated users
CREATE POLICY "Attendance viewable by authenticated" ON attendance FOR SELECT USING (true);

-- Attendance can be inserted/updated by team coaches/admins
CREATE POLICY "Attendance editable by team" ON attendance FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (users.role IN ('super_admin', 'coach') OR users.team_id IN (
            SELECT team_id FROM players WHERE players.id = attendance.player_id
        ))
    )
);

CREATE POLICY "Attendance editable by team" ON attendance FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (users.role IN ('super_admin', 'coach') OR users.team_id IN (
            SELECT team_id FROM players WHERE players.id = attendance.player_id
        ))
    )
);