-- Migration: 003_add_age_class_id_to_players
-- Add age_class_id column to players table
-- Created: 2026-05-19

ALTER TABLE players ADD COLUMN IF NOT EXISTS age_class_id UUID REFERENCES age_classes(id) ON DELETE SET NULL;