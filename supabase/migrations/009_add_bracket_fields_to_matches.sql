-- Migration: 009_add_bracket_fields_to_matches.sql
-- Description: Add bracket fields to matches table
-- Created: 2026-05-19

-- Add bracket-related fields to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round INTEGER DEFAULT 1;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- Create index for faster bracket queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_matches_next_match ON matches(next_match_id);