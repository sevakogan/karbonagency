-- Migration 005: Add theme preference to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';
