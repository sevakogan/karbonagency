-- Migration 004: Add company fields to clients table
-- UI renames "client" to "company" but table name stays the same

ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS setup_data JSONB DEFAULT '{}';
-- logo_url already exists from previous migration
